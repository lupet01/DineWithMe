# @dinewithme/analytics

Strongly-typed analytics infrastructure for DineWithMe.

## Features

- Type-safe event tracking
- Central event registry
- Server-side only enforcement for critical events
- PostHog provider (stub implementation)
- Environment-aware tracking

## Setup

```typescript
import { analytics, PostHogProvider } from "@dinewithme/analytics";

// Initialize analytics
analytics.initialize({
  provider: new PostHogProvider({
    apiKey: process.env.POSTHOG_API_KEY,
    host: process.env.POSTHOG_HOST,
  }),
  enabled: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
});
```

## Usage

### Track Events

```typescript
import { track, AnalyticsEvents } from "@dinewithme/analytics";

// Type-safe event tracking
await track(AnalyticsEvents.USER_CREATED, {
  userId: "123",
  email: "user@example.com",
  timestamp: new Date().toISOString(),
});
```

### Server-Side Only Events

```typescript
import { trackServerSide, AnalyticsEvents } from "@dinewithme/analytics";

// Critical events that must only be tracked server-side
await trackServerSide(AnalyticsEvents.USER_CREATED, {
  userId: "123",
  email: "user@example.com",
  timestamp: new Date().toISOString(),
});
```

### Identify Users

```typescript
import { identify } from "@dinewithme/analytics";

await identify("user-123", {
  email: "user@example.com",
  plan: "pro",
});
```

## Adding New Events

1. Add event name to `AnalyticsEvents` constant
2. Define event payload interface
3. Add to `AnalyticsEventMap` type
4. If critical, add to `ServerSideEvents` array

```typescript
// events.ts
export const AnalyticsEvents = {
  MY_EVENT: "my_event",
} as const;

export interface MyEventPayload {
  userId: string;
  data: string;
}

export interface AnalyticsEventMap {
  [AnalyticsEvents.MY_EVENT]: MyEventPayload;
}
```

## Architecture

- `events.ts` - Central event registry with type definitions
- `track.ts` - Type-safe tracking functions
- `client.ts` - Analytics client singleton
- `providers/` - Analytics provider implementations
- `types.ts` - Shared type definitions
