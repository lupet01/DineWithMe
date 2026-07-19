# Authentication Guide

Complete guide to authentication and authorization in DineWithMe.

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [Architecture](#architecture)
- [Security](#security)
- [Implementation](#implementation)
- [Future Provider Swap](#future-provider-swap)

---

## Overview

DineWithMe uses **Clerk** as the authentication provider with a custom database sync layer for user management and role-based access control.

### Key Features

- **Social Sign-In** - Email, Google, Apple, etc.
- **Session Management** - Automatic token refresh
- **Database Sync** - User profiles stored in PostgreSQL
- **Role-Based Access** - Three-tier permission system
- **API Protection** - Consistent auth checks across endpoints
- **Route Protection** - Middleware-based access control

---

## Authentication Flow

### Sign-Up Flow

```
┌─────────────┐
│   User      │
│  Visits     │
│  /sign-up   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Clerk Sign-Up UI   │
│  - Email/Password   │
│  - Social Providers │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Clerk Creates      │
│  User Account       │
│  (External DB)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Redirect to        │
│  /dashboard         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Dashboard Triggers │
│  /api/auth/sync     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Sync Endpoint:     │
│  1. Verify session  │
│  2. Read profile    │
│  3. Upsert to DB    │
│  4. Emit analytics  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  User Record        │
│  Created in DB      │
│  role = DINER       │
└─────────────────────┘
```

### Sign-In Flow

```
┌─────────────┐
│   User      │
│  Visits     │
│  /sign-in   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Clerk Sign-In UI   │
│  - Email/Password   │
│  - Social Providers │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Clerk Verifies     │
│  Credentials        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Session Created    │
│  (Cookie-based)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Redirect to        │
│  /dashboard         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Dashboard Triggers │
│  /api/auth/sync     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Sync Updates       │
│  User Profile       │
│  Emits USER_LOGIN   │
└─────────────────────┘
```

### Protected Route Access

```
┌─────────────┐
│   User      │
│  Visits     │
│  /admin     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Middleware         │
│  Checks Session     │
└──────┬──────────────┘
       │
       ├─ Not Authenticated ──────┐
       │                           ▼
       │                    ┌─────────────┐
       │                    │  Redirect   │
       │                    │  /sign-in   │
       │                    └─────────────┘
       │
       ├─ Authenticated ───────────┐
       │                            ▼
       │                     ┌─────────────────┐
       │                     │  Fetch User     │
       │                     │  from Database  │
       │                     └────────┬────────┘
       │                              │
       │                              ▼
       │                     ┌─────────────────┐
       │                     │  Check Role     │
       │                     └────────┬────────┘
       │                              │
       │                              ├─ Has Admin Role ──┐
       │                              │                    ▼
       │                              │             ┌─────────────┐
       │                              │             │  Allow      │
       │                              │             │  Access     │
       │                              │             └─────────────┘
       │                              │
       │                              └─ No Admin Role ───┐
       │                                                   ▼
       │                                            ┌─────────────┐
       │                                            │  Redirect   │
       │                                            │  /app/      │
       │                                            │  unauthorized│
       │                                            └─────────────┘
```

### API Request Flow

```
┌─────────────┐
│  Client     │
│  Makes API  │
│  Request    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  API Route          │
│  Calls requireAuth()│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Extract Clerk      │
│  Session Token      │
└──────┬──────────────┘
       │
       ├─ No Token ────────────────┐
       │                            ▼
       │                     ┌─────────────────┐
       │                     │  Return 401     │
       │                     │  UNAUTHENTICATED│
       │                     │  + Request ID   │
       │                     │  + Analytics    │
       │                     └─────────────────┘
       │
       ├─ Has Token ───────────────┐
       │                            ▼
       │                     ┌─────────────────┐
       │                     │  Fetch User     │
       │                     │  from Database  │
       │                     │  by Clerk ID    │
       │                     └────────┬────────┘
       │                              │
       │                              ├─ User Not Found ──┐
       │                              │                    ▼
       │                              │             ┌─────────────┐
       │                              │             │  Return 401 │
       │                              │             │  + Sync     │
       │                              │             │  Suggestion │
       │                              │             └─────────────┘
       │                              │
       │                              └─ User Found ──────┐
       │                                                   ▼
       │                                            ┌─────────────┐
       │                                            │  Check Role │
       │                                            │  (if needed)│
       │                                            └──────┬──────┘
       │                                                   │
       │                                                   ├─ Authorized ──┐
       │                                                   │                ▼
       │                                                   │         ┌─────────────┐
       │                                                   │         │  Process    │
       │                                                   │         │  Request    │
       │                                                   │         │  + Analytics│
       │                                                   │         └─────────────┘
       │                                                   │
       │                                                   └─ Not Authorized ──┐
       │                                                                        ▼
       │                                                                 ┌─────────────┐
       │                                                                 │  Return 403 │
       │                                                                 │  FORBIDDEN  │
       │                                                                 │  + Analytics│
       │                                                                 └─────────────┘
```

---

## Architecture

### Components

#### 1. Clerk (External Service)
- **Responsibility:** Authentication provider
- **Handles:** Sign-up, sign-in, session management
- **Storage:** External Clerk database
- **Integration:** SDK and webhooks

#### 2. Database Sync Layer
- **Responsibility:** Sync Clerk users to local database
- **Location:** `/api/auth/sync`
- **Triggers:** Dashboard load, webhooks (future)
- **Creates:** User records with roles

#### 3. Middleware Protection
- **Responsibility:** Route-level access control
- **Location:** `apps/web/src/middleware.ts`
- **Checks:** Authentication and role requirements
- **Actions:** Allow, redirect, or block

#### 4. API Protection
- **Responsibility:** Endpoint-level access control
- **Location:** `apps/web/src/lib/auth.ts`
- **Functions:** `requireAuth()`, `requireRole()`
- **Returns:** User or error response

#### 5. Auth Helpers
- **Responsibility:** Server component auth utilities
- **Location:** `apps/web/src/lib/auth-helpers.ts`
- **Functions:** `getAuthUser()`, `requireAuthUser()`
- **Usage:** Server components and pages

### Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Clerk (External)                      │
│  - User accounts                                         │
│  - Authentication                                        │
│  - Session management                                    │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ Session Token
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│                  Next.js Application                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              Middleware Layer                   │    │
│  │  - Route protection                            │    │
│  │  - Role verification                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              API Layer                          │    │
│  │  - requireAuth()                               │    │
│  │  - requireRole()                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              Server Components                  │    │
│  │  - getAuthUser()                               │    │
│  │  - requireAuthUser()                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ Database Queries
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│                PostgreSQL Database                       │
│  - User profiles                                         │
│  - Roles (DINER, RESTAURANT_ADMIN, PLATFORM_ADMIN)     │
│  - Application data                                      │
└──────────────────────────────────────────────────────────┘
```

### Session Storage

**Clerk Session:**
- Stored in HTTP-only cookies
- Automatically refreshed
- Secure by default
- No manual token management

**Database User:**
- Fetched on each request
- Includes role information
- Cached by Next.js (automatic)
- Real-time role updates

---

## Security

### Authentication Security

#### Session Management
- **HTTP-only cookies** - Not accessible via JavaScript
- **Secure flag** - HTTPS only in production
- **SameSite=Lax** - CSRF protection
- **Automatic refresh** - No manual token handling

#### Token Security
- **Short-lived tokens** - Reduced exposure window
- **Rotation on refresh** - New token on each refresh
- **Revocation support** - Immediate sign-out
- **No localStorage** - Prevents XSS attacks

### Authorization Security

#### Multi-Layer Protection
1. **Middleware** - First line of defense
2. **API Routes** - Endpoint-level checks
3. **Business Logic** - Resource-level authorization

#### Defense in Depth
```
Request
  ↓
Middleware (Route protection)
  ↓
API Auth (Endpoint protection)
  ↓
Business Logic (Resource protection)
  ↓
Database (Row-level security - future)
```

### Request Correlation

#### Request ID Tracking
- **Generation:** UUID for each request
- **Header:** `x-request-id` (respected if provided)
- **Logging:** Included in all log messages
- **Errors:** Included in error responses
- **Analytics:** Included in events

**Benefits:**
- End-to-end request tracking
- Debugging across services
- Correlation with analytics
- Security audit trails

### Error Handling

#### Consistent Error Responses

**401 Unauthenticated:**
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHENTICATED",
    "requestId": "uuid",
    "timestamp": "ISO 8601"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "message": "Access denied. Required role: PLATFORM_ADMIN",
    "code": "FORBIDDEN",
    "requestId": "uuid",
    "timestamp": "ISO 8601"
  }
}
```

#### Security Considerations
- **No sensitive data** in error messages
- **Generic messages** for auth failures
- **Request ID** for support tracking
- **Consistent format** across all endpoints

### Analytics & Monitoring

#### Security Events Tracked

**`api_access_granted`:**
- User successfully authenticated
- Includes: userId, email, role, requestId

**`api_access_denied`:**
- Authentication or authorization failed
- Includes: reason, requestId, user info (if available)

**Benefits:**
- Detect suspicious activity
- Monitor access patterns
- Audit trail for compliance
- Performance monitoring

---

## Implementation

### Server Components

```typescript
import { getAuthUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  return <div>Welcome, {user.email}</div>;
}
```

### API Routes

```typescript
import { requireAuth, requireRole, isErrorResponse } from "@/lib/auth";
import { Role } from "@dinewithme/shared";

// Require authentication
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }
  
  const { user } = authResult;
  // Process request
}

// Require specific role
export async function POST(request: NextRequest) {
  const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }
  
  const { user } = authResult;
  // Admin-only logic
}
```

### Middleware

```typescript
// Automatically applied to all routes
// See apps/web/src/middleware.ts

export default clerkMiddleware(async (auth, request) => {
  // Public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }
  
  // Require authentication
  const { userId } = await auth();
  if (!userId) {
    return auth().protect();
  }
  
  // Role-based protection for admin routes
  if (isAdminRoute(request)) {
    const user = await userRepository.findByAuthProviderId(userId);
    if (!hasAdminRole(user)) {
      return NextResponse.redirect("/app/unauthorized");
    }
  }
  
  return NextResponse.next();
});
```

---

## Future Provider Swap

### Why Provider Agnostic?

**Current:** Clerk
**Future:** Auth0, Supabase Auth, Custom, etc.

**Benefits:**
- Vendor independence
- Cost optimization
- Feature requirements
- Compliance needs

### Abstraction Layer

#### Current Architecture
```
Application Code
       ↓
  Auth Helpers (Abstraction)
       ↓
    Clerk SDK
       ↓
  Clerk Service
```

#### Swap Strategy

**Step 1: Create Auth Adapter Interface**
```typescript
interface AuthAdapter {
  getCurrentUser(): Promise<User | null>;
  signIn(credentials): Promise<Session>;
  signOut(): Promise<void>;
  verifySession(token): Promise<boolean>;
}
```

**Step 2: Implement Clerk Adapter**
```typescript
class ClerkAdapter implements AuthAdapter {
  async getCurrentUser() {
    const { userId } = await auth();
    // Clerk-specific implementation
  }
}
```

**Step 3: Implement New Provider Adapter**
```typescript
class Auth0Adapter implements AuthAdapter {
  async getCurrentUser() {
    // Auth0-specific implementation
  }
}
```

**Step 4: Swap at Runtime**
```typescript
const authAdapter = process.env.AUTH_PROVIDER === 'auth0'
  ? new Auth0Adapter()
  : new ClerkAdapter();
```

### Migration Checklist

- [ ] Create auth adapter interface
- [ ] Implement current provider adapter
- [ ] Update auth helpers to use adapter
- [ ] Test with current provider
- [ ] Implement new provider adapter
- [ ] Test with new provider
- [ ] Update environment configuration
- [ ] Migrate user sessions
- [ ] Update documentation

### Considerations

**Session Migration:**
- Export user data from Clerk
- Import to new provider
- Handle password resets
- Notify users of changes

**Feature Parity:**
- Social sign-in providers
- Multi-factor authentication
- Session management
- Webhooks

**Testing:**
- Authentication flows
- Authorization checks
- Session handling
- Error scenarios

---

## Best Practices

### Do's ✅

- **Always use auth helpers** - Don't call Clerk directly
- **Check authentication** in server components
- **Protect API routes** with requireAuth/requireRole
- **Use middleware** for route protection
- **Emit analytics events** for security monitoring
- **Include request IDs** in logs and errors
- **Handle errors gracefully** with user-friendly messages
- **Test with different roles** during development

### Don'ts ❌

- **Don't store tokens** in localStorage
- **Don't trust client-side** auth checks alone
- **Don't expose sensitive data** in error messages
- **Don't skip middleware** protection
- **Don't hardcode roles** in components
- **Don't forget to sync** users to database
- **Don't cache user roles** (always fetch fresh)
- **Don't bypass auth** in development

---

## Troubleshooting

### Common Issues

**Issue: User not found in database**
- **Cause:** User hasn't visited dashboard yet
- **Solution:** Visit `/dashboard` to trigger sync

**Issue: Role changes not taking effect**
- **Cause:** Cached user data
- **Solution:** Hard refresh browser (Ctrl+Shift+R)

**Issue: Infinite redirect loop**
- **Cause:** Middleware misconfiguration
- **Solution:** Check public route matchers

**Issue: 401 on authenticated requests**
- **Cause:** Session expired or invalid
- **Solution:** Sign out and sign in again

---

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [OWASP Auth Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Last Updated:** February 28, 2026  
**Version:** 1.0
