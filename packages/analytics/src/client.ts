import type { AnalyticsConfig, AnalyticsProvider } from "./types";

class AnalyticsClient {
  private provider: AnalyticsProvider | null = null;
  private enabled = false;
  private debug = false;

  initialize(config: AnalyticsConfig): void {
    this.provider = config.provider;
    this.enabled = config.enabled;
    this.debug = config.debug ?? false;

    if (this.debug) {
      console.log("[Analytics] Initialized with config:", {
        enabled: this.enabled,
        provider: this.provider?.constructor.name,
      });
    }
  }

  isInitialized(): boolean {
    return this.provider !== null;
  }

  getProvider(): AnalyticsProvider | null {
    return this.provider;
  }

  isEnabled(): boolean {
    return this.enabled && this.provider !== null;
  }

  async flush(): Promise<void> {
    if (!this.isEnabled() || !this.provider) return;
    await this.provider.flush();
  }

  async shutdown(): Promise<void> {
    if (!this.provider) return;
    await this.provider.shutdown();
  }
}

export const analytics = new AnalyticsClient();
