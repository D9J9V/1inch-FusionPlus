import { NextRequest, NextResponse } from "next/server";
import { ChainId, ChainType, chains } from "@/types/chains";
import { AssetId, getAssetAddress } from "@/types/assets";

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;
const ONEINCH_API_URL = "https://api.1inch.dev/price/v1.1";

// Chain IDs mapping for 1inch API
const ONEINCH_CHAIN_IDS: Partial<Record<ChainId, number>> = {
  [ChainId.UNICHAIN]: 130,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromChain = searchParams.get("fromChain") as ChainId;
    const toChain = searchParams.get("toChain") as ChainId;
    const fromAsset = searchParams.get("fromAsset") as AssetId;
    const toAsset = searchParams.get("toAsset") as AssetId;
    const amount = searchParams.get("amount");

    if (!fromChain || !toChain || !fromAsset || !toAsset || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Validate chains exist
    if (!chains[fromChain] || !chains[toChain]) {
      return NextResponse.json(
        { success: false, error: "Invalid chain" },
        { status: 400 },
      );
    }

    // Always try to use 1inch API when available
    const fromChainType = chains[fromChain].type;
    const toChainType = chains[toChain].type;

    // Determine if we need to use WBTC proxy for Bitcoin pricing
    const isBitcoinInvolved =
      fromChainType === ChainType.BITCOIN ||
      fromChainType === ChainType.LIGHTNING ||
      toChainType === ChainType.BITCOIN ||
      toChainType === ChainType.LIGHTNING;

    // Map Bitcoin to WBTC for pricing purposes when dealing with cross-chain swaps
    let priceFromAsset = fromAsset;
    let priceToAsset = toAsset;
    let priceFromChain = fromChain;
    let priceToChain = toChain;

    if (isBitcoinInvolved) {
      // Use Unichain for all price lookups
      priceFromChain = ChainId.UNICHAIN;
      priceToChain = ChainId.UNICHAIN;

      // Map BTC to WBTC for pricing
      if (fromAsset === AssetId.BTC) {
        priceFromAsset = AssetId.WBTC;
      }
      if (toAsset === AssetId.BTC) {
        priceToAsset = AssetId.WBTC;
      }
    }

    // Use 1inch price API - always use Unichain for pricing
    const chainId = ONEINCH_CHAIN_IDS[ChainId.UNICHAIN];

    if (!chainId) {
      return getMockPrice(fromAsset, toAsset, parseFloat(amount));
    }

    const fromAddress = getAssetAddress(priceFromAsset, ChainId.UNICHAIN);
    const toAddress = getAssetAddress(priceToAsset, ChainId.UNICHAIN);

    if (!fromAddress || !toAddress) {
      return NextResponse.json(
        { success: false, error: "Asset not available for pricing" },
        { status: 400 },
      );
    }

    // If no API key, return mock prices
    if (!ONEINCH_API_KEY) {
      return getMockPrice(fromAsset, toAsset, parseFloat(amount));
    }

    try {
      // Get prices from 1inch API
      const pricesUrl = `${ONEINCH_API_URL}/${chainId}`;
      const tokenList = [fromAddress, toAddress].join(",");

      const response = await fetch(`${pricesUrl}?addresses=${tokenList}`, {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`1inch API error: ${response.status}`);
        return getMockPrice(fromAsset, toAsset, parseFloat(amount));
      }

      const data = await response.json();
      const fromTokenPriceUSD = parseFloat(
        data[fromAddress.toLowerCase()] || 0,
      );
      const toTokenPriceUSD = parseFloat(data[toAddress.toLowerCase()] || 0);

      if (fromTokenPriceUSD === 0 || toTokenPriceUSD === 0) {
        return getMockPrice(fromAsset, toAsset, parseFloat(amount));
      }

      const outputAmount =
        (parseFloat(amount) * fromTokenPriceUSD) / toTokenPriceUSD;

      return NextResponse.json({
        success: true,
        inputAmount: parseFloat(amount),
        outputAmount: outputAmount,
        fromPriceUSD: fromTokenPriceUSD,
        toPriceUSD: toTokenPriceUSD,
        exchangeRate: outputAmount / parseFloat(amount),
        source: "1inch",
      });
    } catch (error) {
      console.error("Error fetching 1inch prices:", error);
      return getMockPrice(fromAsset, toAsset, parseFloat(amount));
    }
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch price" },
      { status: 500 },
    );
  }
}

async function getBitcoinPrice(
  fromChain: ChainId,
  toChain: ChainId,
  fromAsset: AssetId,
  toAsset: AssetId,
  amount: number,
): Promise<NextResponse> {
  // For cross-chain swaps involving Bitcoin, we need to handle WBTC pricing
  const fromChainType = chains[fromChain].type;
  const toChainType = chains[toChain].type;

  // Mock prices including WBTC
  const mockPrices: Record<AssetId, number> = {
    [AssetId.BTC]: 65000,
    [AssetId.WBTC]: 64900, // Slightly lower due to wrapping premium
    [AssetId.ETH]: 3800,
    [AssetId.USDC]: 1,
  };

  // For Bitcoin to EVM swaps, use WBTC price for the EVM side
  let effectiveFromAsset = fromAsset;
  let effectiveToAsset = toAsset;

  if (
    fromChainType === ChainType.BITCOIN ||
    fromChainType === ChainType.LIGHTNING
  ) {
    // From Bitcoin to EVM
    if (toChainType === ChainType.EVM) {
      // We're comparing BTC to WBTC/ETH/USDC
      effectiveFromAsset = AssetId.BTC;
      // If they want to receive "BTC" on EVM, they actually get WBTC
      if (toAsset === AssetId.BTC) {
        effectiveToAsset = AssetId.WBTC;
      }
    }
  } else if (fromChainType === ChainType.EVM) {
    // From EVM to Bitcoin
    if (
      toChainType === ChainType.BITCOIN ||
      toChainType === ChainType.LIGHTNING
    ) {
      // If they're sending "BTC" from EVM, they're actually sending WBTC
      if (fromAsset === AssetId.BTC) {
        effectiveFromAsset = AssetId.WBTC;
      }
      effectiveToAsset = AssetId.BTC;
    }
  }

  const fromPrice = mockPrices[effectiveFromAsset];
  const toPrice = mockPrices[effectiveToAsset];

  if (!fromPrice || !toPrice) {
    return NextResponse.json(
      { success: false, error: "Price not available for asset" },
      { status: 400 },
    );
  }

  const outputAmount = (amount * fromPrice) / toPrice;

  return NextResponse.json({
    success: true,
    inputAmount: amount,
    outputAmount: outputAmount,
    fromPriceUSD: fromPrice,
    toPriceUSD: toPrice,
    exchangeRate: outputAmount / amount,
    source: "mock",
  });
}

function getMockPrice(
  fromAsset: AssetId,
  toAsset: AssetId,
  amount: number,
): NextResponse {
  const mockPrices: Record<AssetId, number> = {
    [AssetId.BTC]: 65000,
    [AssetId.WBTC]: 64900,
    [AssetId.ETH]: 3800,
    [AssetId.USDC]: 1,
  };

  const fromPrice = mockPrices[fromAsset] || 1;
  const toPrice = mockPrices[toAsset] || 1;
  const outputAmount = (amount * fromPrice) / toPrice;

  return NextResponse.json({
    success: true,
    inputAmount: amount,
    outputAmount: outputAmount,
    fromPriceUSD: fromPrice,
    toPriceUSD: toPrice,
    exchangeRate: outputAmount / amount,
    source: "mock",
  });
}
