# EPIC 1.4: Route Protection

## Overview

Implements comprehensive route protection with authentication and role-based access control (RBAC) using Next.js middleware.

## Route Protection Rules

### Public Routes (No Authentication Required)
- `/` - Marketing/landing page
- `/sign-in/*` - Sign in pages
- `/sign-up/*` - Sign up pages
- `/api/auth/sync` - User sync endpoint

### Protected Routes (Authentication Required)
- `/app/*` - Core user application (all authenticated users)
- `/dashboard` - User dashboard (all authenticated users)
- `/admin/*` - Admin portal (RESTAURANT_ADMIN or PLATFORM_ADMIN only)

### Role-Based Access
- **DINER**: Can access `/app/*` and `/dashboard`
- **RESTAURANT_ADMIN**: Can access `/app/*`, `/dashboard`, and `/admin/*`
- **PLATFORM_ADMIN**: Can access all routes

## Implementation

### 1. Middleware (`apps/web/src/middleware.ts`)

**Features:**
- Authentication check using Clerk
- Role-based access control for admin routes
- Automatic redirects for unauthorized access
- Database integration for role verification

**Flow:**
1. Check if route is public → allow through
2. Check if user is authenticated → redirect to sign-in if not
3. For admin routes:
   - Fetch user from database
   - Check if user has RESTAURANT_ADMIN or PLATFORM_ADMIN role
   - Redirect to `/app/unauthorized` if insufficient permissions
4. Allow access if all checks pass

**Code:**
```typescript
// Public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/auth/sync",
]);

// Admin routes (role-gated)
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// App routes (authentication required)
const isAppRoute = createRouteMatcher(["/app(.*)", "/dashboard(.*)"]);
```

### 2. Auth Helpers (`apps/web/src/lib/auth-helpers.ts`)

**Functions:**

#### `getAuthUser(): Promise<AuthUser | null>`
Get authenticated user with role from database.

```typescript
const user = await getAuthUser();
if (!user) {
  // Not authenticated or not in database
}
```

#### `requireAuthUser(): Promise<AuthUser>`
Require authenticated user, throws error if not found.

```typescript
const user = await requireAuthUser();
// User is guaranteed to exist
```

#### `hasRole(user: AuthUser, allowedRoles: Role[]): boolean`
Check if user has one of the allowed roles.

```typescript
if (hasRole(user, [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN])) {
  // User has admin access
}
```

#### `requireRole(allowedRoles: Role[]): Promise<AuthUser>`
Require user to have specific role, throws error if not.

```typescript
const admin = await requireRole([Role.PLATFORM_ADMIN]);
// User is guaranteed to be PLATFORM_ADMIN
```

**AuthUser Type:**
```typescript
interface AuthUser {
  id: string;           // Database user ID
  clerkId: string;      // Clerk user ID
  email: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}
```

### 3. Unauthorized Page (`apps/web/src/app/app/unauthorized/`)

**Features:**
- Friendly error message
- Shows user's current role
- Links to dashboard and home
- Contact support option

**URL Parameters:**
- `reason`: Why access was denied (e.g., "admin_access_required")
- `role`: User's current role

**Example:**
```
/app/unauthorized?reason=admin_access_required&role=DINER
```

### 4. Test Pages

#### Admin Portal (`/admin`)
- Shows admin dashboard
- Displays user role
- Placeholder cards for future features
- Only accessible to RESTAURANT_ADMIN and PLATFORM_ADMIN

#### App Page (`/app`)
- Shows main application
- Displays user role
- Shows admin portal link if user has admin role
- Accessible to all authenticated users

## Usage in Server Components

### Check Authentication
```typescript
import { getAuthUser } from "@/lib/auth-helpers";

export default async function MyPage() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  return <div>Welcome, {user.email}</div>;
}
```

### Require Specific Role
```typescript
import { requireRole } from "@/lib/auth-helpers";
import { Role } from "@dinewithme/shared";

export default async function AdminPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);
  
  return <div>Admin: {user.email}</div>;
}
```

### Conditional Rendering Based on Role
```typescript
import { getAuthUser } from "@/lib/auth-helpers";
import { Role } from "@dinewithme/shared";

export default async function DashboardPage() {
  const user = await getAuthUser();
  
  return (
    <div>
      <h1>Dashboard</h1>
      {user?.role === Role.PLATFORM_ADMIN && (
        <Link href="/admin">Admin Portal</Link>
      )}
    </div>
  );
}
```

## Usage in API Routes

### Protect API Endpoint
```typescript
import { requireAuthUser } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireAuthUser();
    
    // User is authenticated
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}
```

### Require Admin Role in API
```typescript
import { requireRole } from "@/lib/auth-helpers";
import { Role } from "@dinewithme/shared";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);
    
    // User is admin
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
}
```

## Security Considerations

### Defense in Depth
- Middleware provides first layer of protection
- Server components verify authentication again
- API routes check permissions independently
- Never rely on client-side checks alone

### Database Sync
- Middleware fetches user from database to get role
- Ensures role changes take effect immediately
- No caching of role information in middleware

### Error Handling
- Graceful degradation on database errors
- Redirects to safe pages on failures
- Logs errors for monitoring

### Edge Cases Handled
- User authenticated with Clerk but not in database → redirect to dashboard for sync
- Database connection error → redirect to dashboard
- Invalid role → deny access
- Missing user record → deny access

## Testing

See `EPIC_1.4_TEST_GUIDE.md` for comprehensive testing instructions.

## Files Created/Modified

### Created (6 files)
1. `apps/web/src/lib/auth-helpers.ts` - Authentication helper functions
2. `apps/web/src/app/app/page.tsx` - Main app page
3. `apps/web/src/app/app/unauthorized/page.tsx` - Unauthorized page
4. `apps/web/src/app/app/unauthorized/unauthorized-content.tsx` - Unauthorized content
5. `apps/web/src/app/admin/page.tsx` - Admin portal page
6. `EPIC_1.4_DOCUMENTATION.md` - This file

### Modified (2 files)
1. `apps/web/src/middleware.ts` - Enhanced with role-based protection
2. `apps/web/src/app/dashboard/page.tsx` - Added test links

## Next Steps

1. Implement admin portal features
2. Add API route protection examples
3. Create role assignment UI
4. Add audit logging for access attempts
5. Implement permission-based UI components

## ✅ EPIC 1.4 Complete

All requirements met:
- ✅ Route protection for `/admin/*` and `/app/*`
- ✅ Public routes allowed: `/`, `/(auth)/*`
- ✅ Middleware enforces authentication
- ✅ Role gating for admin routes
- ✅ Friendly redirect for unauthorized access
- ✅ Helper functions for server components and API routes
- ✅ Test pages created
- ✅ Documentation provided
