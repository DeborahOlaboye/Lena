// Type definitions
export interface DAppInfo {
  owner: string;
  name: string;
  category: string;
  contractAddresses: string[];
  isActive: boolean;
  registeredAt: bigint;
}

export interface AnalyticsEvent {
  eventId: bigint;
  dAppId: bigint;
  user: string;
  eventType: string;
  eventData: string;
  timestamp: bigint;
  blockNumber: bigint;
}

export interface Session {
  sessionId: bigint;
  user: string;
  dAppId: bigint;
  startTime: bigint;
  endTime: bigint;
  transactionCount: bigint;
  gasSpent: bigint;
  isActive: boolean;
}

export interface DailyMetrics {
  date: bigint;
  activeUsers: bigint;
  totalTransactions: bigint;
  successfulTransactions: bigint;
  failedTransactions: bigint;
  totalGasUsed: bigint;
  uniqueUsers: bigint;
}

export interface SwapEvent {
  user: string;
  aToB: boolean;
  amountIn: bigint;
  amountOut: bigint;
  timestamp: bigint;
}

export type CategoryType = "DeFi" | "NFT" | "Gaming" | "Social" | "DAO" | "Other";
