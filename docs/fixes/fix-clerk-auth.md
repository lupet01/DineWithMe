# Fix Clerk Authentication Infinite Loop

## The Issue
You're seeing: "Clerk: Refreshing the session token resulted in an infinite redirect loop"

## Quick Fixes

### Option 1: Clear Browser Data (Fastest)

1. **Open your browser DevTools** (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Under **Storage**, click **"Clear site data"** or:
   - Delete all **Cookies** for localhost:3001
   - Delete all **Local Storage** for localhost:3001
   - Delete all **Session Storage** for localhost:3001
4. **Refresh the page**
5. **Sign in again**

### Option 2: Use Incognito/Private Window

1. Open an **Incognito/Private window**
2. Go to http://localhost:3001
3. Sign in fresh

### Option 3: Verify Clerk Keys

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **API Keys** in the left sidebar
4. Copy the keys again:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
5. Update both `.env` and `apps/web/.env.local`
6. **Restart the dev server**

### Option 4: Sign Out Completely

1. Go to http://localhost:3001
2. Click your profile/user button
3. Click **Sign Out**
4. Clear browser data (Option 1)
5. Sign in again

## If Still Not Working

The keys might be from a different Clerk application. To fix:

1. Go to https://dashboard.clerk.com
2. Make sure you're in the correct application
3. The application name should match your project
4. Copy fresh keys from **API Keys** section
5. Replace in `.env`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_NEW_KEY
CLERK_SECRET_KEY=sk_test_YOUR_NEW_SECRET
```
6. Restart server: Stop (Ctrl+C) and run `npm run dev`

## Test After Fix

1. Go to http://localhost:3001
2. You should see the home page without errors
3. Click **Sign In**
4. Sign in with your account
5. Go to http://localhost:3001/dashboard
6. You should see the dashboard without infinite redirects

## Update User Role

Once signed in successfully, update your role:

```powershell
cd C:\Users\PTRLUT005\OneDrive - University of Cape Town\Desktop\DineWithMe
.\update-user-role.ps1
```

Or manually:
```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'luupetros@gmail.com';"
```

Then refresh your browser and visit http://localhost:3001/admin
