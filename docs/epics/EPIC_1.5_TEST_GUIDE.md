# EPIC 1.5: API Protection - Test Guide

## Prerequisites

1. **Dev server running**: `npm run dev`
2. **Test users created**:
   - DINER user (diner@test.com)
   - PLATFORM_ADMIN user (lu.petros@outlook.com)
3. **API testing tool**: Postman, Insomnia, or curl
4. **Authentication tokens**: Clerk session tokens

---

## Getting Authentication Tokens

### Method 1: Browser DevTools
1. Sign in to the app
2. Open DevTools → Application → Cookies
3. Copy the `__session` cookie value
4. Use in API requests as cookie header

### Method 2: Clerk Dashboard
1. Go to Clerk Dashboard
2. Navigate to Users
3. Click on a user
4. Copy the user ID for testing

---

## Test Cases

### Test 1: Unauthenticated Access (401)

**Objective:** Verify unauthenticated requests are rejected

**Endpoints to Test:**
- `GET /api/users`
- `GET /api/restaurants`
- `GET /api/dinners`

**Steps:**
```bash
curl http://localhost:3001/api/users
```

**Expected Response:**
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

**Expected Status:** 401

**Expected Analytics Event:** `api_access_denied` with `reason: "unauthenticated"`

**Status:** [ ] Pass [ ] Fail

---

### Test 2: DINER Access to Admin Endpoint (403)

**Objective:** Verify DINER cannot access admin-only endpoints

**Endpoint:** `GET /api/users` (requires PLATFORM_ADMIN)

**Steps:**
1. Sign in as DINER (diner@test.com)
2. Get session cookie
3. Make request:
```bash
curl -H "Cookie: __session=YOUR_SESSION_COOKIE" \
     http://localhost:3001/api/users
```

**Expected Response:**
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

**Expected Status:** 403

**Expected Analytics Events:**
1. `api_access_granted` (authentication succeeded)
2. `api_access_denied` (authorization failed with `reason: "insufficient_permissions"`)

**Expected Logs:**
```
[Auth] Authenticated user: diner@test.com (DINER) [request-id]
[Auth] Unauthorized access attempt by diner@test.com (DINER). Required: PLATFORM_ADMIN [request-id]
```

**Status:** [ ] Pass [ ] Fail

---

### Test 3: PLATFORM_ADMIN Access to Admin Endpoint (200)

**Objective:** Verify PLATFORM_ADMIN can access admin-only endpoints

**Endpoint:** `GET /api/users`

**Steps:**
1. Sign in as PLATFORM_ADMIN (lu.petros@outlook.com)
2. Get session cookie
3. Make request:
```bash
curl -H "Cookie: __session=YOUR_SESSION_COOKIE" \
     http://localhost:3001/api/users
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "email": "diner@test.com",
      "role": "DINER",
      "firstName": null,
      "lastName": null,
      "status": "active",
      "createdAt": "2026-02-27T10:00:00.000Z"
    },
    {
      "id": "clyyy",
      "email": "lu.petros@outlook.com",
      "role": "PLATFORM_ADMIN",
      "firstName": "Lu",
      "lastName": "Petros",
      "status": "active",
      "createdAt": "2026-02-27T09:00:00.000Z"
    }
  ]
}
```

**Expected Status:** 200

**Expected Analytics Event:** `api_access_granted`

**Expected Logs:**
```
[Auth] Authenticated user: lu.petros@outlook.com (PLATFORM_ADMIN) [request-id]
[Auth] Authorized user: lu.petros@outlook.com (PLATFORM_ADMIN) [request-id]
```

**Status:** [ ] Pass [ ] Fail

---

### Test 4: User Can View Own Profile (200)

**Objective:** Verify users can view their own profile

**Endpoint:** `GET /api/users/:id`

**Steps:**
1. Sign in as DINER
2. Get your user ID from database or dashboard
3. Make request:
```bash
curl -H "Cookie: __session=YOUR_SESSION_COOKIE" \
     http://localhost:3001/api/users/YOUR_USER_ID
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "email": "diner@test.com",
    "firstName": null,
    "lastName": null,
    "role": "DINER",
    "status": "active",
    "createdAt": "2026-02-27T10:00:00.000Z"
  }
}
```

**Expected Status:** 200

