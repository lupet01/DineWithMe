# EPIC 1.2 Test Plan: User Profile Persistence

## Prerequisites
- PostgreSQL database running
- Clerk authentication configured
- User signed in to the application

## Test Cases

### 1. Database Schema
**Test:** Verify Prisma schema has all required fields

```bash
# Check schema
cat prisma/schema.prisma
```

**Expected:**
- ✅ `id` (cuid)
- ✅ `authProviderId` (string, unique)
- ✅ `email` (string, unique)
- ✅ `firstName` (string, optional)
- ✅ `lastName` (string, optional)
- ✅ `avatarUrl` (string, optional)
- ✅ `status` (string, default "active")
- ✅ `createdAt` (DateTime)
- ✅ `updatedAt` (DateTime)

### 2. Database Migration
**Test:** Run Prisma migration

```bash
cd packages/db
npm run db:push
# or
npm run db:migrate
```

**Expected:**
- ✅ Migration succeeds
- ✅ `users` table created in PostgreSQL
- ✅ All columns present with correct types

### 3. Repository Layer
**Test:** Verify repository functions exist

**Check:** `packages/db/src/repositories/user.repository.ts`

**Expected Functions:**
- ✅ `findById(id: string)`
- ✅ `findByAuthProviderId(authProviderId: string)`
- ✅ `findByEmail(email: string)`
- ✅ `findMany()`
- ✅ `create(data)`
- ✅ `update(id, data)`
- ✅ `upsertByAuthProviderId(authProviderId, data)`
- ✅ `delete(id)`

### 4. API Route - Auth Sync
**Test:** Call sync endpoint

```bash
# With valid session
curl -X POST http://localhost:3001/api/auth/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=<clerk_session_token>"
```

**Expected Response (200):**
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

**Test:** Call without authentication

```bash
curl -X POST http://localhost:3001/api/auth/sync
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```

### 5. First-Time User Flow
**Test:** Sign up new user

1. Sign out if signed in
2. Go to `/sign-up`
3. Create new account with email
4. Verify email
5. Visit `/dashboard`

**Expected:**
- ✅ User created in Clerk
- ✅ User synced to database
- ✅ `isNewUser: true` in sync response
- ✅ Analytics event `USER_CREATED` emitted
- ✅ Analytics event `USER_LOGIN` emitted
- ✅ Analytics event `USER_UPDATED` emitted

**Verify in Database:**
```sql
SELECT * FROM users WHERE email = 'newuser@example.com';
```

**Expected:**
- ✅ One record exists
- ✅ `authProviderId` matches Clerk user ID
- ✅ `email` matches
- ✅ `firstName`, `lastName`, `avatarUrl` populated from Clerk
- ✅ `status` = "active"
- ✅ `createdAt` and `updatedAt` set

### 6. Returning User Flow
**Test:** Sign in existing user

1. Sign out
2. Sign in with existing account
3. Visit `/dashboard`

**Expected:**
- ✅ User found in database
- ✅ `isNewUser: false` in sync response
- ✅ Profile updated if changed in Clerk
- ✅ Analytics event `USER_LOGIN` emitted
- ✅ Analytics event `USER_UPDATED` emitted
- ✅ No duplicate `USER_CREATED` event

**Verify in Database:**
```sql
SELECT * FROM users WHERE email = 'existinguser@example.com';
```

**Expected:**
- ✅ Still one record (no duplicates)
- ✅ `updatedAt` timestamp updated

### 7. Profile Update Flow
**Test:** Update profile in Clerk

1. Go to Clerk dashboard
2. Update user's first name, last name, or avatar
3. Sign in to app
4. Visit `/dashboard`

**Expected:**
- ✅ Changes reflected in database
- ✅ `updatedAt` timestamp updated
- ✅ Analytics event `USER_UPDATED` emitted

### 8. Analytics Events
**Test:** Verify analytics tracking

**Check console logs for:**
```
[Analytics] Track event: {
  event: 'user_created',
  properties: { userId: '...', email: '...', timestamp: '...' }
}

[Analytics] Track event: {
  event: 'user_login',
  properties: { userId: '...', method: 'email', timestamp: '...' }
}

[Analytics] Track event: {
  event: 'user_updated',
  properties: { userId: '...', fields: [...], timestamp: '...' }
}
```

### 9. Error Handling
**Test:** Database connection failure

1. Stop PostgreSQL
2. Try to sync user

**Expected:**
- ✅ 500 error returned
- ✅ Error logged
- ✅ User-friendly error message

**Test:** Invalid Clerk session

1. Manually corrupt session cookie
2. Call `/api/auth/sync`

**Expected:**
- ✅ 401 Unauthorized
- ✅ No database operations attempted

### 10. Repository Layer Isolation
**Test:** Verify no direct Prisma usage

```bash
# Search for direct Prisma usage in routes
grep -r "prisma\." apps/web/src/app/api --exclude-dir=node_modules
```

**Expected:**
- ✅ No direct `prisma.` calls found
- ✅ Only repository methods used

## Success Criteria
- ✅ All 10 test cases pass
- ✅ No direct Prisma usage in API routes
- ✅ Analytics events emitted correctly
- ✅ Database records created/updated properly
- ✅ No duplicate users created
- ✅ Profile updates sync correctly
