import { analyticsService } from '../analytics.service';
import { AnalyticsEventNames } from '@/types/analytics';

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

// Mock the console.error to avoid polluting test output
const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('AnalyticsService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance
    // @ts-ignore - Accessing private member for testing
    analyticsService.instance = null;
    // @ts-ignore - Accessing private member for testing
    analyticsService.isInitialized = false;
    
    // Mock a successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
  });

  afterAll(() => {
    // Restore console.error
    consoleError.mockRestore();
  });

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = analyticsService;
      const instance2 = analyticsService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should set isInitialized to true', async () => {
      await analyticsService.initialize();
      // @ts-ignore - Accessing private member for testing
      expect(analyticsService.isInitialized).toBe(true);
    });
  });

  describe('trackEvent', () => {
    it('should call initialize if not initialized', async () => {
      const initializeSpy = jest.spyOn(analyticsService, 'initialize');
      
      await analyticsService.trackEvent('test_event', { test: 'data' });
      
      expect(initializeSpy).toHaveBeenCalled();
    });

    it('should send event data to the correct endpoint', async () => {
      const testEvent = {
        name: 'test_event',
        test: 'data',
      };
      
      await analyticsService.trackEvent(testEvent.name, { test: 'data' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/events'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(
        analyticsService.trackEvent('test_event', { test: 'data' })
      ).resolves.not.toThrow();
      
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to track event:',
        expect.any(Error)
      );
    });
  });

  describe('getAggregatedData', () => {
    const mockData = {
      data: [
        { _id: '2023-01-01', count: 10 },
        { _id: '2023-01-02', count: 15 },
      ],
    };

    beforeEach(() => {
      // Mock a successful fetch response for getAggregatedData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
    });

    it('should fetch aggregated data with correct parameters', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const metric = 'page_views';
      
      const result = await analyticsService.getAggregatedData(
        metric,
        startDate,
        endDate,
        'day'
      );
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/analytics/aggregate?metric=${metric}` +
          `&startDate=${encodeURIComponent(startDate.toISOString())}` +
          `&endDate=${encodeURIComponent(endDate.toISOString())}` +
          '&groupBy=day'
        )
      );
      
      expect(result).toEqual(mockData);
    });

    it('should handle errors when fetching aggregated data', async () => {
      const errorMessage = 'Failed to fetch';
      mockFetch.mockReset();
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(
        analyticsService.getAggregatedData(
          'page_views',
          new Date(),
          new Date(),
          'day'
        )
      ).rejects.toThrow('Failed to fetch aggregated data');
    });
  });

  describe('predefined event names', () => {
    it('should have all predefined event names', () => {
      expect(AnalyticsEventNames).toEqual({
        PAGE_VIEW: 'page_view',
        BUTTON_CLICK: 'button_click',
        FORM_SUBMIT: 'form_submit',
        ERROR: 'error',
        USER_SIGNUP: 'user_signup',
        USER_LOGIN: 'user_login',
        USER_LOGOUT: 'user_logout',
        FEATURE_USAGE: 'feature_usage',
        CONVERSION: 'conversion',
        SEARCH: 'search',
        NAVIGATION: 'navigation',
      });
    });
  });
});
