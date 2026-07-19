# Auth Runtime Fix

## Issue
The new auth module exports weren't being recognized at runtime, causing:
```
Error: requireAuthUser is not a function
```

## Root Cause
Next.js barrel export pattern (re-exporting from index.ts) can sometimes cause bundling issues where exports aren't properly resolved at runtime.

## Solution
Changed all imports to use direct module paths instead of barrel exports:

### Before (Barrel Export)
```typescript
import { requireAuthUser } from "@/lib/auth";
```

### After (Direct Import)
```typescript
import { requireAuthUser } from "@/lib/auth/server";
```

## Files Updated

### Layouts
- `apps/web/src/app/(core)/layout.tsx` - Import from `@/lib/auth/server`
- `apps/web/src/app/admin/layout.tsx` - Import from `@/lib/auth/server`
- `apps/web/src/app/admin/ops/layout.tsx` - Import from `@/lib/auth/server`

### Server Actions
- `apps/web/src/app/admin/restaurant/theme-actions.ts` - Import from `@/lib/auth/server`
- `apps/web/src/app/admin/restaurant/media-actions.ts` - Import from `@/lib/auth/server`
- `apps/web/src/app/admin/restaurant/actions.ts` - Import from `@/lib/auth/server`
- `apps/web/src/app/admin/dinners/create-actions.ts` - Import from `@/lib/auth/server`

### API Routes
API routes should continue using:
```typescript
import { requireAuth, requireRole, isErrorResponse } from "@/lib/auth/api";
```

Or for backwards compatibility:
```typescript
import { getCurrentUser } from "@/lib/auth/server";
```

## Cache Cleared
Removed `.next` directory to force fresh build with new imports.

## Import Guide

### For Server Components & Layouts
```typescript
import { 
  getAuthUser,
  getCurrentUser,  // alias for getAuthUser
  requireAuthUser,
  requireUserRole,
  checkUserRole 
} from "@/lib/auth/server";
```

### For Server Actions
```typescript
import { requireAuthUser } from "@/lib/auth/server";
```

### For API Routes
```typescript
import { 
  requireAuth,
  requireRole,
  isErrorResponse,
  getRequestId,
  createErrorResponse 
} from "@/lib/auth/api";
```

### For Shared Utilities
```typescript
import { hasRole, validateRole, type AuthUser } from "@/lib/auth/core";
```

## Testing
1. Clear Next.js cache: `rm -rf apps/web/.next`
2. Restart dev server
3. Navigate to protected routes
4. Verify auth works correctly

## Status
✅ Fixed - Direct imports resolve correctly at runtime
