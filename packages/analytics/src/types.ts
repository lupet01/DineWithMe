export interface TrackOptions {
  userId?: string;
  timestamp?: Date;
  context?: Record<string, unknown>;
}

export interface AnalyticsProvider {
  track(
    event: string,
    properties: Record<string, unknown>,
    options?: TrackOptions
  ): Promise<void>;
  identify(userId: string, traits: Record<string, unknown>): Promise<void>;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  enabled: boolean;
  debug?: boolean;
}