**Status:** [ ] Pass [ ] Fail

---

### Test 5: User Cannot View Other User's Profile (403)

**Objective:** Verify users cannot view other users' profiles

**Endpoint:** `GET /api/users/:id`

**Steps:**
1. Sign in as DINER
2. Get another user's ID
3. Make request:
```bash
curl -H "Cookie: __session=YOUR_SESSION_COOKIE" \
     http://localhost:3001/api/users/OTHER_USER_ID
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "Access denied",
    "code": "FORBIDDEN"
  }
}
```

**Expected Status:** 403

**Status:** [ ] Pass [ ] Fail

---

### Test 6: RESTAURANT_ADMIN Can Create Restaurant (201)

**Objective:** Verify RESTAURANT_ADMIN can create restaurants

**Endpoint:** `POST /api/restaurants`

**Steps:**
1. Promote a user to RESTAURANT_ADMIN:
```sql
UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'restaurant@test.com';
```
2. Sign in as that user
3. Make request:
```bash
curl -X POST \
     -H "Cookie: __session=YOUR_SESSION_COOKIE" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Restaurant"}' \
     http://localhost:3001/api/restaurants
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Restaurant creation - Coming soon",
    "requestedBy": "restaurant@test.com"
  }
}
```

**Expected Status:** 201

**Status:** [ ] Pass [ ] Fail

---

### Test 7: DINER Cannot Create Restaurant (403)

**Objective:** Verify DINER cannot create restaurants

**Endpoint:** `POST /api/restaurants`

**Steps:**
1. Sign in as DINER
2. Make request:
```bash
curl -X POST \
     -H "Cookie: __session=YOUR_SESSION_COOKIE" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Restaurant"}' \
     http://localhost:3001/api/restaurants
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "message": "Access denied. Required role: RESTAURANT_ADMIN or PLATFORM_ADMIN",
    "code": "FORBIDDEN",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-27T10:30:00.000Z"
  }
}
```

**Expected Status:** 403

**Status:** [ ] Pass [ ] Fail

---

### Test 8: All Authenticated Users Can Create Dinner (201)

**Objective:** Verify any authenticated user can create dinners

**Endpoint:** `POST /api/dinners`

**Steps:**
1. Sign in as DINER
2. Make request:
```bash
curl -X POST \
     -H "Cookie: __session=YOUR_SESSION_COOKIE" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Dinner"}' \
     http://localhost:3001/api/dinners
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Dinner creation - Coming soon",
    "hostEmail": "diner@test.com"
  }
}
```

**Expected Status:** 201

**Status:** [ ] Pass [ ] Fail

---

### Test 9: Request ID Correlation

**Objective:** Verify request IDs are consistent across logs and responses

**Steps:**
1. Make an unauthenticated request
2. Note the `requestId` in the error response
3. Check server logs for the same request ID

**Expected:**
- Error response contains `requestId`
- Server logs contain same `requestId`
- Analytics event contains same `requestId`

**Example Log:**
```
[Auth] Unauthenticated access attempt [550e8400-e29b-41d4-a716-446655440000]
```

**Example Response:**
```json
{
  "error": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 10: Custom Request ID Header

**Objective:** Verify custom request IDs are respected

**Steps:**
1. Make request with custom `x-request-id` header:
```bash
curl -H "x-request-id: my-custom-id-12345" \
     http://localhost:3001/api/users
