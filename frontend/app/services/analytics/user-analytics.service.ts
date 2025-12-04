import { analyticsService } from './analytics.service';
import { AnalyticsEventNames } from '@/types/analytics';

export interface UserEvent {
  userId: string;
  event: string;
  timestamp: Date;
  properties?: Record<string, any>;
}

export interface RetentionMetrics {
  day: number;
  retained: number;
  percentage: number;
}

export interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

export interface CohortData {
  cohort: string; // e.g., '2023-01' for January 2023 cohort
  size: number;
  retention: number[]; // Retention rates for each period
}

class UserAnalyticsService {
  private static instance: UserAnalyticsService;
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '';

  private constructor() {}

  public static getInstance(): UserAnalyticsService {
    if (!UserAnalyticsService.instance) {
      UserAnalyticsService.instance = new UserAnalyticsService();
    }
    return UserAnalyticsService.instance;
  }

  /**
   * Track a user event with additional user context
   */
  public async trackUserEvent(
    userId: string,
    eventName: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await analyticsService.trackEvent(eventName, {
      ...properties,
      userId,
    });
  }

  /**
   * Calculate user retention metrics for a specific cohort
   */
  public async calculateRetention(
    startDate: Date,
    endDate: Date,
    cohortSize: 'day' | 'week' | 'month' = 'day'
  ): Promise<RetentionMetrics[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/analytics/retention?` +
          new URLSearchParams({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            cohortSize,
          })
      );

      if (!response.ok) {
        throw new Error('Failed to fetch retention data');
      }

      return response.json();
    } catch (error) {
      console.error('Error calculating retention:', error);
      throw error;
    }
  }

  /**
   * Analyze user funnel through a series of steps
   */
  public async analyzeFunnel(
    steps: string[],
    startDate: Date,
    endDate: Date
  ): Promise<FunnelStep[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/analytics/funnel?` +
          new URLSearchParams({
            steps: steps.join(','),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
      );

      if (!response.ok) {
        throw new Error('Failed to fetch funnel data');
      }

      return response.json();
    } catch (error) {
      console.error('Error analyzing funnel:', error);
      throw error;
    }
  }

  /**
   * Perform cohort analysis
   */
  public async analyzeCohorts(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month' = 'week',
    cohortSize: 'day' | 'week' | 'month' = 'week'
  ): Promise<CohortData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/analytics/cohorts?` +
          new URLSearchParams({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            period,
            cohortSize,
          })
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cohort data');
      }

      return response.json();
    } catch (error) {
      console.error('Error analyzing cohorts:', error);
      throw error;
    }
  }

  /**
   * Get user journey for a specific user
   */
  public async getUserJourney(userId: string): Promise<UserEvent[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/analytics/user-journey/${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user journey');
      }

      const data = await response.json();
      return data.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching user journey:', error);
      throw error;
    }
  }
}

export const userAnalyticsService = UserAnalyticsService.getInstance();
