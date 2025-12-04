export interface AnalyticsEventData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsEvent {
  name: string;
  timestamp: string;
  userId: string;
  properties: AnalyticsEventData;
  userAgent: string;
  url: string;
}

export interface AggregatedData {
  metric: string;
  value: number;
  timestamp?: string;
  group?: string;
}

export interface AnalyticsQueryParams {
  startDate: string;
  endDate: string;
  metric: string;
  groupBy?: string;
}

export enum AnalyticsEventNames {
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  ERROR = 'error',
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  FEATURE_USAGE = 'feature_usage',
  CONVERSION = 'conversion',
  SEARCH = 'search',
  NAVIGATION = 'navigation',
}