```

**Expected:**
- Error response contains `requestId: "my-custom-id-12345"`
- Server logs contain `[my-custom-id-12345]`

**Status:** [ ] Pass [ ] Fail

---

## Analytics Event Testing

### Test 11: api_access_granted Event

**Objective:** Verify analytics event is emitted on successful authentication

**Steps:**
1. Sign in as any user
2. Make authenticated request to any endpoint
3. Check analytics logs/dashboard

**Expected Event:**
```json
{
  "event": "api_access_granted",
  "properties": {
    "userId": "clxxx",
    "email": "user@example.com",
    "role": "DINER",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-27T10:30:00.000Z"
  }
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 12: api_access_denied Event (Unauthenticated)

**Objective:** Verify analytics event is emitted on authentication failure

**Steps:**
1. Make unauthenticated request
2. Check analytics logs/dashboard

**Expected Event:**
```json
{
  "event": "api_access_denied",
  "properties": {
    "reason": "unauthenticated",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-27T10:30:00.000Z"
  }
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 13: api_access_denied Event (Insufficient Permissions)

**Objective:** Verify analytics event is emitted on authorization failure

**Steps:**
1. Sign in as DINER
2. Try to access admin endpoint
3. Check analytics logs/dashboard

**Expected Event:**
```json
{
  "event": "api_access_denied",
  "properties": {
    "userId": "clxxx",
    "email": "diner@test.com",
    "role": "DINER",
    "requiredRoles": ["PLATFORM_ADMIN"],
    "reason": "insufficient_permissions",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-27T10:30:00.000Z"
  }
}
```

**Status:** [ ] Pass [ ] Fail

---

## Error Format Testing

### Test 14: Error Response Structure

**Objective:** Verify all errors follow consistent format

**Steps:**
1. Trigger various errors (401, 403, 404, 500)
2. Verify response structure

**Expected Structure:**
```json
{
  "success": false,
  "error": {
    "message": "string",
    "code": "string",
    "requestId": "string (UUID)",
    "timestamp": "string (ISO 8601)"
  }
}
```

**Required Fields:**
- `success` (always false)
- `error.message` (human-readable)
- `error.code` (machine-readable)
- `error.requestId` (UUID format)
- `error.timestamp` (ISO 8601 format)

**Status:** [ ] Pass [ ] Fail

---

## Quick Test Script

### PowerShell Script
```powershell
# Test unauthenticated access
Write-Host "Test 1: Unauthenticated access" -ForegroundColor Yellow
curl http://localhost:3001/api/users

# Test authenticated access (replace with your session cookie)
Write-Host "`nTest 2: Authenticated access" -ForegroundColor Yellow
$session = "YOUR_SESSION_COOKIE"
curl -H "Cookie: __session=$session" http://localhost:3001/api/users

# Test custom request ID
Write-Host "`nTest 3: Custom request ID" -ForegroundColor Yellow
curl -H "x-request-id: test-12345" http://localhost:3001/api/users
```

### Bash Script
```bash
#!/bin/bash

# Test unauthenticated access
echo "Test 1: Unauthenticated access"
curl http://localhost:3001/api/users

# Test authenticated access (replace with your session cookie)
echo -e "\nTest 2: Authenticated access"
SESSION="YOUR_SESSION_COOKIE"
curl -H "Cookie: __session=$SESSION" http://localhost:3001/api/users

# Test custom request ID
echo -e "\nTest 3: Custom request ID"
curl -H "x-request-id: test-12345" http://localhost:3001/api/users
```

---

## Troubleshooting

### Issue: "Authentication required" even when signed in
**Solution:**
1. Check cookie is being sent correctly
2. Verify Clerk session is valid
3. Check user exists in database
4. Try signing out and back in

### Issue: Request ID not in logs
**Solution:**
1. Check server console output
2. Verify logging is enabled
3. Check log level configuration

### Issue: Analytics events not appearing
**Solution:**
1. Check PostHog configuration
2. Verify API key is set
3. Check network requests in DevTools
4. Review analytics provider logs

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Unauthenticated Access (401) | [ ] | |
| 2. DINER Access to Admin (403) | [ ] | |
| 3. ADMIN Access to Admin (200) | [ ] | |
| 4. User View Own Profile (200) | [ ] | |
| 5. User View Other Profile (403) | [ ] | |
| 6. RESTAURANT_ADMIN Create Restaurant (201) | [ ] | |
| 7. DINER Create Restaurant (403) | [ ] | |
| 8. All Users Create Dinner (201) | [ ] | |
| 9. Request ID Correlation | [ ] | |
| 10. Custom Request ID Header | [ ] | |
| 11. api_access_granted Event | [ ] | |
| 12. api_access_denied (Unauth) Event | [ ] | |
| 13. api_access_denied (Forbidden) Event | [ ] | |
| 14. Error Response Structure | [ ] | |

---

## Sign-Off

- [ ] All tests passed
- [ ] Analytics events verified
- [ ] Request correlation working
- [ ] Error format consistent
- [ ] Documentation reviewed
- [ ] Ready for production

**Tested by:** _______________  
**Date:** _______________  
**Notes:** _______________
