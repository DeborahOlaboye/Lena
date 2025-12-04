import { Chain } from 'viem';

// Base chain configuration
export const CHAINS: Record<number, Chain> = {
  // Somnia Testnet
  50312: {
    id: 50312,
    name: 'Somnia Testnet',
    network: 'somnia-testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Somnia Token',
      symbol: 'STT',
    },
    rpcUrls: {
      default: { http: ['https://dream-rpc.somnia.network'] },
      public: { http: ['https://dream-rpc.somnia.network'] },
    },
    blockExplorers: {
      default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
    },
    testnet: true,
  },
  // Add more chains here
} as const;

export const DEFAULT_CHAIN_ID = 50312;

export const CHAIN_IDS = Object.keys(CHAINS).map(Number);

export type ChainId = keyof typeof CHAINS;

// Helper to get chain by ID
export function getChain(chainId: number): Chain {
  const chain = CHAINS[chainId as ChainId];
  if (!chain) {
    throw new Error(`Chain with ID ${chainId} not configured`);
  }
  return chain;
}

// Check if chain is supported
export function isChainSupported(chainId: number): chainId is ChainId {
  return chainId in CHAINS;
}
