import { CHAINS, DEFAULT_CHAIN_ID, type ChainId } from './chains';

// Contract addresses by chain ID
export type ContractAddresses = {
  AnalyticsRegistry: string;
  EventLogger: string;
  SessionManager: string;
  MetricsAggregator: string;
  SimpleSwap: string;
};

// Default contract addresses for each chain
const DEFAULT_CONTRACTS: Record<number, ContractAddresses> = {
  // Somnia Testnet
  50312: {
    AnalyticsRegistry: '0xEe4053bf95DfDc1C88609182E6d1b57f24E5feFE',
    EventLogger: '0xd23329263c344a1d1AFC3140E2F5d1F0AA5d60D9',
    SessionManager: '0x1219e566CFD1E35Ca63E9A05668b8e8DaB2F6C44',
    MetricsAggregator: '0x23cDAec75B1C3E5d26db4675EcB3c9042a780A0E',
    SimpleSwap: '0x90C9Ba691DA6a027bf8cC173ea5171c29b3f3673',
  },
  // Add more chains as needed
};

// Get contract addresses for a specific chain
export function getContracts(chainId: number = DEFAULT_CHAIN_ID): ContractAddresses {
  const contracts = DEFAULT_CONTRACTS[chainId as ChainId];
  if (!contracts) {
    throw new Error(`No contracts configured for chain ID ${chainId}`);
  }
  return {
    ...contracts,
    // Allow environment variables to override contract addresses
    AnalyticsRegistry: process.env.NEXT_PUBLIC_ANALYTICS_REGISTRY || contracts.AnalyticsRegistry,
    EventLogger: process.env.NEXT_PUBLIC_EVENT_LOGGER || contracts.EventLogger,
    SessionManager: process.env.NEXT_PUBLIC_SESSION_MANAGER || contracts.SessionManager,
    MetricsAggregator: process.env.NEXT_PUBLIC_METRICS_AGGREGATOR || contracts.MetricsAggregator,
    SimpleSwap: process.env.NEXT_PUBLIC_SIMPLE_SWAP || contracts.SimpleSwap,
  };
}

// Get the current chain's contract addresses
export const CONTRACTS = getContracts();

// DApp IDs by chain
export const DAPP_IDS = {
  SimpleSwap: 1, // Default DApp ID for SimpleSwap
  // Add other DApp IDs as needed
} as const;

export const SIMPLE_SWAP_DAPP_ID = Number(process.env.NEXT_PUBLIC_SIMPLE_SWAP_DAPP_ID) || DAPP_IDS.SimpleSwap;

// Export the current chain configuration
export const currentChain = CHAINS[DEFAULT_CHAIN_ID];
