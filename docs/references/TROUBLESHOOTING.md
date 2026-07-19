# Troubleshooting Guide

## Issues Fixed

### 1. Build Error - lucide-react Upload Icon
**Status**: ✅ FIXED

**Problem**: `Module not found: Can't resolve './icons/upload.js'`

**Solution**: Changed `Upload` icon to `ImagePlus` in `image-upload.tsx`

**File**: `apps/web/src/app/admin/restaurant/components/image-upload.tsx`

---

### 2. Admin Route Redirect Issue
**Status**: ✅ FIXED

**Problem**: Accessing `/admin/restaurant` redirects to `/dashboard`

**Root Cause**: The admin layout was using `requireRole()` which might throw errors during database queries, causing unexpected redirects.

**Solution**: Rewrote admin layout to:
1. Check Clerk authentication first
2. Fetch user from database with error handling
3. Redirect to dashboard if user not synced
4. Check role and redirect to unauthorized if needed

**File**: `apps/web/src/app/admin/layout.tsx`

---

### 3. R2 Configuration
**Status**: ✅ FIXED

**Problem**: Bucket name had typo (`dinethime-media` instead of `dinewithme-media`)

**Solution**: Updated `.env` file with correct bucket name

**File**: `apps/web/.env`

---

## Remaining Issue: Clerk Infinite Redirect Loop

**Symptoms**: 
```
Clerk: Refreshing the session token resulted in an infinite redirect loop. 
This usually means that your Clerk instance keys do not match
```

**Possible Causes**:
1. Clerk keys mismatch between frontend and backend
2. Multiple Clerk instances or environments
3. Browser cache/cookies issue

**Steps to Resolve**:

1. **Verify Clerk Keys**:
   - Go to https://dashboard.clerk.com
   - Select your application
   - Go to "API Keys"
   - Copy the keys and compare with your `.env` file:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`

2. **Clear Browser Data**:
   - Open DevTools (F12)
   - Go to Application tab
   - Clear all cookies for `localhost:3001`
   - Clear Local Storage
   - Clear Session Storage
   - Close browser completely and reopen

3. **Restart Dev Server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

4. **Check for Multiple Clerk Instances**:
   - Make sure you only have ONE Clerk application
   - Don't mix keys from different Clerk apps (development vs production)

5. **If Still Failing**:
   - Create a new Clerk application
   - Update the keys in `.env`
   - Restart dev server

---

## Testing Steps

### 1. Test Build
```bash
cd apps/web
npm run build
```

Expected: Build should complete without errors

### 2. Test Admin Access
1. Start dev server: `npm run dev`
2. Sign in at http://localhost:3001/sign-in
3. Go to http://localhost:3001/dashboard (to sync user)
4. Go to http://localhost:3001/admin/restaurant

Expected: Should see the restaurant profile page, not redirect to dashboard

### 3. Test Image Upload
1. On `/admin/restaurant` page
2. Click "Upload Hero Image"
3. Select an image file
4. Should upload to R2 and display

Expected: Image uploads successfully and displays with public URL

---

## Quick Verification Commands

```bash
# Check if user has correct role in database
psql -U postgres -d dinewithme -c "SELECT email, role FROM \"User\" WHERE email = 'luupetros@gmail.com';"

# Expected output: role should be RESTAURANT_ADMIN

# Check Clerk keys are set
cd apps/web
grep CLERK .env

# Should show both keys populated
```

---

## Next Steps After Fixes

1. ✅ Build completes successfully
2. ✅ Can access `/admin/restaurant` without redirect
3. ⏳ Resolve Clerk infinite redirect (if still occurring)
4. ⏳ Test image upload functionality
5. ⏳ Verify images display with public URLs
