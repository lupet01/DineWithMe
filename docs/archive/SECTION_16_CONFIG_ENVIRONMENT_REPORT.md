# SECTION 16: Configuration & Environment - System Review Report

**Review Date**: March 5, 2026  
**Reviewer**: Kiro AI  
**Status**: ✅ COMPLETE  
**Overall Grade**: B

---

## Executive Summary

The configuration and environment management system uses Zod for validation and centralizes config in a shared package. However, the validation is incomplete, missing many required environment variables, and there are security concerns with exposed credentials in example files.

### Key Strengths:
- ✅ Centralized config package
- ✅ Zod validation for env vars
- ✅ Type-safe environment access
- ✅ Separate server/client env validation
- ✅ Clear config organization

### Issues Found:
- 🔴 CRITICAL: Real credentials exposed in .env.example files
- 🟠 HIGH: Incomplete env validation (missing many required vars)
- 🟡 MEDIUM: Direct process.env access bypasses validation
- 🟡 MEDIUM: No validation for Paystack keys
- 🟡 MEDIUM: No validation for R2 storage keys
- 🟢 LOW: Missing .env.local in .gitignore check

---

## 1. Environment Validation

### Current Implementation

**File**: `packages/config/src/env.ts`


**Server Environment Schema**:
```typescript
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
});
```

**Client Environment Schema**:
```typescript
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_ANALYTICS_KEY: z.string().optional(),
});
```

**Strengths**:
- ✅ Uses Zod for validation
- ✅ Validates on startup
- ✅ Throws error if validation fails
- ✅ Type-safe exports
- ✅ Separate server/client validation

**Weaknesses**:
- ❌ Missing many required environment variables
- ❌ Most fields are optional (should be required)
- ❌ No validation for payment keys
- ❌ No validation for storage keys
- ❌ No validation for cron secret
- ❌ No validation for QR token secret

---

### Issue: Incomplete Environment Validation 🟠 HIGH

**Problem**: Many environment variables used in the codebase are not validated.

**Missing from validation**:
1. `PAYSTACK_PUBLIC_KEY` - Used in payment.ts
2. `PAYSTACK_SECRET_KEY` - Used in payment routes
3. `R2_ENDPOINT` - Used in storage
4. `R2_REGION` - Used in storage
5. `R2_ACCESS_KEY_ID` - Used in storage
6. `R2_SECRET_ACCESS_KEY` - Used in storage
7. `R2_BUCKET` - Used in storage
8. `R2_PUBLIC_URL` - Used in storage
9. `CRON_SECRET` - Used in cron jobs
10. `QR_TOKEN_SECRET` - Used in QR tokens
11. `PLATFORM_ADMIN_EMAIL` - Used in seed script

**Impact**:
- App may start with missing config
- Runtime errors instead of startup errors
- Harder to debug configuration issues
- No type safety for these vars

**Fix**: Add all required variables to schema

```typescript
const serverEnvSchema = z.object({
  // Core
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // Authentication (required)
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  
  // Payment (required in production)
  PAYSTACK_PUBLIC_KEY: z.string().min(1, "PAYSTACK_PUBLIC_KEY is required"),
  PAYSTACK_SECRET_KEY: z.string().min(1, "PAYSTACK_SECRET_KEY is required"),
  
  // Storage (required)
  R2_ENDPOINT: z.string().url("R2_ENDPOINT must be a valid URL"),
  R2_REGION: z.string().default("auto"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET: z.string().min(1, "R2_BUCKET is required"),
  R2_PUBLIC_URL: z.string().url().optional(),
  
  // Security
  CRON_SECRET: z.string().min(32, "CRON_SECRET must be at least 32 characters"),
  QR_TOKEN_SECRET: z.string().min(32, "QR_TOKEN_SECRET must be at least 32 characters"),
  
  // Analytics (optional)
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().optional(),
  
  // Admin (optional, for seed script)
  PLATFORM_ADMIN_EMAIL: z.string().email().optional(),
});
```


---

## 2. Security Issues

### Issue: Real Credentials in .env.example Files 🔴 CRITICAL

**Problem**: `.env.example` files contain real credentials that should never be committed.

**Files Affected**:
- `.env.example`
- `apps/web/.env.example`

**Exposed Credentials**:

