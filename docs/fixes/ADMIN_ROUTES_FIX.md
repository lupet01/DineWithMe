# Admin Routes Fix

## Issues Fixed

### 1. Missing `/admin/ops` Page
The `/admin/ops` route had a layout but no `page.tsx`, causing a 404 error.

**Solution:** Created `apps/web/src/app/admin/ops/page.tsx` that redirects to `/admin/ops/restaurants`.

### 2. Platform Ops Not in Sidebar
The Platform Ops link was missing from the admin sidebar navigation.

**Solution:** Updated `apps/web/src/app/admin/components/admin-sidebar.tsx` to:
- Add "Platform Ops" navigation item with Shield icon
- Implement role-based navigation (only shows for PLATFORM_ADMIN)
- Use Clerk's `useUser()` hook to check user role from public metadata

## Testing

### For Restaurant Admin Users
1. Sign in as a restaurant admin
2. Navigate to `/admin`
3. You should see:
   - Dashboard
   - Restaurant Profile
   - Dinners
4. You should NOT see "Platform Ops"

### For Platform Admin Users
1. Sign in as a platform admin
2. Navigate to `/admin`
3. You should see all navigation items including "Platform Ops"
4. Click "Platform Ops" or navigate to `/admin/ops`
5. Should redirect to `/admin/ops/restaurants`
6. Should see the restaurant approvals page

## Routes Structure

```
/admin
├── page.tsx (Dashboard)
├── layout.tsx (Checks RESTAURANT_ADMIN or PLATFORM_ADMIN)
├── /restaurant
│   └── page.tsx (Restaurant profile management)
├── /dinners
│   └── page.tsx (Dinner management)
└── /ops
    ├── page.tsx (Redirects to /ops/restaurants)
    ├── layout.tsx (Checks PLATFORM_ADMIN only)
    └── /restaurants
        └── page.tsx (Restaurant approvals)
```

## Access Control

- `/admin/*` - Requires RESTAURANT_ADMIN or PLATFORM_ADMIN
- `/admin/ops/*` - Requires PLATFORM_ADMIN only
- Navigation items filter based on user role in Clerk metadata

## Notes

- The sidebar now uses `useUser()` from Clerk to check roles client-side
- Server-side protection is still enforced by layout files
- Active route detection improved to handle nested routes
