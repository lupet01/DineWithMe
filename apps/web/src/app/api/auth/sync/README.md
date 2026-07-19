# Auth Sync Endpoint

## Purpose
Syncs Clerk user profile to the local database. Called after successful authentication.

## Endpoint
`POST /api/auth/sync`

## Authentication
Requires valid Clerk session (uses `auth()` and `currentUser()`)

## Flow
1. Verify Clerk session exists
2. Fetch current user from Clerk
3. Upsert user in database using `authProviderId` (Clerk user ID)
4. Emit analytics events:
   - `USER_CREATED` (if new user)
   - `USER_LOGIN` (always)
   - `USER_UPDATED` (profile sync)

## Response

### Success (200)
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://...",
    "status": "active",
    "isNewUser": false
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```

### User Not Found (404)
```json
{
  "success": false,
  "error": {
    "message": "User not found in Clerk",
    "code": "USER_NOT_FOUND"
  }
}
```

## Usage

### Server-side (recommended)
```typescript
// In a server component or API route
const response = await fetch('/api/auth/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### After Sign-in Hook
This endpoint should be called from a Clerk webhook or after successful sign-in on the server side.

## Security
- Only authenticated users can sync their profile
- Uses Clerk's `auth()` to verify session
- No client-side data accepted (reads from Clerk directly)