1. **Cloudflare R2 Credentials**:
   ```env
   R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com/dinewithme-media
   R2_ACCESS_KEY_ID=your-r2-access-key-id
   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   R2_BUCKET=dinewithme-media
   R2_PUBLIC_URL=https://pub-xxxxxxxxxxxx.r2.dev
   ```

2. **Clerk Credentials**:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   ```

   (Redacted here — these values were real credentials in earlier repo history and must be treated as compromised/rotated.)

**Impact**:
- 🔴 CRITICAL: Anyone with access to the repo can access your R2 storage
- 🔴 CRITICAL: Anyone can access your Clerk account
- 🔴 CRITICAL: Potential data breach
- 🔴 CRITICAL: Unauthorized access to user data

**Immediate Actions Required**:

1. **Rotate ALL exposed credentials immediately**:
   - Generate new R2 access keys
   - Regenerate Clerk keys
   - Update production environment

2. **Fix .env.example files**:
   ```env
   # Cloudflare R2 Storage
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   R2_REGION=auto
   R2_ACCESS_KEY_ID=your-r2-access-key-id
   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   R2_BUCKET=your-bucket-name
   R2_PUBLIC_URL=https://your-public-url.r2.dev  # Optional
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
   CLERK_SECRET_KEY=sk_test_your_secret_key
   ```

3. **Add to .gitignore** (verify):
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

4. **Audit git history**:
   ```bash
   # Check if credentials were committed
   git log --all --full-history -- .env.example
   
   # If found, consider using git-filter-repo to remove
   ```


---

## 3. Direct process.env Access

### Issue: Bypassing Validation 🟡 MEDIUM

**Problem**: Many files access `process.env` directly instead of using validated config.

**Examples**:

1. **Payment Configuration** (`packages/config/src/payment.ts`):
   ```typescript
   paystack: {
     publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
     secretKey: process.env.PAYSTACK_SECRET_KEY || "",
     baseUrl: "https://api.paystack.co",
   },
   ```

2. **Storage Configuration** (`packages/storage/src/index.ts`):
   ```typescript
   const config: StorageConfig = {
     endpoint: process.env.R2_ENDPOINT || "",
     region: process.env.R2_REGION || "auto",
     accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
     bucket: process.env.R2_BUCKET || "",
     publicUrl: process.env.R2_PUBLIC_URL,
   };
   ```

3. **QR Token** (`packages/shared/src/utils/qr-token.ts`):
   ```typescript
   const TOKEN_SECRET = process.env.QR_TOKEN_SECRET || "dinewithme-qr-secret-change-in-production";
   ```

4. **Cron Jobs**:
   ```typescript
   const expectedToken = process.env.CRON_SECRET;
   ```

5. **Payment Routes**:
   ```typescript
   const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
   ```

**Impact**:
- No validation at startup
- Runtime errors if missing
- No type safety
- Inconsistent with validated env pattern

**Fix**: Use validated config everywhere

**Example**:
```typescript
// packages/config/src/env.ts
const serverEnvSchema = z.object({
  // ... other fields
  PAYSTACK_PUBLIC_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(32),
  QR_TOKEN_SECRET: z.string().min(32),
});

export const serverEnv = validateServerEnv();

// packages/config/src/payment.ts
import { serverEnv } from "./env";

export const paymentConfig = {
  paystack: {
    publicKey: serverEnv.PAYSTACK_PUBLIC_KEY,
    secretKey: serverEnv.PAYSTACK_SECRET_KEY,
    baseUrl: "https://api.paystack.co",
  },
};

// packages/storage/src/index.ts
import { serverEnv } from "@dinewithme/config";

