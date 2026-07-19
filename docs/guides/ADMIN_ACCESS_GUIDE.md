# Admin Access Guide

## Overview

There are two admin interfaces in DineWithMe:

1. **Restaurant Admin** (`/admin`) - For restaurant owners to manage their restaurant and dinners
2. **Platform Ops** (`/admin/ops`) - For platform administrators to approve restaurants and manage the platform

## User Roles

The system has three roles:

- `DINER` - Default role for all users (can book dinners)
- `RESTAURANT_ADMIN` - Can manage their own restaurant and create dinners
- `PLATFORM_ADMIN` - Can access platform operations and approve restaurants

## How to Access Restaurant Admin

### Prerequisites
1. Your user must be synced to the database
2. Your role must be `RESTAURANT_ADMIN` or `PLATFORM_ADMIN`

### Step 1: Sync Your User

1. Sign in to the application
2. Visit `http://localhost:3001/discover` (or any authenticated page)
3. This automatically syncs your Clerk user to the database

### Step 2: Update Your Role to RESTAURANT_ADMIN

Run the PowerShell script:

```powershell
.\setup-admin-user.ps1
```

Or manually update via SQL:

```powershell
# Set password
$env:PGPASSWORD='postgres'

# Check current users
psql -U postgres -d dinewithme -c "SELECT email, role FROM users;"

# Update your user's role
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'your-email@example.com';"

# Verify the change
psql -U postgres -d dinewithme -c "SELECT email, role FROM users WHERE email = 'your-email@example.com';"
```

### Step 3: Access Restaurant Admin

1. Refresh your browser (or sign out and back in)
2. Navigate to `http://localhost:3001/admin`
3. You should see the admin dashboard with sidebar navigation

### What You Can Access as RESTAURANT_ADMIN

- `/admin` - Dashboard
- `/admin/restaurant` - Manage your restaurant profile, themes, and media
- `/admin/dinners` - Create and manage dinner events

## How to Access Platform Ops

### Prerequisites
1. Your user must be synced to the database
2. Your role must be `PLATFORM_ADMIN`

### Step 1: Update Your Role to PLATFORM_ADMIN

```powershell
# Set password
$env:PGPASSWORD='postgres'

# Update to platform admin
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'your-email@example.com';"

# Verify the change
psql -U postgres -d dinewithme -c "SELECT email, role FROM users WHERE email = 'your-email@example.com';"
```

### Step 2: Access Platform Ops

1. Refresh your browser (or sign out and back in)
2. Navigate to `http://localhost:3001/admin`
3. You should see "Platform Ops" in the sidebar navigation
4. Click "Platform Ops" or navigate to `http://localhost:3001/admin/ops`

### What You Can Access as PLATFORM_ADMIN

- `/admin` - Dashboard
- `/admin/restaurant` - Manage your restaurant profile
- `/admin/dinners` - Create and manage dinners
- `/admin/ops` - Platform operations (redirects to `/admin/ops/restaurants`)
- `/admin/ops/restaurants` - Approve/reject restaurant applications

## Quick Setup Scripts

### Make User a Restaurant Admin

```powershell
$env:PGPASSWORD='postgres'
$email = Read-Host "Enter email address"
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = '$email';"
Write-Host "✅ User is now a RESTAURANT_ADMIN"
Write-Host "Visit: http://localhost:3001/admin"
```

### Make User a Platform Admin

```powershell
$env:PGPASSWORD='postgres'
$email = Read-Host "Enter email address"
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = '$email';"
Write-Host "✅ User is now a PLATFORM_ADMIN"
Write-Host "Visit: http://localhost:3001/admin/ops"
```

### Check Current Role

```powershell
$env:PGPASSWORD='postgres'
$email = Read-Host "Enter email address"
psql -U postgres -d dinewithme -c "SELECT email, role, status FROM users WHERE email = '$email';"
```

## Troubleshooting

### "Page Not Found" when accessing /admin

**Cause:** Your user doesn't have the required role or isn't synced to the database.

**Solution:**
1. Check if user exists in database
2. Verify role is `RESTAURANT_ADMIN` or `PLATFORM_ADMIN`
3. Clear browser cache and refresh

### "Page Not Found" when accessing /admin/ops

**Cause:** Your role is `RESTAURANT_ADMIN` but you need `PLATFORM_ADMIN`.

**Solution:**
```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'your-email@example.com';"
```

### User Not Synced to Database

**Symptoms:** No users found when running SQL queries

**Solution:**
1. Visit `http://localhost:3001/discover` while signed in
2. Check browser DevTools Network tab for `/api/auth/sync` request
3. Check server logs for sync errors
4. Verify database connection and Clerk configuration

### Can't See "Platform Ops" in Sidebar

**Cause:** The sidebar filters navigation based on your role in Clerk's public metadata.

**Solution:**
1. Update your role in the database (see above)
2. Sign out completely from Clerk
3. Sign back in (this refreshes the session)
4. The sidebar should now show "Platform Ops"

### Redirected to /discover when accessing /admin

**Cause:** This was a middleware bug that has been fixed.

**Solution:**
1. Make sure you've pulled the latest code
2. Restart your dev server
3. Clear browser cache

## Navigation Structure

```
/admin (RESTAURANT_ADMIN or PLATFORM_ADMIN)
├── Dashboard
├── Restaurant Profile
├── Dinners
└── Platform Ops (PLATFORM_ADMIN only)
    └── Restaurants (Approval queue)
```

## Role Hierarchy

```
PLATFORM_ADMIN (Level 3)
  ↓ Can access everything
RESTAURANT_ADMIN (Level 2)
  ↓ Can manage restaurants and dinners
DINER (Level 1)
  ↓ Can book and attend dinners
```

## Next Steps

### As RESTAURANT_ADMIN
1. Visit `/admin/restaurant` to set up your restaurant profile
2. Upload hero image and gallery photos
3. Enable table themes
4. Create your first dinner at `/admin/dinners`

### As PLATFORM_ADMIN
1. Visit `/admin/ops/restaurants` to see pending restaurant applications
2. Review and approve/reject restaurants
3. Monitor platform activity
4. Manage system-wide settings (coming soon)

## Security Notes

- Role checks are enforced at both the middleware and layout levels
- Server-side protection prevents unauthorized access
- Client-side navigation filters based on user role
- Always verify role changes by signing out and back in
