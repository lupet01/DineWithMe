# @dinewithme/config

Centralized configuration and environment variable validation for DineWithMe.

## Features

- Zod-based environment variable validation
- Fail-fast on missing or invalid variables
- Type-safe configuration access
- Separate server and client environment variables
- Environment-aware defaults

## Usage

### Import Configuration

```typescript
import { appConfig, serverEnv, clientEnv } from "@dinewithme/config";

// Use app configuration
console.log(appConfig.database.url);
console.log(appConfig.analytics.enabled);

// Access raw environment variables (validated)
console.log(serverEnv.DATABASE_URL);
console.log(clientEnv.NEXT_PUBLIC_ANALYTICS_KEY);
```

### Environment Variables

#### Server-side (required)

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development, production, test)
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

#### Server-side (optional)

- `POSTHOG_API_KEY` - PostHog API key
- `POSTHOG_HOST` - PostHog host URL

#### Client-side (optional)

- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_ANALYTICS_KEY` - Public analytics key

### Adding New Variables

1. Add to schema in `src/env.ts`:

```typescript
const serverEnvSchema = z.object({
  // ... existing
  MY_NEW_VAR: z.string().min(1, "MY_NEW_VAR is required"),
});
```

2. Add to app config in `src/app.ts`:

```typescript
export const appConfig = {
  // ... existing
  myFeature: {
    apiKey: serverEnv.MY_NEW_VAR,
  },
};
```

3. Add to `.env.example`:

```
MY_NEW_VAR=example_value
```

## Validation

Environment variables are validated on import. If validation fails:

1. Error details are logged to console
2. Application throws and fails to start
3. Missing/invalid variables are clearly identified

This ensures configuration issues are caught immediately during development or deployment.

## Example .env

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/dinewithme
POSTHOG_API_KEY=phc_xxxxx
POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ANALYTICS_KEY=pk_xxxxx
```