const config: StorageConfig = {
  endpoint: serverEnv.R2_ENDPOINT,
  region: serverEnv.R2_REGION,
  accessKeyId: serverEnv.R2_ACCESS_KEY_ID,
  secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY,
  bucket: serverEnv.R2_BUCKET,
  publicUrl: serverEnv.R2_PUBLIC_URL,
};
```


---

## 4. Configuration Organization

### Config Package Structure

**Location**: `packages/config/src/`

**Files**:
- `env.ts` - Environment validation
- `app.ts` - Application config
- `clerk.ts` - Clerk config
- `payment.ts` - Payment config
- `seat-policy.ts` - Seat policies
- `index.ts` - Exports

**Strengths**:
- ✅ Centralized configuration
- ✅ Organized by domain
- ✅ Type-safe exports
- ✅ Reusable across packages

---

### App Configuration

**File**: `packages/config/src/app.ts`

```typescript
export const appConfig = {
  env: serverEnv.NODE_ENV,
  isDevelopment: serverEnv.NODE_ENV === "development",
  isProduction: serverEnv.NODE_ENV === "production",
  isTest: serverEnv.NODE_ENV === "test",
  
  appUrl: clientEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  database: {
    url: serverEnv.DATABASE_URL,
  },
  
  analytics: {
    enabled: serverEnv.NODE_ENV === "production",
    posthog: {
      apiKey: serverEnv.POSTHOG_API_KEY,
      host: serverEnv.POSTHOG_HOST || "https://app.posthog.com",
    },
    publicKey: clientEnv.NEXT_PUBLIC_ANALYTICS_KEY,
  },
};
```

**Strengths**:
- ✅ Uses validated env vars
- ✅ Computed properties (isDevelopment, etc.)
- ✅ Sensible defaults
- ✅ Type-safe

---

### Clerk Configuration

**File**: `packages/config/src/clerk.ts`

```typescript
export const clerkConfig = {
  publishableKey: serverEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
  secretKey: serverEnv.CLERK_SECRET_KEY || "",
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  afterSignInUrl: "/",
  afterSignUpUrl: "/",
};
```

**Strengths**:
- ✅ Centralized Clerk config
- ✅ URL configuration
- ✅ Type-safe

**Issue**: Empty string fallbacks should not be needed if env is validated properly.

---

### Payment Configuration

**File**: `packages/config/src/payment.ts`

```typescript
export const paymentConfig = {
  commitmentAmount: 7500, // R75.00 in cents
  currency: "ZAR",
  defaultProvider: "PAYSTACK" as const,
  
  paystack: {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
    secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    baseUrl: "https://api.paystack.co",
  },
  
  refund: {
    cutoffHours: 24,
    reasons: {
      USER_CANCELLED: "user_cancelled",
      DINNER_CANCELLED: "dinner_cancelled",
      NO_SHOW: "no_show",
    },
  },
};
```

**Strengths**:
- ✅ Clear payment constants
- ✅ Helper functions (formatAmount, toCents, etc.)
- ✅ Refund policy configuration
- ✅ Type-safe

**Issue**: Direct process.env access (should use validated env).

---

### Seat Policy Configuration

**File**: `packages/config/src/seat-policy.ts`

**Strengths**:
- ✅ Centralized seat policies
- ✅ Cancellation rules
- ✅ Check-in rules
- ✅ Helper functions

**No Issues** ✅


---

## 5. Environment Files

### .env.example (Root)

**Issues**:
- 🔴 Contains real R2 credentials
- 🔴 Contains real Clerk credentials
- 🟡 Typo: `dinethime-media` should be `dinewithme-media`

**Should Be**:
```env
# Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dinewithme?schema=public

# Cloudflare R2 / S3-Compatible Storage
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://your-public-url.r2.dev  # Optional

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key

# Paystack Payment (required in production)
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_SECRET_KEY=sk_test_your_secret_key

# Analytics (optional)
POSTHOG_API_KEY=
POSTHOG_HOST=https://app.posthog.com

# Client-side (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ANALYTICS_KEY=

# Platform Admin (for seed script)
PLATFORM_ADMIN_EMAIL=admin@example.com

# Cron Job Security (generate with: openssl rand -base64 32)
CRON_SECRET=your-secret-token-here

