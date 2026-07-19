# EPIC 1.5: API Protection

## Overview

Implements comprehensive API protection with authentication, role-based access control, request correlation logging, and analytics tracking.

## Auth Utilities (`apps/web/src/lib/auth.ts`)

### Core Functions

#### `getCurrentUser(): Promise<ApiAuthUser | null>`
Get the currently authenticated user from the database.

```typescript
const user = await getCurrentUser();
if (!user) {
  // Not authenticated or not in database
}
```

**Returns:**
- `ApiAuthUser` if authenticated and found in database
- `null` if not authenticated or not found

#### `requireAuth(request?: NextRequest)`
Require authentication for an API route.

```typescript
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }
  
  const { user } = authResult;
  // User is authenticated
}
```

**Returns:**
- `{ user: ApiAuthUser }` if authenticated
- `{ error: NextResponse }` if not authenticated (401)

**Features:**
- Checks Clerk authentication
- Fetches user from database
- Generates request ID for correlation
- Emits analytics events
- Returns standardized error response

#### `requireRole(roles: Role[], request?: NextRequest)`
Require user to have one of the specified roles.

```typescript
export async function POST(request: NextRequest) {
  const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }
  
  const { user } = authResult;
  // User is authenticated and has required role
}
```

**Returns:**
- `{ user: ApiAuthUser }` if authenticated and authorized
- `{ error: NextResponse }` if not authenticated (401) or not authorized (403)

**Features:**
- Checks authentication first
- Verifies user has one of the required roles
- Generates request ID for correlation
- Emits analytics events
- Returns standardized error responses

#### `isErrorResponse(result)`
Type guard to check if auth result is an error.

```typescript
const authResult = await requireAuth(request);
if (isErrorResponse(authResult)) {
  return authResult.error;
}
// TypeScript knows authResult has 'user' property here
```

### Helper Functions

#### `getRequestId(request?: NextRequest): string`
Generate or extract request ID for correlation logging.

- Checks for existing `x-request-id` header
- Generates new UUID if not present
- Used for tracking requests across logs and analytics

#### `createErrorResponse(message, code, status, requestId)`
Create standardized error response.

```typescript
return createErrorResponse(
  "Authentication required",
  "UNAUTHENTICATED",
  401,
  requestId
);
```

### Types

#### `ApiAuthUser`
```typescript
interface ApiAuthUser {
  id: string;           // Database user ID
  clerkId: string;      // Clerk user ID
  email: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}
```

#### `ApiErrorResponse`
```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    requestId: string;
    timestamp: string;
  };
}
```

---

## Error Response Format

All API errors follow a consistent format:

