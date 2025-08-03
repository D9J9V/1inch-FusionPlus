import { NextRequest, NextResponse } from 'next/server';
import { ChainId, ChainType, chains } from '@/types/chains';
import { AssetId, getAssetAddress } from '@/types/assets';

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;
const ONEINCH_API_URL = 'https://api.1inch.dev/price/v1.1';

// Chain IDs mapping for 1inch API
const ONEINCH_CHAIN_IDS: Partial<Record<ChainId, number>> = {
  [ChainId.UNICHAIN]: 1301, // Unichain mainnet ID (placeholder - update when available)
  // Add more as needed
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromChain = searchParams.get('fromChain') as ChainId;
    const toChain = searchParams.get('toChain') as ChainId;
    const fromAsset = searchParams.get('fromAsset') as AssetId;
    const toAsset = searchParams.get('toAsset') as AssetId;
    const amount = searchParams.get('amount');

    if (!fromChain || !toChain || !fromAsset || !toAsset || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate chains exist
    if (!chains[fromChain] || !chains[toChain]) {
      return NextResponse.json(
        { success: false, error: 'Invalid chain' },
        { status: 400 }
      );
    }

    if (!ONEINCH_API_KEY) {
      // Return mock prices if no API key
      return getMockPrice(fromAsset, toAsset, parseFloat(amount));
    }

    // Check if this involves Bitcoin/Lightning
    const fromChainType = chains[fromChain].type;
    const toChainType = chains[toChain].type;
    const isBitcoinInvolved = 
      fromChainType === ChainType.BITCOIN || 
      fromChainType === ChainType.LIGHTNING ||
      toChainType === ChainType.BITCOIN || 
      toChainType === ChainType.LIGHTNING;

    if (isBitcoinInvolved) {
      // For Bitcoin swaps, we need to handle pricing differently
      return getBitcoinPrice(fromChain, toChain, fromAsset, toAsset, parseFloat(amount));
    }

    // For EVM to EVM, use 1inch price API
    const fromChainId = ONEINCH_CHAIN_IDS[fromChain];
    const toChainId = ONEINCH_CHAIN_IDS[toChain];

    if (!fromChainId || !toChainId) {
      return getMockPrice(fromAsset, toAsset, parseFloat(amount));
    }

    const fromAddress = getAssetAddress(fromAsset, fromChain);
    const toAddress = getAssetAddress(toAsset, toChain);

    if (!fromAddress || !toAddress) {
      return NextResponse.json(
        { success: false, error: 'Asset not available on selected chain' },
        { status: 400 }
      );
    }

    // Call 1inch price API
    const url = `${ONEINCH_API_URL}/${fromChainId}/${fromAddress}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ONEINCH_API_KEY}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status}`);
    }

    const data = await response.json();
    const fromTokenPriceUSD = parseFloat(data[fromAddress] || 0);

    // Get price for destination token
    const toUrl = `${ONEINCH_API_URL}/${toChainId}/${toAddress}`;
    const toResponse = await fetch(toUrl, {
      headers: {
        'Authorization': `Bearer ${ONEINCH_API_KEY}`,
        'Accept': 'application/json',
      }
    });

    const toData = await toResponse.json();
    const toTokenPriceUSD = parseFloat(toData[toAddress] || 0);

    if (fromTokenPriceUSD === 0 || toTokenPriceUSD === 0) {
      return getMockPrice(fromAsset, toAsset, parseFloat(amount));
    }

    const outputAmount = (parseFloat(amount) * fromTokenPriceUSD) / toTokenPriceUSD;

    return NextResponse.json({
      success: true,
      inputAmount: parseFloat(amount),
      outputAmount: outputAmount,
      fromPriceUSD: fromTokenPriceUSD,
      toPriceUSD: toTokenPriceUSD,
      source: '1inch'
    });

  } catch (error) {
    console.error('Error fetching price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch price' },
      { status: 500 }
    );
  }
}

async function getBitcoinPrice(
  fromChain: ChainId,
  toChain: ChainId,
  fromAsset: AssetId,
  toAsset: AssetId,
  amount: number
): Promise<NextResponse> {
  // For demo, use mock prices
  // In production, integrate with Bitcoin price APIs
  const mockPrices: Record<AssetId, number> = {
    [AssetId.BTC]: 65000,
    [AssetId.ETH]: 3800,
    [AssetId.USDC]: 1,
  };

  const fromPrice = mockPrices[fromAsset];
  const toPrice = mockPrices[toAsset];

  if (!fromPrice || !toPrice) {
    return NextResponse.json(
      { success: false, error: 'Price not available for asset' },
      { status: 400 }
    );
  }

  const outputAmount = (amount * fromPrice) / toPrice;

  return NextResponse.json({
    success: true,
    inputAmount: amount,
    outputAmount: outputAmount,
    fromPriceUSD: fromPrice,
    toPriceUSD: toPrice,
    source: 'mock'
  });
}

function getMockPrice(fromAsset: AssetId, toAsset: AssetId, amount: number): NextResponse {
  const mockPrices: Record<AssetId, number> = {
    [AssetId.BTC]: 65000,
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
    source: 'mock'
  });
}