# QR Token Secret (generate with: openssl rand -base64 32)
QR_TOKEN_SECRET=your-qr-token-secret-here
```

---

### apps/web/.env.example

**Issues**:
- 🔴 Contains real R2 credentials
- 🔴 Contains real Clerk credentials
- 🟡 Missing Paystack keys
- 🟡 Missing CRON_SECRET
- 🟡 Missing QR_TOKEN_SECRET
- 🟡 Typo: `dinethime-media`

**Should Be**: Same as root .env.example

---

### .env (Actual)

**Issues**:
- 🟡 Contains development credentials (should be in .env.local)
- 🟡 Weak CRON_SECRET (should be 32+ chars)
- 🟡 Weak QR_TOKEN_SECRET

**Recommendation**: 
- Keep .env for defaults only
- Use .env.local for actual credentials
- Generate strong secrets:
  ```bash
  openssl rand -base64 32
  ```


---

## 6. Issues & Recommendations

### 🔴 CRITICAL Priority Issues

#### Issue 1: Real Credentials in .env.example Files

**Problem**: Real R2 and Clerk credentials are exposed in committed files.

**Files**:
- `.env.example`
- `apps/web/.env.example`

**Immediate Actions**:

1. **Rotate credentials NOW**:
   - Cloudflare R2: Generate new access keys
   - Clerk: Regenerate API keys
   - Update production environment

2. **Fix .env.example files**:
   ```bash
   # Replace all real credentials with placeholders
   sed -i 's/R2_ACCESS_KEY_ID=.*/R2_ACCESS_KEY_ID=your-r2-access-key-id/' .env.example
   sed -i 's/R2_SECRET_ACCESS_KEY=.*/R2_SECRET_ACCESS_KEY=your-r2-secret-access-key/' .env.example
   # ... etc for all credentials
   ```

3. **Commit fixes**:
   ```bash
   git add .env.example apps/web/.env.example
   git commit -m "security: Remove real credentials from example files"
   git push
   ```

4. **Audit git history**:
   ```bash
   # Check if credentials were in previous commits
   git log --all --full-history -- .env.example
   
   # If found in history, consider using git-filter-repo
   # to remove from all commits (destructive operation)
   ```

---

### 🟠 HIGH Priority Issues

#### Issue 2: Incomplete Environment Validation

**Problem**: Many required environment variables are not validated.

**Missing Variables**:
- PAYSTACK_PUBLIC_KEY
- PAYSTACK_SECRET_KEY
- R2_ENDPOINT
- R2_REGION
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET
- R2_PUBLIC_URL
- CRON_SECRET
- QR_TOKEN_SECRET

**Fix**: Update `packages/config/src/env.ts`

```typescript
const serverEnvSchema = z.object({
  // Core
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // Authentication (required)
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  
  // Payment (required in production, optional in dev)
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  
  // Storage (required)
  R2_ENDPOINT: z.string().url("R2_ENDPOINT must be a valid URL"),
  R2_REGION: z.string().default("auto"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET: z.string().min(1, "R2_BUCKET is required"),
  R2_PUBLIC_URL: z.string().url().optional(),
  
  // Security (required)
  CRON_SECRET: z.string().min(32, "CRON_SECRET must be at least 32 characters"),
  QR_TOKEN_SECRET: z.string().min(32, "QR_TOKEN_SECRET must be at least 32 characters"),
  
  // Analytics (optional)
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().optional(),
  
  // Admin (optional)
  PLATFORM_ADMIN_EMAIL: z.string().email().optional(),
}).refine((data) => {
  // In production, payment keys are required
  if (data.NODE_ENV === "production") {
    return data.PAYSTACK_PUBLIC_KEY && data.PAYSTACK_SECRET_KEY;
  }
  return true;
}, {
  message: "PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY are required in production",
});
```


---

### 🟡 MEDIUM Priority Issues

#### Issue 3: Direct process.env Access Bypasses Validation

**Problem**: Many files access `process.env` directly.

**Files Affected**:
- `packages/config/src/payment.ts`
- `packages/storage/src/index.ts`
- `packages/shared/src/utils/qr-token.ts`
- `apps/web/src/app/api/cron/expire-holds/route.ts`
- `apps/web/src/app/api/cron/mark-no-shows/route.ts`
- `apps/web/src/app/api/payments/create/route.ts`
- `apps/web/src/app/api/payments/refund/route.ts`
- `apps/web/src/app/api/payments/webhook/route.ts`

**Fix**: Use validated config everywhere

**Steps**:
1. Add all vars to env.ts schema
2. Export validated env
3. Import from config package
4. Replace process.env with validated env

**Example**:
```typescript
// Before
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

// After
import { serverEnv } from "@dinewithme/config";
const paystackSecretKey = serverEnv.PAYSTACK_SECRET_KEY;
```

---

#### Issue 4: Typo in Bucket Name

**Problem**: `dinethime-media` should be `dinewithme-media`

**Files**:
- `.env.example`
- `apps/web/.env.example`

**Fix**: Correct the typo in example files

---

### 🟢 LOW Priority Issues

#### Issue 5: Weak Default Secrets

**Problem**: Default secrets in code are weak.

**Examples**:
```typescript
const TOKEN_SECRET = process.env.QR_TOKEN_SECRET || "dinewithme-qr-secret-change-in-production";
```

**Fix**: Remove defaults, require in validation

```typescript
// In env.ts
QR_TOKEN_SECRET: z.string().min(32, "QR_TOKEN_SECRET is required and must be at least 32 characters"),

// In qr-token.ts
import { serverEnv } from "@dinewithme/config";
const TOKEN_SECRET = serverEnv.QR_TOKEN_SECRET;
```

---

#### Issue 6: Missing .env.local Documentation

**Problem**: No documentation about .env.local usage.

**Fix**: Add to README.md

```markdown
## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual credentials in `.env.local`

3. Generate secrets:
   ```bash
   # CRON_SECRET
   openssl rand -base64 32
   
   # QR_TOKEN_SECRET
   openssl rand -base64 32
   ```

4. Never commit `.env.local` (already in .gitignore)
```


---

## 7. Summary

### Overall Assessment: Grade B

The configuration system has good structure with centralized config and Zod validation, but critical security issues with exposed credentials and incomplete validation significantly impact the grade.

### Strengths Summary

1. **Centralized Config**: All config in shared package
2. **Zod Validation**: Type-safe environment validation
3. **Organized Structure**: Config split by domain
4. **Type Safety**: Exported types for all config
5. **Computed Properties**: isDevelopment, isProduction, etc.
6. **Helper Functions**: formatAmount, toCents, etc.
7. **Policy Configuration**: Seat and payment policies centralized

### Issues Summary

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 1 | Real credentials exposed in .env.example |
| 🟠 High | 1 | Incomplete environment validation |
| 🟡 Medium | 2 | Direct process.env access, typo |
| 🟢 Low | 2 | Weak defaults, missing docs |
| ✅ Verified | 5 | Config structure working correctly |

### Required Fixes (URGENT)

1. **Rotate ALL exposed credentials immediately** (🔴 CRITICAL)
2. **Remove real credentials from .env.example files** (🔴 CRITICAL)
3. **Complete environment validation** (🟠 HIGH)
4. **Replace direct process.env access** (🟡 MEDIUM)

### Optional Improvements

1. Fix typo in bucket name (🟢 LOW)
2. Remove weak default secrets (🟢 LOW)
3. Add .env.local documentation (🟢 LOW)

### Verification Checklist

- ✅ Config package structure good
- ✅ Zod validation implemented
- ✅ Type-safe exports
- ✅ Organized by domain
- ⚠️ Real credentials in .env.example (CRITICAL)
- ⚠️ Incomplete validation (HIGH)
- ⚠️ Direct process.env access (MEDIUM)
- ⚠️ Weak default secrets (LOW)

---

## 8. Environment Variables Reference

### Required Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NODE_ENV` | enum | Yes | Environment (development/production/test) |
| `DATABASE_URL` | string | Yes | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | string | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | string | Yes | Clerk publishable key |
| `R2_ENDPOINT` | url | Yes | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | string | Yes | R2 access key |
| `R2_SECRET_ACCESS_KEY` | string | Yes | R2 secret key |
| `R2_BUCKET` | string | Yes | R2 bucket name |
| `CRON_SECRET` | string | Yes | Cron job authentication token (32+ chars) |
| `QR_TOKEN_SECRET` | string | Yes | QR token signing secret (32+ chars) |

### Required in Production

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `PAYSTACK_PUBLIC_KEY` | string | Prod | Paystack public key |
| `PAYSTACK_SECRET_KEY` | string | Prod | Paystack secret key |

### Optional Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `R2_REGION` | string | No | R2 region (default: auto) |
| `R2_PUBLIC_URL` | url | No | Custom public URL for R2 |
| `POSTHOG_API_KEY` | string | No | PostHog API key |
| `POSTHOG_HOST` | url | No | PostHog host (default: app.posthog.com) |
| `NEXT_PUBLIC_APP_URL` | url | No | App URL (default: localhost:3000) |
| `NEXT_PUBLIC_ANALYTICS_KEY` | string | No | Client-side analytics key |
| `PLATFORM_ADMIN_EMAIL` | email | No | Admin email for seed script |

---

## Next Steps

1. **URGENT**: Rotate all exposed credentials
2. **URGENT**: Fix .env.example files
3. Complete environment validation
4. Replace direct process.env access
5. Add .env.local documentation
6. Audit git history for credentials

---

**Review Complete**: March 5, 2026  
**Next Section**: Section 17 - QR Code & Check-in System

