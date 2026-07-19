import { analytics } from "./client";
import type { AnalyticsEventMap, AnalyticsEventName, ServerSideEventName } from "./events";
import { ServerSideEvents } from "./events";
import type { TrackOptions } from "./types";

// Type-safe track function
export async function track<T extends AnalyticsEventName>(
  event: T,
  properties: AnalyticsEventMap[T],
  options?: TrackOptions
): Promise<void> {
  if (!analytics.isEnabled()) {
    return;
  }

  const provider = analytics.getProvider();
  if (!provider) {
    console.warn("[Analytics] Provider not initialized");
    return;
  }

  const enrichedProperties: Record<string, unknown> = {
    ...(properties as unknown as Record<string, unknown>),
    environment: process.env.NODE_ENV || "development",
  };

  await provider.track(event, enrichedProperties, {
    ...options,
    timestamp: options?.timestamp || new Date(),
  });
}

// Server-side only tracking (for critical events)
export async function trackServerSide<T extends ServerSideEventName>(
  event: T,
  properties: AnalyticsEventMap[T],
  options?: TrackOptions
): Promise<void> {
  // Enforce server-side only
  if (typeof (globalThis as Record<string, unknown>)["window"] !== "undefined") {
    console.error("[Analytics] Server-side events cannot be tracked from client");
    return;
  }

  await track(event, properties, options);
}

// Identify user
export async function identify(
  userId: string,
  traits?: Record<string, unknown>
): Promise<void> {
  if (!analytics.isEnabled()) {
    return;
  }

  const provider = analytics.getProvider();
  if (!provider) {
    console.warn("[Analytics] Provider not initialized");
    return;
  }

  await provider.identify(userId, traits || {});
}

// Check if event is server-side only
export function isServerSideEvent(event: AnalyticsEventName): boolean {
  return ServerSideEvents.includes(event as ServerSideEventName);
}
