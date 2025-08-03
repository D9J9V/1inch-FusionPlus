// 1. Chain ID Enum - All supported chains
export enum ChainId {
  // EVM Chains
  UNICHAIN = "unichain",

  // Bitcoin Ecosystem
  BTC = "btc",
  LIGHTNING = "lightning",
}

// 2. Chain Type Categories
export enum ChainType {
  EVM = "evm",
  BITCOIN = "bitcoin",
  LIGHTNING = "lightning",
  SUBSTRATE = "substrate",
}

// 3. Chain Metadata Interface
export interface ChainMetadata {
  id: ChainId;
  type: ChainType;
  name: string;
  explorerUrl?: string;
  rpcUrl?: string; // For EVM chains
}
// 4. Chain Configuration
export const chains: Record<ChainId, ChainMetadata> = {
  [ChainId.UNICHAIN]: {
    id: ChainId.UNICHAIN,
    type: ChainType.EVM,
    name: "Unichain",
    explorerUrl: "https://uniscan.io", // Update when available
    rpcUrl: "https://unichain.rpc.io", // Update when available
  },
  [ChainId.BTC]: {
    id: ChainId.BTC,
    type: ChainType.BITCOIN,
    name: "Bitcoin",
    explorerUrl: "https://mempool.space",
  },
  [ChainId.LIGHTNING]: {
    id: ChainId.LIGHTNING,
    type: ChainType.LIGHTNING,
    name: "Lightning Network",
    explorerUrl: "https://mempool.space",
  },
};
