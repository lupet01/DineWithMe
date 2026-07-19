# EPIC 1.4: Route Protection - Test Guide

## Prerequisites

1. **Database running** with user table and Role enum
2. **Dev server running**: `npm run dev`
3. **Test users**:
   - DINER user (default role)
   - PLATFORM_ADMIN user (promoted via seed script)

## Test Setup

### Create Test Users

#### 1. Create DINER User
```bash
# Sign up with a new email at http://localhost:3001/sign-up
# Example: diner@test.com
# Visit /dashboard to sync user to database
```

#### 2. Create PLATFORM_ADMIN User
```bash
# Sign up with your admin email at http://localhost:3001/sign-up
# Example: lu.petros@outlook.com (from .env)
# Visit /dashboard to sync user to database
# Run: .\promote-admin.ps1
```

#### 3. Verify Users in Database
```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT email, role FROM users;"
```

Expected output:
```
         email          |      role
------------------------+----------------
 diner@test.com         | DINER
 lu.petros@outlook.com  | PLATFORM_ADMIN
```

---

## Test Cases

### Test 1: Public Routes (No Authentication)

**Objective:** Verify public routes are accessible without authentication

**Steps:**
1. Open incognito/private browser window
2. Visit `http://localhost:3001/`
3. Visit `http://localhost:3001/sign-in`
4. Visit `http://localhost:3001/sign-up`

**Expected Result:**
- ✅ All pages load without redirect
- ✅ No authentication required
- ✅ Sign in/up forms visible

**Status:** [ ] Pass [ ] Fail

---

### Test 2: Protected Routes Redirect to Sign In

**Objective:** Verify unauthenticated users are redirected to sign in

**Steps:**
1. Open incognito/private browser window
2. Visit `http://localhost:3001/dashboard`
3. Visit `http://localhost:3001/app`
4. Visit `http://localhost:3001/admin`

**Expected Result:**
- ✅ All routes redirect to Clerk sign-in page
- ✅ After sign in, user is redirected back to original URL

**Status:** [ ] Pass [ ] Fail

---

### Test 3: DINER Access to App Routes

**Objective:** Verify DINER can access app routes but not admin routes

**Steps:**
1. Sign in as DINER user (diner@test.com)
2. Visit `http://localhost:3001/dashboard`
3. Click "Go to App" button
4. Verify you're at `/app` page
5. Click "Try Admin Portal" button from dashboard
6. Verify redirect to `/app/unauthorized`

**Expected Result:**
- ✅ Dashboard loads successfully
- ✅ `/app` page loads successfully
- ✅ User role shows "DINER"
- ✅ `/admin` redirects to `/app/unauthorized`
- ✅ Unauthorized page shows "Admin Access Required"
- ✅ Unauthorized page shows current role: DINER

**Status:** [ ] Pass [ ] Fail

---

### Test 4: DINER Direct Admin URL Access

**Objective:** Verify DINER cannot bypass protection by typing URL directly

**Steps:**
1. Sign in as DINER user
2. Type `http://localhost:3001/admin` directly in address bar
3. Press Enter

**Expected Result:**
- ✅ Immediately redirected to `/app/unauthorized`
- ✅ Error message: "Admin Access Required"
- ✅ Shows current role: DINER
- ✅ "Go to Dashboard" button works
- ✅ "Back to Home" link works

**Status:** [ ] Pass [ ] Fail

---

### Test 5: PLATFORM_ADMIN Access to All Routes

**Objective:** Verify PLATFORM_ADMIN can access all routes

**Steps:**
1. Sign in as PLATFORM_ADMIN user (lu.petros@outlook.com)
2. Visit `http://localhost:3001/dashboard`
3. Click "Go to App" button
4. Verify you're at `/app` page
5. Click "Admin Portal →" button
6. Verify you're at `/admin` page

**Expected Result:**
- ✅ Dashboard loads successfully
- ✅ `/app` page loads successfully
- ✅ User role shows "PLATFORM_ADMIN"
- ✅ "Admin Portal →" button visible on `/app` page
- ✅ `/admin` page loads successfully
- ✅ Admin portal shows role: PLATFORM_ADMIN
- ✅ No unauthorized redirects

**Status:** [ ] Pass [ ] Fail

---

### Test 6: PLATFORM_ADMIN Direct Admin URL Access

**Objective:** Verify PLATFORM_ADMIN can access admin directly

**Steps:**
1. Sign in as PLATFORM_ADMIN user
2. Type `http://localhost:3001/admin` directly in address bar
3. Press Enter

**Expected Result:**
- ✅ Admin portal loads immediately
- ✅ No redirects
- ✅ Shows admin dashboard with role: PLATFORM_ADMIN

**Status:** [ ] Pass [ ] Fail

---

### Test 7: Role Change Takes Effect Immediately

**Objective:** Verify role changes are reflected without re-login

**Steps:**
1. Sign in as DINER user
2. Try to access `/admin` → should be blocked
3. In another terminal, promote user to PLATFORM_ADMIN:
   ```powershell
   # Update in database
   $env:PGPASSWORD='postgres'
   psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'diner@test.com';"
   ```
