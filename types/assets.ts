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
      // WBTC on various chains
      [ChainId.ETHEREUM]: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    }
  },
  [AssetId.ETH]: {
    ticker: "ETH",
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    addresses: {
      [ChainId.ETHEREUM]: NATIVE_TOKEN,
      [ChainId.BASE]: NATIVE_TOKEN,
      [ChainId.UNICHAIN]: NATIVE_TOKEN,
    }
  },
  [AssetId.USDC]: {
    ticker: "USDC",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    addresses: {
      [ChainId.ETHEREUM]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      [ChainId.BASE]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      // Add other chain addresses as needed
    }
  }
};

// Helper function to get asset address on a specific chain
export function getAssetAddress(assetId: AssetId, chainId: ChainId): string | undefined {
  return assets[assetId].addresses[chainId];
}

// Helper function to check if asset is available on a chain
export function isAssetAvailable(assetId: AssetId, chainId: ChainId): boolean {
  return !!assets[assetId].addresses[chainId];
}
