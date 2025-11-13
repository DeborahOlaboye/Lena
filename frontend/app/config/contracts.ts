// Contract addresses on Somnia Testnet (Chain ID: 50312)
export const SOMNIA_CHAIN_ID = Number(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID) || 50312;
export const SOMNIA_RPC_URL = process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";

export const CONTRACTS = {
  AnalyticsRegistry: process.env.NEXT_PUBLIC_ANALYTICS_REGISTRY || "0xEe4053bf95DfDc1C88609182E6d1b57f24E5feFE",
  EventLogger: process.env.NEXT_PUBLIC_EVENT_LOGGER || "0xd23329263c344a1d1AFC3140E2F5d1F0AA5d60D9",
  SessionManager: process.env.NEXT_PUBLIC_SESSION_MANAGER || "0x1219e566CFD1E35Ca63E9A05668b8e8DaB2F6C44",
  MetricsAggregator: process.env.NEXT_PUBLIC_METRICS_AGGREGATOR || "0x23cDAec75B1C3E5d26db4675EcB3c9042a780A0E",
  SimpleSwap: process.env.NEXT_PUBLIC_SIMPLE_SWAP || "0x90C9Ba691DA6a027bf8cC173ea5171c29b3f3673",
} as const;

export const SIMPLE_SWAP_DAPP_ID = Number(process.env.NEXT_PUBLIC_SIMPLE_SWAP_DAPP_ID) || 1;

// Somnia Network Configuration
export const somniaNetwork = {
  id: SOMNIA_CHAIN_ID,
  name: "Somnia Testnet",
  network: "somnia-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Somnia Token",
    symbol: "STT",
  },
  rpcUrls: {
    default: { http: [SOMNIA_RPC_URL] },
    public: { http: [SOMNIA_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Somnia Explorer", url: "https://explorer.somnia.network" },
  },
  testnet: true,
};
