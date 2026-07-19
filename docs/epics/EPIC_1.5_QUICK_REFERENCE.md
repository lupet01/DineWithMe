# EPIC 1.5: API Protection - Quick Reference

## 🚀 Import Statement

```typescript
import { requireAuth, requireRole, isErrorResponse, getCurrentUser, getRequestId, createErrorResponse } from "@/lib/auth";
import { Role } from "@dinewithme/shared";
```

---

## 📝 Usage Templates

### Template 1: Public Endpoint (No Auth)
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: { message: "Public data" },
  });
}
```

### Template 2: Authenticated Endpoint
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
    data: { message: `Hello, ${user.email}!` },
  });
}
```

### Template 3: Admin-Only Endpoint
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

### Template 4: Multiple Roles
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

### Template 5: Custom Authorization
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse, createErrorResponse, getRequestId } from "@/lib/auth";
import { Role } from "@dinewithme/shared";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  const { user } = authResult;
  const { id } = context.params;

  // Get resource
  const resource = await getResource(id);

  // Check ownership or admin
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

## 🔑 Function Reference

### `getCurrentUser()`
```typescript
const user = await getCurrentUser();
// Returns: ApiAuthUser | null
```

### `requireAuth(request?)`
```typescript
const authResult = await requireAuth(request);
if (isErrorResponse(authResult)) {
  return authResult.error;
}
const { user } = authResult;
// user: ApiAuthUser
```

### `requireRole(roles, request?)`
```typescript
const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
if (isErrorResponse(authResult)) {
  return authResult.error;
}
const { user } = authResult;
// user: ApiAuthUser with required role
```

### `isErrorResponse(result)`
```typescript
if (isErrorResponse(authResult)) {
  // authResult.error: NextResponse
}
```

### `getRequestId(request?)`
```typescript
const requestId = getRequestId(request);
// Returns: string (UUID)
```

### `createErrorResponse(message, code, status, requestId)`
```typescript
return createErrorResponse(
  "Custom error message",
  "CUSTOM_ERROR_CODE",
  400,
  getRequestId(request)
);
```

---

## 🎭 Role Constants

```typescript
import { Role } from "@dinewithme/shared";

Role.DINER              // Default role
Role.RESTAURANT_ADMIN   // Can manage restaurants
Role.PLATFORM_ADMIN     // Can do everything
```

---

## 📊 Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHENTICATED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `AUTH_ERROR` | 500 | Authentication error |
| `USER_NOT_FOUND` | 404 | User not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 📡 Analytics Events

### `api_access_granted`
```typescript
{
  userId: string;
  email: string;
  role: string;
  requestId: string;
  timestamp: string;
}
```

### `api_access_denied`
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

---

## 🧪 Quick Test Commands

### Test unauthenticated
```bash
curl http://localhost:3001/api/users
```

### Test authenticated
```bash
curl -H "Cookie: __session=YOUR_SESSION" \
     http://localhost:3001/api/users
```

### Test with custom request ID
```bash
curl -H "x-request-id: my-test-id" \
     http://localhost:3001/api/users
```

### Test POST request
```bash
curl -X POST \
     -H "Cookie: __session=YOUR_SESSION" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test"}' \
     http://localhost:3001/api/restaurants
```

---

## 🔍 Debugging

### Check logs for request ID
```
[Auth] Authenticated user: user@example.com (DINER) [550e8400-e29b-41d4-a716-446655440000]
```

### Check error response
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

---

## 📋 Checklist for New Endpoint

- [ ] Import auth utilities
- [ ] Add `requireAuth()` or `requireRole()`
- [ ] Check `isErrorResponse()` and return error
- [ ] Extract `user` from result
- [ ] Implement business logic
- [ ] Return standardized response
- [ ] Test with different roles
- [ ] Verify analytics events
- [ ] Check logs for request ID

---

## 🎯 Common Patterns

### Pattern: List endpoint (admin only)
```typescript
export async function GET(request: NextRequest) {
  const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
  if (isErrorResponse(authResult)) return authResult.error;
  
  const items = await repository.findMany();
  return NextResponse.json({ success: true, data: items });
}
```

### Pattern: Create endpoint (authenticated)
```typescript
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult.error;
  
  const { user } = authResult;
  const body = await request.json();
  
  const item = await repository.create({ ...body, userId: user.id });
  return NextResponse.json({ success: true, data: item }, { status: 201 });
}
```

### Pattern: Update endpoint (owner or admin)
```typescript
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) return authResult.error;
  
  const { user } = authResult;
  const item = await repository.findById(context.params.id);
  
  if (item.userId !== user.id && user.role !== Role.PLATFORM_ADMIN) {
    return createErrorResponse("Forbidden", "FORBIDDEN", 403, getRequestId(request));
  }
  
  const updated = await repository.update(context.params.id, await request.json());
  return NextResponse.json({ success: true, data: updated });
}
```

### Pattern: Delete endpoint (admin only)
```typescript
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
  if (isErrorResponse(authResult)) return authResult.error;
  
  await repository.delete(context.params.id);
  return NextResponse.json({ success: true, data: { message: "Deleted" } });
}
```

---

## 💡 Pro Tips

1. **Always check `isErrorResponse()`** before accessing `user`
2. **Use `getRequestId()`** for custom error responses
3. **Pass `request`** to auth functions for request ID correlation
4. **Check ownership** before allowing updates/deletes
5. **Return consistent** error format
6. **Log important** actions with request ID
7. **Emit analytics** events for access patterns
8. **Test with different** roles

---

## 📚 Full Documentation

- **EPIC_1.5_DOCUMENTATION.md** - Complete guide
- **EPIC_1.5_TEST_GUIDE.md** - Testing instructions
- **EPIC_1.5_COMPLETE.md** - Implementation summary