4. Refresh browser (don't sign out)
5. Try to access `/admin` again

**Expected Result:**
- ✅ Before promotion: blocked from `/admin`
- ✅ After promotion: can access `/admin`
- ✅ No sign-out/sign-in required
- ✅ Role change takes effect immediately

**Status:** [ ] Pass [ ] Fail

---

### Test 8: User Not in Database

**Objective:** Verify handling of Clerk user not in database

**Steps:**
1. Sign up with a new email (don't visit dashboard)
2. Immediately try to access `/admin`

**Expected Result:**
- ✅ Redirected to `/dashboard` (to trigger sync)
- ✅ After dashboard loads, user is synced
- ✅ Can then access `/app` routes
- ✅ Cannot access `/admin` (default role is DINER)

**Status:** [ ] Pass [ ] Fail

---

### Test 9: Unauthorized Page UI

**Objective:** Verify unauthorized page displays correctly

**Steps:**
1. Sign in as DINER user
2. Try to access `/admin`
3. Verify unauthorized page

**Expected Result:**
- ✅ Shows lock emoji 🔒
- ✅ Title: "Admin Access Required"
- ✅ Description: "You need to be a Restaurant Admin or Platform Admin..."
- ✅ Shows current role: DINER
- ✅ "Go to Dashboard" button works
- ✅ "Back to Home" link works
- ✅ "Contact support" link present
- ✅ Apple-native styling (slate colors, rounded corners)

**Status:** [ ] Pass [ ] Fail

---

### Test 10: Navigation Flow

**Objective:** Verify complete navigation flow works correctly

**Steps:**
1. Sign in as PLATFORM_ADMIN
2. Start at `/` (home)
3. Navigate to `/dashboard`
4. Click "Go to App"
5. Click "Admin Portal →"
6. Click "← Back to Dashboard"
7. Sign out
8. Sign in as DINER
9. Navigate to `/dashboard`
10. Click "Try Admin Portal"
11. Click "Go to Dashboard"

**Expected Result:**
- ✅ All navigation works smoothly
- ✅ No broken links
- ✅ Appropriate access based on role
- ✅ Redirects work correctly

**Status:** [ ] Pass [ ] Fail

---

## Edge Case Tests

### Test 11: Concurrent Sessions

**Objective:** Verify role changes work across multiple browser tabs

**Steps:**
1. Sign in as DINER in two different browser tabs
2. In Tab 1, try to access `/admin` → blocked
3. Promote user to PLATFORM_ADMIN in database
4. In Tab 2, try to access `/admin`
5. In Tab 1, refresh and try to access `/admin`

**Expected Result:**
- ✅ Both tabs reflect role change
- ✅ No need to sign out/in
- ✅ Middleware checks database on each request

**Status:** [ ] Pass [ ] Fail

---

### Test 12: API Route Protection (Future)

**Objective:** Verify API routes respect authentication

**Steps:**
1. Sign out
2. Try to call `/api/users` directly (e.g., via Postman or curl)

**Expected Result:**
- ✅ Returns 401 Unauthorized
- ✅ No data leaked

**Status:** [ ] Pass [ ] Fail

---

## Performance Tests

### Test 13: Middleware Performance

**Objective:** Verify middleware doesn't significantly slow down requests

**Steps:**
1. Sign in as PLATFORM_ADMIN
2. Open browser DevTools → Network tab
3. Navigate to `/admin`
4. Check response time

**Expected Result:**
- ✅ Page loads in < 500ms (excluding database query time)
- ✅ No noticeable delay
- ✅ Middleware adds minimal overhead

**Status:** [ ] Pass [ ] Fail

---

## Quick Test Script

Run all tests quickly:

```powershell
# Test 1: Public routes (no auth)
Start-Process "http://localhost:3001/"
Start-Process "http://localhost:3001/sign-in"

# Test 2: Protected routes (should redirect)
# Open in incognito:
Start-Process "http://localhost:3001/dashboard"
Start-Process "http://localhost:3001/admin"

# Test 3-6: Sign in and test access
# Manual testing required

# Test 7: Check database
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT email, role FROM users;"
```

---

## Troubleshooting

### Issue: Middleware not running
**Solution:** Check `middleware.ts` config matcher includes your route

### Issue: User not found in database
**Solution:** Visit `/dashboard` to trigger user sync

### Issue: Role change not taking effect
**Solution:** 
1. Verify database update: `SELECT role FROM users WHERE email = 'your-email';`
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)

### Issue: Infinite redirect loop
**Solution:** 
1. Check middleware logic
2. Ensure `/app/unauthorized` is not in protected routes
3. Check Clerk configuration

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Public Routes | [ ] | |
| 2. Protected Routes Redirect | [ ] | |
| 3. DINER App Access | [ ] | |
| 4. DINER Admin Block | [ ] | |
| 5. PLATFORM_ADMIN All Access | [ ] | |
| 6. PLATFORM_ADMIN Direct Admin | [ ] | |
| 7. Role Change Immediate | [ ] | |
| 8. User Not in DB | [ ] | |
| 9. Unauthorized Page UI | [ ] | |
| 10. Navigation Flow | [ ] | |
| 11. Concurrent Sessions | [ ] | |
| 12. API Route Protection | [ ] | |
| 13. Middleware Performance | [ ] | |

---

## Sign-Off

- [ ] All tests passed
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] Documentation reviewed
- [ ] Ready for production

**Tested by:** _______________  
**Date:** _______________  
**Notes:** _______________
