// Assets need a ticker, address(sc), chain, decimal config and price.
import { ChainId } from "./chains";

export interface Asset {
  ticker: string;
  symbol: string;
  name: string;
  decimals: number;
  // Chain-specific addresses
  addresses: Partial<Record<ChainId, string>>;
}

export enum AssetId {
  BTC = "BTC",
  ETH = "ETH",
  USDC = "USDC",
  WBTC = "WBTC",
}

// Native token address placeholder
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const assets: Record<AssetId, Asset> = {
  [AssetId.BTC]: {
    ticker: "BTC",
    symbol: "BTC",
    name: "Bitcoin",
    decimals: 8,
    addresses: {
      [ChainId.BTC]: NATIVE_TOKEN,
      [ChainId.LIGHTNING]: NATIVE_TOKEN,
    },
  },
  [AssetId.ETH]: {
    ticker: "ETH",
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    addresses: {
      [ChainId.UNICHAIN]: NATIVE_TOKEN,
    },
  },
  [AssetId.USDC]: {
    ticker: "USDC",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    addresses: {
      [ChainId.UNICHAIN]: "0x078d782b760474a361dda0af3839290b0ef57ad6",
    },
  },
  [AssetId.WBTC]: {
    ticker: "WBTC",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    addresses: {
      [ChainId.UNICHAIN]: "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
    },
  },
};

// Helper function to get asset address on a specific chain
export function getAssetAddress(
  assetId: AssetId,
  chainId: ChainId,
): string | undefined {
  return assets[assetId].addresses[chainId];
}

// Helper function to check if asset is available on a chain
export function isAssetAvailable(assetId: AssetId, chainId: ChainId): boolean {
  return !!assets[assetId].addresses[chainId];
}
