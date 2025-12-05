export interface AnalyticsEvent {
  id: string;
  dAppId: number;
  eventType: string;
  timestamp: Date;
  data: Record<string, unknown>;
  // Add any additional fields as needed
}

export interface DailyMetrics {
  date: string;
  totalEvents: number;
  uniqueUsers: number;
  // Add more metrics as needed
}
