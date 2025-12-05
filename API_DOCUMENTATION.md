# Lena API Documentation

## Overview
This document provides a comprehensive guide to the Lena API, including available endpoints, request/response formats, and usage examples.

## Base URL
```
https://api.lena.com/v1
```

## Authentication
All API requests require authentication using a Bearer token included in the `Authorization` header.

```http
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting
- **Rate Limit:** 100 requests per minute per IP address
- **Headers:**
  - `X-RateLimit-Limit`: Total requests allowed in the current period
  - `X-RateLimit-Remaining`: Remaining requests in the current period
  - `X-RateLimit-Reset`: Timestamp when the rate limit resets

## Error Handling
Standard HTTP status codes are used to indicate success or failure:

- `200 OK`: Request was successful
- `201 Created`: Resource was created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

Error responses include a JSON object with error details:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

---

## Analytics Endpoints

### Track Event
Log a new analytics event.

```http
POST /api/analytics/events
```

**Request Body:**
```json
{
  "event": "page_view",
  "properties": {
    "url": "https://example.com",
    "referrer": "https://google.com",
    "screen_width": 1920,
    "screen_height": 1080
  },
  "user_id": "user_123",
  "session_id": "session_456"
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "evt_789"
}
```

### Get Aggregated Metrics
Retrieve aggregated analytics data.

```http
GET /api/analytics/aggregate?metric=page_views&start_date=2023-01-01&end_date=2023-01-31&interval=day
```

**Query Parameters:**
- `metric` (required): The metric to aggregate (page_views, users, sessions, etc.)
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `interval`: Time interval (minute, hour, day, week, month)
- `filters`: JSON string of filters to apply

**Response:**
```json
{
  "data": [
    {
      "date": "2023-01-01T00:00:00Z",
      "value": 1234
    },
    {
      "date": "2023-01-02T00:00:00Z",
      "value": 1456
    }
  ],
  "summary": {
    "total": 123456,
    "average": 1234.56,
    "change": 12.3
  }
}
```

### Get Cohort Analysis
Retrieve cohort analysis data.

```http
GET /api/analytics/cohorts?cohort_type=week&metric=retention&periods=12
```

**Query Parameters:**
- `cohort_type`: Time period for cohorts (day, week, month)
- `metric`: Metric to analyze (retention, revenue, etc.)
- `periods`: Number of periods to include

**Response:**
```json
{
  "cohorts": [
    {
      "cohort": "2023-01",
      "size": 1000,
      "data": [
        {
          "period": 0,
          "value": 1.0
        },
        {
          "period": 1,
          "value": 0.65
        }
      ]
    }
  ]
}
```

### Funnel Analysis
Analyze user conversion through a series of steps.

```http
POST /api/analytics/funnel
```

**Request Body:**
```json
{
  "steps": [
    {"event": "page_view", "properties": {"url": "/signup"}},
    {"event": "signup_started"},
    {"event": "signup_completed"}
  ],
  "start_date": "2023-01-01",
  "end_date": "2023-01-31"
}
```

**Response:**
```json
{
  "steps": [
    {
      "name": "page_view",
      "count": 1000,
      "conversion_rate": 1.0
    },
    {
      "name": "signup_started",
      "count": 500,
      "conversion_rate": 0.5
    },
    {
      "name": "signup_completed",
      "count": 250,
      "conversion_rate": 0.25
    }
  ],
  "total_conversion_rate": 0.25
}
```

### Retention Analysis
Analyze user retention over time.

```http
GET /api/analytics/retention?cohort_type=week&periods=8
```

**Response:**
```json
{
  "cohorts": [
    {
      "cohort": "2023-01-01",
      "sizes": [1000, 350, 200, 150, 120, 100, 90, 80],
      "retention_rates": [1.0, 0.35, 0.2, 0.15, 0.12, 0.1, 0.09, 0.08]
    }
  ]
}
```

### Export Data
Export analytics data in various formats.

```http
GET /api/analytics/export?format=csv&start_date=2023-01-01&end_date=2023-01-31
```

**Query Parameters:**
- `format`: Export format (csv, json, xlsx)
- `start_date`: Start date in YYYY-MM-DD format
- `end_date`: End date in YYYY-MM-DD format

**Response:**
- Returns a file in the requested format

---

## Example Requests

### cURL Example
```bash
curl -X POST https://api.lena.com/v1/api/analytics/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"page_view","properties":{"url":"https://example.com"}}'
```

### JavaScript Example
```javascript
const trackEvent = async (event, properties) => {
  const response = await fetch('https://api.lena.com/v1/api/analytics/events', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event,
      properties,
      user_id: 'user_123',
      session_id: 'session_456'
    })
  });
  return await response.json();
};
```

## Webhook Events
The API can send webhook notifications for various events. Configure webhook URLs in your dashboard.

### Event Types
- `event.tracked`: When a new event is tracked
- `user.created`: When a new user is identified
- `alert.triggered`: When an alert condition is met

### Webhook Payload
```json
{
  "event": "event.tracked",
  "data": {
    "event_id": "evt_789",
    "event": "page_view",
    "timestamp": "2023-01-01T12:00:00Z",
    "properties": {
      "url": "https://example.com"
    },
    "user_id": "user_123"
  }
}
```

## Best Practices
1. Always include a `user_id` or `session_id` with events for accurate tracking
2. Use consistent event names and property names
3. Batch events when possible to reduce API calls
4. Implement retry logic for failed requests
5. Respect rate limits and implement exponential backoff

## Support
For additional help, contact support@lena.com or visit our [developer portal](https://developers.lena.com).
