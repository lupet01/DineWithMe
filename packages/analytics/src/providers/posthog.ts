import { PostHog } from "posthog-node";
import type { AnalyticsProvider, TrackOptions } from "../types";

export class PostHogProvider implements AnalyticsProvider {
  private client: PostHog | null = null;
  private enabled: boolean;

  constructor(config: { apiKey?: string; host?: string }) {
    this.enabled = !!config.apiKey;

    if (this.enabled && config.apiKey) {
      this.client = new PostHog(config.apiKey, {
        host: config.host || "https://app.posthog.com",
        // Flush every 30s or every 20 events — whichever comes first
        flushAt: 20,
        flushInterval: 30000,
      });
    }
  }

  async track(
    event: string,
    properties: Record<string, unknown>,
    options?: TrackOptions
  ): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    this.client.capture({
      distinctId: options?.userId || "anonymous",
      event,
      properties,
      timestamp: options?.timestamp,
    });
  }

  async identify(userId: string, traits: Record<string, unknown>): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    this.client.identify({
      distinctId: userId,
      properties: traits,
    });
  }

  async flush(): Promise<void> {
    if (!this.enabled || !this.client) return;
    await this.client.flush();
  }

  async shutdown(): Promise<void> {
    if (!this.enabled || !this.client) return;
    await this.client.shutdown();
  }
}
