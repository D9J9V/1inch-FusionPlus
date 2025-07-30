// 1. Chain ID Enum - All supported chains
export enum ChainId {
  // EVM Chains
  ETHEREUM = "ethereum",
  BASE = "base",

  // Bitcoin Ecosystem
  LIGHTNING = "lightning",

  // Polkadot Ecosystem
  MOONBEAM = "moonbeam",
  VARA = "vara",
}

// 2. Chain Type Categories
export enum ChainType {
  EVM = "evm",
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
  [ChainId.ETHEREUM]: {
    id: ChainId.ETHEREUM,
    type: ChainType.EVM,
    name: "Ethereum",
    explorerUrl: "https://etherscan.io",
    rpcUrl: "https://ethereum.rpc.thirdweb.com",
  },
  [ChainId.BASE]: {
    id: ChainId.BASE,
    type: ChainType.EVM,
    name: "Base",
    explorerUrl: "https://basescan.org",
    rpcUrl: "https://base.rpc.thirdweb.com",
  },
  [ChainId.LIGHTNING]: {
    id: ChainId.LIGHTNING,
    type: ChainType.LIGHTNING,
    name: "Lightning Network",
    explorerUrl: "https://mempool.space",
  },
  [ChainId.MOONBEAM]: {
    id: ChainId.MOONBEAM,
    type: ChainType.SUBSTRATE,
    name: "Moonbeam",
    explorerUrl: "https://moonbeam.moonscan.io",
    rpcUrl: "https://rpc.api.moonbeam.network",
  },
  [ChainId.VARA]: {
    id: ChainId.VARA,
    type: ChainType.SUBSTRATE,
    name: "Vara Network",
    explorerUrl: "https://vara.subscan.io",
  },
};
