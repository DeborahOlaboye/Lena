import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analyticsService } from '@/services/analytics/analytics.service';
import { AnalyticsEventNames } from '@/types/analytics';

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (pathname) {
      const url = `${pathname}${searchParams ? `?${searchParams}` : ''}`;
      analyticsService.trackEvent(AnalyticsEventNames.PAGE_VIEW, {
        path: pathname,
        search: searchParams?.toString(),
        url,
      });
    }
  }, [pathname, searchParams]);

  // Track custom events
  const trackEvent = (
    eventName: string,
    eventData: Record<string, any> = {},
    userId?: string
  ) => {
    return analyticsService.trackEvent(eventName, eventData, userId);
  };

  // Track button clicks
  const trackButtonClick = (
    buttonName: string,
    additionalData: Record<string, any> = {},
    userId?: string
  ) => {
    return trackEvent(
      AnalyticsEventNames.BUTTON_CLICK,
      {
        buttonName,
        ...additionalData,
      },
      userId
    );
  };

  // Track form submissions
  const trackFormSubmit = (
    formName: string,
    formData: Record<string, any> = {},
    userId?: string
  ) => {
    return trackEvent(
      AnalyticsEventNames.FORM_SUBMIT,
      {
        formName,
        ...formData,
      },
      userId
    );
  };

  // Track errors
  const trackError = (
    error: Error,
    errorContext: Record<string, any> = {},
    userId?: string
  ) => {
    return trackEvent(
      AnalyticsEventNames.ERROR,
      {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        ...errorContext,
      },
      userId
    );
  };

  return {
    trackEvent,
    trackButtonClick,
    trackFormSubmit,
    trackError,
  };
}

export default useAnalytics;
