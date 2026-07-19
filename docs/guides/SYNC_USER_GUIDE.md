# User Sync Guide

## Problem
You're trying to set up admin access, but no users are found in the database because your Clerk user hasn't been synced yet.

## Solution

### Step 1: Sync Your User to Database

Visit the sync page while signed in:

```
http://localhost:3001/sync
```

This page will:
1. Automatically call the `/api/auth/sync` endpoint
2. Create your user in the database with default role `DINER`
3. Show a green checkmark when sync is complete

### Step 2: Verify User Was Created

Run this command to check:

```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT email, role, status FROM users;"
```

You should see your user with role `DINER`.

### Step 3: Update Your Role

Now run the setup script:

```powershell
.\setup-admin-user.ps1
```

Or manually:

```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'your-email@example.com';"
```

For platform admin:

```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'your-email@example.com';"
```

### Step 4: Access Admin Portal

1. Sign out and sign back in (to refresh your session)
2. Visit `http://localhost:3001/admin`
3. You should now have access!

## Quick Commands

### Check if user exists:
```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT COUNT(*) FROM users;"
```

### View all users:
```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT email, role, status, \"createdAt\" FROM users;"
```

### Make user a restaurant admin:
```powershell
$env:PGPASSWORD='postgres'
$email = Read-Host "Enter email"
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = '$email';"
```

### Make user a platform admin:
```powershell
$env:PGPASSWORD='postgres'
$email = Read-Host "Enter email"
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = '$email';"
```

## Troubleshooting

### Sync page shows error

Check:
1. Is PostgreSQL running?
2. Are your environment variables correct?
3. Check server logs for errors

### User still not in database after visiting /sync

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the `/sync` page
4. Look for the `/api/auth/sync` request
5. Check if it returns 200 OK or an error
6. Look at the response body for error details

### Can't access /admin after updating role

1. Sign out completely from Clerk
2. Sign back in
3. Try accessing `/admin` again
4. Check browser console for errors

### Database connection error

Verify PostgreSQL is running:
```powershell
Get-Service postgresql*
```

If not running:
```powershell
Start-Service postgresql-x64-14  # Adjust version number
```

## Alternative: Use /dashboard

The `/dashboard` route also syncs users, but the middleware redirects it to `/discover`. You can:

1. Visit `http://localhost:3001/dashboard`
2. It will sync your user and redirect to `/discover`
3. Then run the setup script

But `/sync` is cleaner and shows you the sync status.

## What Happens During Sync

1. The page calls `POST /api/auth/sync`
2. The endpoint:
   - Verifies you're authenticated with Clerk
   - Gets your Clerk user profile
   - Creates or updates your user in the database
   - Sets default role to `DINER`
   - Sets status to `active`
   - Emits analytics events
3. Returns success with your user data

## Next Steps After Sync

1. Update your role using the setup script
2. Visit `/admin` to access the admin portal
3. Set up your restaurant profile at `/admin/restaurant`
4. Create your first dinner at `/admin/dinners`
5. For platform admins, access `/admin/ops` to approve restaurants
