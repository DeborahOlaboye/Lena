import { AnalyticsEvent, AnalyticsEventData } from '@/types/analytics';

class AnalyticsService {
  private static instance: AnalyticsService;
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '';
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize any required resources here
      this.isInitialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
      throw error;
    }
  }

  public async trackEvent(
    eventName: string,
    eventData: AnalyticsEventData = {},
    userId?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const event: AnalyticsEvent = {
      name: eventName,
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous',
      properties: eventData,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    try {
      // Send event to the analytics API
      await fetch(`${this.baseUrl}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
      // Optionally implement retry logic or offline queuing
    }
  }

  public async getAggregatedData(
    metric: string,
    startDate: Date,
    endDate: Date,
    groupBy?: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        metric,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(groupBy && { groupBy }),
      });

      const response = await fetch(
        `${this.baseUrl}/api/analytics/aggregate?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch aggregated data');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch aggregated data:', error);
      throw error;
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
