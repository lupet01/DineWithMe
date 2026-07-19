# Admin Setup Guide

## Issue: User Not Synced to Database

You're seeing the dashboard but can't access the admin portal because:
1. Your user hasn't been synced to the database yet
2. Your role is DINER (default) instead of RESTAURANT_ADMIN

## Solution: Sync and Update User Role

### Step 1: Verify User Sync

The dashboard page should automatically sync your user, but let's verify:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the dashboard page
4. Look for a request to `/api/auth/sync`
5. Check if it returns success

### Step 2: Check Database

Run this command to see if your user exists:

```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT email, role FROM users;"
```

### Step 3: Update Role to RESTAURANT_ADMIN

If your user exists in the database, run:

```powershell
.\setup-admin-user.ps1
```

Or manually:

```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'luupetros@gmail.com';"
```

### Step 4: Verify and Access

1. Check the update worked:
   ```powershell
   $env:PGPASSWORD='postgres'
   psql -U postgres -d dinewithme -c "SELECT email, role FROM users WHERE email = 'luupetros@gmail.com';"
   ```

2. Refresh your browser

3. Visit: http://localhost:3001/admin

## Troubleshooting

### If User Doesn't Exist in Database

The sync might have failed. Check:

1. **Server logs**: Look for errors in the terminal running `npm run dev`
2. **Network errors**: Check browser DevTools Network tab
3. **Database connection**: Verify PostgreSQL is running

### Manual User Creation

If automatic sync fails, you can manually insert the user:

1. Get your Clerk User ID:
   - Open browser DevTools
   - Go to Application > Cookies
   - Look for `__session` cookie
   - Or check Clerk Dashboard

2. Run SQL:
   ```sql
   INSERT INTO users (
     id,
     "authProviderId",
     email,
     "firstName",
     "lastName",
     role,
     status,
     "createdAt",
     "updatedAt"
   ) VALUES (
     'clxyz123456789',  -- Generate a CUID
     'user_YOUR_CLERK_ID',  -- Your Clerk user ID
     'luupetros@gmail.com',
     'Luthando',
     'Petros',
     'RESTAURANT_ADMIN',
     'active',
     NOW(),
     NOW()
   );
   ```

### If Sync Endpoint Returns Error

Check the server logs for:
- Database connection errors
- Clerk authentication errors
- Missing environment variables

## Quick Fix Script

Run this PowerShell script:

```powershell
# Check if user exists
$env:PGPASSWORD='postgres'
$userExists = psql -U postgres -d dinewithme -t -c "SELECT COUNT(*) FROM users WHERE email = 'luupetros@gmail.com';" 2>&1

if ($userExists.Trim() -eq "0") {
    Write-Host "User not synced yet. Please:"
    Write-Host "1. Visit http://localhost:3001/dashboard"
    Write-Host "2. Wait 5 seconds"
    Write-Host "3. Check browser DevTools Network tab for /api/auth/sync"
    Write-Host "4. Run this script again"
} else {
    # Update role
    psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'luupetros@gmail.com';"
    Write-Host "✅ Role updated! Refresh your browser and visit /admin"
}
```

## Expected Result

After successful setup:
- Database has your user with RESTAURANT_ADMIN role
- You can access http://localhost:3001/admin
- You see the admin dashboard with sidebar navigation
- You can access /admin/restaurant to create your restaurant

## Next Steps

Once you have admin access:
1. Visit `/admin/restaurant`
2. Fill in the onboarding form
3. Create your first restaurant
4. Start managing dinners!
