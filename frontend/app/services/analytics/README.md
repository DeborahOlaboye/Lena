# Analytics Service

This service provides a comprehensive analytics solution for tracking user interactions and aggregating data in the application.

## Features

- **Event Tracking**: Track user interactions, page views, and custom events
- **Data Aggregation**: Built-in support for aggregating analytics data
- **Real-time Analytics**: Track events in real-time
- **Error Tracking**: Built-in error tracking and reporting
- **Custom Events**: Support for custom event types and properties

## Usage

### Basic Event Tracking

```typescript
import { analyticsService } from '@/services/analytics/analytics.service';
import { AnalyticsEventNames } from '@/types/analytics';

// Track a page view
analyticsService.trackEvent(AnalyticsEventNames.PAGE_VIEW, {
  pageTitle: document.title,
  url: window.location.href
});

// Track a button click
analyticsService.trackEvent(AnalyticsEventNames.BUTTON_CLICK, {
  buttonId: 'signup-button',
  buttonText: 'Sign Up',
  section: 'hero'
});
```

### Using the useAnalytics Hook

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent, trackButtonClick } = useAnalytics();

  const handleSignUp = () => {
    // Track the signup button click
    trackButtonClick('signup-button', {
      plan: 'premium',
      location: 'pricing-page'
    });
    
    // Your signup logic here
  };

  return (
    <button onClick={handleSignUp}>
      Sign Up Now
    </button>
  );
}
```

### Data Aggregation

```typescript
// Get aggregated data for a specific metric
const getAggregatedData = async () => {
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2023-01-31');
  
  const data = await analyticsService.getAggregatedData(
    'page_views',
    startDate,
    endDate,
    'day' // Group by day
  );
  
  console.log('Aggregated data:', data);
};
```

## API Endpoints

### Track Event

`POST /api/analytics/events`

Track a new analytics event.

**Request Body:**
```typescript
{
  "name": "event_name",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "userId": "user123",
  "properties": {
    "key": "value"
  },
  "userAgent": "Mozilla/5.0...",
  "url": "https://example.com/path"
}
```

### Get Aggregated Data

`GET /api/analytics/aggregate?metric=page_views&startDate=2023-01-01&endDate=2023-01-31&groupBy=day`

Get aggregated analytics data.

**Query Parameters:**
- `metric`: The metric to aggregate (required)
- `startDate`: Start date in ISO format (required)
- `endDate`: End date in ISO format (required)
- `groupBy`: Grouping interval ('day', 'hour', or 'month')

## Configuration

Set the following environment variables:

```env
MONGODB_URI=mongodb://username:password@localhost:27017/your-database
MONGODB_DB=your-database-name
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Testing

To test the analytics service, you can use the included test utilities:

```typescript
// In your test setup file
import { mockAnalytics } from '@/services/analytics/mocks';

// Mock the analytics service
jest.mock('@/services/analytics/analytics.service');

// In your tests
describe('Analytics Service', () => {
  it('tracks page views', async () => {
    const { trackEvent } = mockAnalytics();
    
    // Your test code that triggers a page view
    
    expect(trackEvent).toHaveBeenCalledWith(
      'page_view',
      expect.objectContaining({
        url: expect.any(String)
      })
    );
  });
});
```
