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
    }
  },
  [AssetId.ETH]: {
    ticker: "ETH",
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    addresses: {
      [ChainId.UNICHAIN]: NATIVE_TOKEN,
    }
  },
  [AssetId.USDC]: {
    ticker: "USDC",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    addresses: {
      [ChainId.UNICHAIN]: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", // Placeholder USDC address on Unichain
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
