import { serverEnv } from "./env";

// Clerk configuration
export const clerkConfig = {
  publishableKey: serverEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  secretKey: serverEnv.CLERK_SECRET_KEY || "",
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  afterSignInUrl: "/",
  afterSignUpUrl: "/",
} as const;

export type ClerkConfig = typeof clerkConfig;
