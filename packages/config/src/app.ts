import { serverEnv, clientEnv } from "./env";

// Application configuration
export const appConfig = {
  // Environment
  env: serverEnv.NODE_ENV,
  isDevelopment: serverEnv.NODE_ENV === "development",
  isProduction: serverEnv.NODE_ENV === "production",
  isTest: serverEnv.NODE_ENV === "test",

  // URLs
  appUrl: clientEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Database
  database: {
    url: serverEnv.DATABASE_URL,
  },

  // Analytics
  analytics: {
    enabled: serverEnv.NODE_ENV === "production",
    posthog: {
      apiKey: serverEnv.POSTHOG_API_KEY,
      host: serverEnv.POSTHOG_HOST || "https://app.posthog.com",
    },
    publicKey: clientEnv.NEXT_PUBLIC_ANALYTICS_KEY,
  },
} as const;

// Type export
export type AppConfig = typeof appConfig;
