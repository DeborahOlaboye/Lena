// Contract ABIs
export const AnalyticsRegistryABI = [
  "function registerDApp(string memory name, string memory category, address[] memory contractAddresses) external returns (uint256)",
  "function getDAppInfo(uint256 dAppId) external view returns (tuple(address owner, string name, string category, address[] contractAddresses, bool isActive, uint256 registeredAt))",
  "function getAllRegisteredDApps() external view returns (uint256[])",
  "function isDAppRegistered(uint256 dAppId) external view returns (bool)",
  "function getDAppsByOwner(address owner) external view returns (uint256[])",
  "function getTotalDApps() external view returns (uint256)",
  "event DAppRegistered(uint256 indexed dAppId, address indexed owner, string name, string category, uint256 timestamp)",
  "event DAppUpdated(uint256 indexed dAppId, string name, string category, uint256 timestamp)",
  "event DAppDeactivated(uint256 indexed dAppId, uint256 timestamp)",
] as const;

export const EventLoggerABI = [
  "function logEvent(uint256 dAppId, address user, string memory eventType, string memory eventData) external",
  "function getEventsByDApp(uint256 dAppId, uint256 limit) external view returns (uint256[])",
  "function getEvents(uint256[] memory _eventIds) external view returns (tuple(uint256 eventId, uint256 dAppId, address user, string eventType, string eventData, uint256 timestamp, uint256 blockNumber)[])",
  "function getEventsByUser(address user, uint256 limit) external view returns (uint256[])",
  "function getTotalEventCount() external view returns (uint256)",
  "event EventLogged(uint256 indexed eventId, uint256 indexed dAppId, address indexed user, string eventType, uint256 timestamp)",
] as const;

export const SessionManagerABI = [
  "function startSession(uint256 dAppId) external returns (uint256)",
  "function endSession(uint256 sessionId) external",
  "function getActiveSession(address user, uint256 dAppId) external view returns (tuple(uint256 sessionId, address user, uint256 dAppId, uint256 startTime, uint256 endTime, uint256 transactionCount, uint256 gasSpent, bool isActive))",
  "function getUserSessions(address user, uint256 limit) external view returns (tuple(uint256 sessionId, address user, uint256 dAppId, uint256 startTime, uint256 endTime, uint256 transactionCount, uint256 gasSpent, bool isActive)[])",
  "function getDAppActiveSessions(uint256 dAppId, uint256 limit) external view returns (tuple(uint256 sessionId, address user, uint256 dAppId, uint256 startTime, uint256 endTime, uint256 transactionCount, uint256 gasSpent, bool isActive)[])",
  "event SessionStarted(uint256 indexed sessionId, address indexed user, uint256 indexed dAppId, uint256 timestamp)",
  "event SessionEnded(uint256 indexed sessionId, uint256 duration, uint256 transactionCount, uint256 gasSpent)",
] as const;

export const MetricsAggregatorABI = [
  "function getDailyMetrics(uint256 dAppId, uint256 date) external view returns (tuple(uint256 date, uint256 activeUsers, uint256 totalTransactions, uint256 successfulTransactions, uint256 failedTransactions, uint256 totalGasUsed, uint256 uniqueUsers))",
  "function getCurrentMetrics(uint256 dAppId) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256)",
  "function recordTransaction(uint256 dAppId, address user, bool success, uint256 gasUsed) external",
  "event MetricsUpdated(uint256 indexed date, uint256 totalTransactions, uint256 activeUsers)",
] as const;

export const SimpleSwapABI = [
  "function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256)",
  "function removeLiquidity(uint256 liquidity) external returns (uint256, uint256)",
  "function swap(bool aToB, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
  "function getAmountOut(uint256 amountIn, bool aToB) public view returns (uint256)",
  "function getReserves() external view returns (uint256, uint256)",
  "function getLiquidityShares(address provider) external view returns (uint256)",
  "function getExchangeRate() external view returns (uint256)",
  "function getPriceImpact(uint256 amountIn, bool aToB) external view returns (uint256)",
  "function reserveA() external view returns (uint256)",
  "function reserveB() external view returns (uint256)",
  "function totalLiquidity() external view returns (uint256)",
  "event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity, uint256 timestamp)",
  "event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity, uint256 timestamp)",
  "event Swap(address indexed user, bool aToB, uint256 amountIn, uint256 amountOut, uint256 timestamp)",
] as const;
