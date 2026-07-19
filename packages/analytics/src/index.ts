export { analytics } from "./client";
export { track, trackServerSide, identify, isServerSideEvent } from "./track";
export { AnalyticsEvents, ServerSideEvents } from "./events";

// PostHogProvider is server-only — import directly from the path if needed:
// import { PostHogProvider } from "@dinewithme/analytics/providers/posthog"

export type {
  AnalyticsEventName,
  AnalyticsEventMap,
  ServerSideEventName,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  UserLoginEvent,
  UserLogoutEvent,
} from "./events";

export type { AnalyticsConfig, AnalyticsProvider, TrackOptions } from "./types";
