// 1. Chain ID Enum - All supported chains
export enum ChainId {
  // EVM Chains
  ETHEREUM = "ethereum",

  // Bitcoin Ecosystem
  LIGHTNING = "lightning",

  // Polkadot Ecosystem
  POLKADOT = "polkadot",
}

// 2. Chain Type Categories
export enum ChainType {
  EVM = "evm",
  LIGHTNING = "lightning",
  SUBSTRATE = "substrate", // Polkadot/Kusama
}

// 3. Chain Metadata Interface
export interface ChainMetadata {
  id: ChainId;
  type: ChainType;
  name: string;
  explorerUrl?: string;
  rpcUrl?: string; // For EVM chains
}