### 401 Unauthenticated
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHENTICATED",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-27T10:30:00.000Z"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Access denied. Required role: PLATFORM_ADMIN",
    "code": "FORBIDDEN",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-27T10:30:00.000Z"
  }
}
```

### Error Codes
- `UNAUTHENTICATED` - User not authenticated
- `FORBIDDEN` - User authenticated but lacks required role
- `AUTH_ERROR` - Error during authentication process
- `USER_NOT_FOUND` - User not found in database
- `VALIDATION_ERROR` - Invalid input data
- `INTERNAL_ERROR` - Unexpected server error

---

## Request Correlation Logging

Every API request gets a unique request ID for tracking:

### Request ID Flow
1. Check for existing `x-request-id` header
2. Generate new UUID if not present
3. Include in all log messages
4. Include in error responses
5. Include in analytics events

### Log Format
```
[Auth] Authenticated user: user@example.com (DINER) [550e8400-e29b-41d4-a716-446655440000]
[Auth] Unauthorized access attempt by user@example.com (DINER). Required: PLATFORM_ADMIN [550e8400-e29b-41d4-a716-446655440000]
```

### Benefits
- Track requests across multiple services
- Debug issues by following request ID
- Correlate logs with analytics events
- Monitor API access patterns

---

## Analytics Events

### `api_access_granted`
Emitted when user successfully authenticates for API access.

**Payload:**
```typescript
{
  userId: string;
  email: string;
  role: string;
  requestId: string;
  timestamp: string;
}
```

**Example:**
```json
{
  "userId": "clxxx",
  "email": "user@example.com",
  "role": "DINER",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-27T10:30:00.000Z"
}
```

### `api_access_denied`
Emitted when API access is denied (authentication or authorization failure).

**Payload:**
```typescript
{
  userId?: string;
  email?: string;
  role?: string;
  requiredRoles?: string[];
  reason: "unauthenticated" | "insufficient_permissions";
  requestId: string;
  timestamp: string;
}
```

**Example (Unauthenticated):**
```json
{
  "reason": "unauthenticated",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-27T10:30:00.000Z"
}
```

**Example (Insufficient Permissions):**
```json
{
  "userId": "clxxx",
  "email": "user@example.com",
  "role": "DINER",
  "requiredRoles": ["PLATFORM_ADMIN"],
  "reason": "insufficient_permissions",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-27T10:30:00.000Z"
}
```

---

## Protected API Routes

### `/api/users/*`

#### `GET /api/users` - List all users
- **Auth:** PLATFORM_ADMIN only
- **Returns:** Array of users with full details

#### `POST /api/users` - Create user
- **Auth:** PLATFORM_ADMIN only
- **Returns:** Created user

#### `GET /api/users/:id` - Get user by ID
- **Auth:** Authenticated users
- **Authorization:** Users can only view their own profile unless PLATFORM_ADMIN
- **Returns:** User details

#### `PATCH /api/users/:id` - Update user
- **Auth:** Authenticated users
- **Authorization:** Users can only update their own profile unless PLATFORM_ADMIN
- **Returns:** Updated user

#### `DELETE /api/users/:id` - Delete user
- **Auth:** PLATFORM_ADMIN only
- **Returns:** Success message

### `/api/restaurants/*`

#### `GET /api/restaurants` - List restaurants
- **Auth:** Authenticated users
- **Returns:** Array of restaurants (placeholder)

#### `POST /api/restaurants` - Create restaurant
- **Auth:** RESTAURANT_ADMIN or PLATFORM_ADMIN
- **Returns:** Created restaurant (placeholder)

#### `GET /api/restaurants/:id` - Get restaurant
- **Auth:** Authenticated users
- **Returns:** Restaurant details (placeholder)

#### `PATCH /api/restaurants/:id` - Update restaurant
- **Auth:** RESTAURANT_ADMIN or PLATFORM_ADMIN
- **Authorization:** Owner or admin (to be implemented)
- **Returns:** Updated restaurant (placeholder)

#### `DELETE /api/restaurants/:id` - Delete restaurant
- **Auth:** PLATFORM_ADMIN only
- **Returns:** Success message (placeholder)

### `/api/dinners/*`

#### `GET /api/dinners` - List dinners
- **Auth:** Authenticated users
- **Returns:** Array of dinners (placeholder)

#### `POST /api/dinners` - Create dinner
- **Auth:** Authenticated users
- **Returns:** Created dinner (placeholder)

#### `GET /api/dinners/:id` - Get dinner
- **Auth:** Authenticated users
- **Returns:** Dinner details (placeholder)

#### `PATCH /api/dinners/:id` - Update dinner
- **Auth:** Authenticated users
- **Authorization:** Host or admin (to be implemented)
- **Returns:** Updated dinner (placeholder)

#### `DELETE /api/dinners/:id` - Delete dinner
- **Auth:** Authenticated users
- **Authorization:** Host or admin (to be implemented)
- **Returns:** Success message (placeholder)

---

## Usage Examples

### Example 1: Public Endpoint (No Auth)
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: { message: "Public endpoint" },
  });
}
```

### Example 2: Authenticated Endpoint
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  const { user } = authResult;

  return NextResponse.json({
    success: true,
    data: {
      message: `Hello, ${user.email}!`,
      role: user.role,
    },
  });
}
```

### Example 3: Role-Protected Endpoint
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireRole, isErrorResponse } from "@/lib/auth";
import { Role } from "@dinewithme/shared";

export async function POST(request: NextRequest) {
  const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  const { user } = authResult;

  // Admin-only logic here
  return NextResponse.json({
    success: true,
    data: { message: "Admin action completed" },
  });
}
```

### Example 4: Multiple Roles
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireRole, isErrorResponse } from "@/lib/auth";
import { Role } from "@dinewithme/shared";

export async function POST(request: NextRequest) {
  const authResult = await requireRole(
    [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
    request
  );
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  const { user } = authResult;

  // Restaurant admin or platform admin logic
  return NextResponse.json({
    success: true,
    data: { message: "Restaurant action completed" },
  });
}
```

### Example 5: Custom Authorization Logic
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse, createErrorResponse, getRequestId } from "@/lib/auth";
import { Role } from "@dinewithme/shared";

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  const { user } = authResult;
  const { id } = context.params;

  // Custom authorization: user can only edit their own resource
  const resource = await getResource(id);
  
  if (resource.ownerId !== user.id && user.role !== Role.PLATFORM_ADMIN) {
    return createErrorResponse(
      "You can only edit your own resources",
      "FORBIDDEN",
      403,
      getRequestId(request)
    );
  }

  // Update logic here
  return NextResponse.json({
    success: true,
    data: { message: "Resource updated" },
  });
}
```

---

## Files Created/Modified

### Created (8 files)
1. `apps/web/src/lib/auth.ts` - API auth utilities
2. `apps/web/src/app/api/restaurants/route.ts` - Restaurant list/create endpoints
3. `apps/web/src/app/api/restaurants/[id]/route.ts` - Restaurant CRUD endpoints
4. `apps/web/src/app/api/dinners/route.ts` - Dinner list/create endpoints
5. `apps/web/src/app/api/dinners/[id]/route.ts` - Dinner CRUD endpoints
6. `EPIC_1.5_DOCUMENTATION.md` - This file

### Modified (3 files)
1. `apps/web/src/app/api/users/route.ts` - Added auth protection
2. `apps/web/src/app/api/users/[id]/route.ts` - Added auth protection and ownership checks
3. `packages/analytics/src/events.ts` - Added API access events

---

## Security Features

### Defense in Depth
1. **Middleware**: First layer (route-level protection)
2. **API Auth**: Second layer (endpoint-level protection)
3. **Business Logic**: Third layer (resource-level authorization)

### Authentication Flow
1. Extract Clerk user ID from session
2. Fetch user from database by Clerk ID
3. Return user with role information
4. Log authentication attempt
5. Emit analytics event

### Authorization Flow
1. Check authentication first
2. Verify user has required role
3. Log authorization attempt
4. Emit analytics event
5. Return appropriate error if denied

### Request Correlation
- Every request gets unique ID
- ID included in logs and errors
- Enables end-to-end request tracking
- Facilitates debugging and monitoring

---

## Testing

See `EPIC_1.5_TEST_GUIDE.md` for comprehensive testing instructions.

---

## Next Steps

1. Implement restaurant business logic
2. Implement dinner business logic
3. Add resource-level authorization
4. Add rate limiting
5. Add API documentation (Swagger/OpenAPI)
6. Add request/response logging middleware
7. Add performance monitoring

---

## ✅ EPIC 1.5 Complete

All requirements met:
- ✅ Server-side auth utilities created
- ✅ `requireAuth()` function implemented
- ✅ `requireRole()` function implemented
- ✅ `getCurrentUser()` function implemented
- ✅ API routes protected (`/api/users/*`, `/api/restaurants/*`, `/api/dinners/*`)
- ✅ Consistent error responses (401, 403)
- ✅ Request-ID correlation logging
- ✅ Analytics events (`api_access_granted`, `api_access_denied`)
- ✅ Example API usage provided
- ✅ Documentation complete
