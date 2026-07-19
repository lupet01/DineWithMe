# Admin Access Guide

This guide explains how to get admin access for both restaurant management and platform operations.

## Quick Start

### Option 1: Seed Everything (Recommended)

This will seed themes, create a restaurant, add dinners, and give you restaurant admin access:

```bash
npx tsx scripts/seed/seed-all.ts your-email@example.com
```

This gives you:
- ✅ RESTAURANT_ADMIN role
- ✅ Access to `/admin` (restaurant dashboard)
- ✅ Access to `/admin/restaurant` (manage your restaurant)
- ✅ Access to `/admin/dinners` (manage dinners)
- ✅ Sample data to work with

### Option 2: Manual Setup

If you want more control, follow these steps:

#### 1. Seed Themes
```bash
npx tsx scripts/seed/seed-themes.ts
```

#### 2. Create Restaurant & Get Admin Access
```bash
# Update your role to RESTAURANT_ADMIN
npx tsx scripts/set-user-role.ts your-email@example.com RESTAURANT_ADMIN

# Create your restaurant
npx tsx scripts/seed/setup-restaurant-only.ts
```

#### 3. Seed Dinners (Optional)
```bash
npx tsx scripts/seed/seed-dinners.ts
```

---

## Admin Roles Explained

### 1. DINER (Default)
- Regular user role
- Can browse dinners
- Can book seats
- Can view their bookings
- **Cannot** access admin areas

### 2. RESTAURANT_ADMIN
- Can manage their own restaurant(s)
- Can create and manage dinners
- Can view bookings for their dinners
- Can manage restaurant settings
- **Access:** `/admin`, `/admin/restaurant`, `/admin/dinners`

### 3. PLATFORM_ADMIN (Ops)
- Full platform access
- Can manage all restaurants
- Can manage all dinners
- Can view all users
- Can access platform operations
- **Access:** `/admin`, `/admin/ops`, `/admin/ops/restaurants`, `/admin/ops/users`

---

## Changing User Roles

Use the `set-user-role.ts` script to change any user's role:

```bash
# Make someone a restaurant admin
npx tsx scripts/set-user-role.ts user@example.com RESTAURANT_ADMIN

# Make someone a platform admin (ops)
npx tsx scripts/set-user-role.ts user@example.com PLATFORM_ADMIN

# Demote back to regular user
npx tsx scripts/set-user-role.ts user@example.com DINER
```

---

## Access Matrix

| Feature | DINER | RESTAURANT_ADMIN | PLATFORM_ADMIN |
|---------|-------|------------------|----------------|
| Browse dinners | ✅ | ✅ | ✅ |
| Book seats | ✅ | ✅ | ✅ |
| View own bookings | ✅ | ✅ | ✅ |
| Manage own restaurant | ❌ | ✅ | ✅ |
| Create dinners | ❌ | ✅ (own restaurant) | ✅ (all) |
| View all restaurants | ❌ | ❌ | ✅ |
| Manage all users | ❌ | ❌ | ✅ |
| Platform operations | ❌ | ❌ | ✅ |

---

## Restaurant Admin Workflow

1. **Sign up** and sign in to the app
2. **Run seed script** to get admin access and create restaurant:
   ```bash
   npx tsx scripts/seed/seed-all.ts your-email@example.com
   ```
3. **Navigate to** `/admin` to see your dashboard
4. **Manage restaurant** at `/admin/restaurant`
5. **Create dinners** at `/admin/dinners`

---

## Platform Admin (Ops) Workflow

1. **Sign up** and sign in to the app
2. **Upgrade to platform admin**:
   ```bash
   npx tsx scripts/set-user-role.ts your-email@example.com PLATFORM_ADMIN
   ```
3. **Navigate to** `/admin/ops` for platform operations
4. **Manage restaurants** at `/admin/ops/restaurants`
5. **View all users** at `/admin/ops/users`

---

## Troubleshooting

### "Access Denied" when visiting /admin

**Problem:** You see "Access Denied" or get redirected to `/app/unauthorized`

**Solution:** Your user role is still DINER. Run:
```bash
npx tsx scripts/set-user-role.ts your-email@example.com RESTAURANT_ADMIN
```

### "User not found" error

**Problem:** The script can't find your user in the database

**Solution:** 
1. Make sure you've signed in to the app at least once (this syncs your Clerk account to the database)
2. Check you're using the correct email address
3. Try signing out and signing in again

### No restaurant showing in admin

**Problem:** You have admin access but no restaurant

**Solution:** Run the restaurant setup script:
```bash
npx tsx scripts/seed/setup-restaurant-only.ts
```

Or use the all-in-one seed:
```bash
npx tsx scripts/seed/seed-all.ts your-email@example.com
```

### Can't access /admin/ops

**Problem:** You can access `/admin` but not `/admin/ops`

**Solution:** You need PLATFORM_ADMIN role:
```bash
npx tsx scripts/set-user-role.ts your-email@example.com PLATFORM_ADMIN
```

---

## Quick Commands Reference

```bash
# Seed everything (recommended for first time)
npx tsx scripts/seed/seed-all.ts your-email@example.com

# Just seed themes
npx tsx scripts/seed/seed-themes.ts

# Just create restaurant
npx tsx scripts/seed/setup-restaurant-only.ts

# Just seed dinners
npx tsx scripts/seed/seed-dinners.ts

# Change user role
npx tsx scripts/set-user-role.ts <email> <DINER|RESTAURANT_ADMIN|PLATFORM_ADMIN>
```

---

## Notes

- You must sign in at least once before running any seed scripts (this syncs your Clerk account to the database)
- RESTAURANT_ADMIN can only manage restaurants they're a member of
- PLATFORM_ADMIN has full access to everything
- Role changes take effect immediately (no need to sign out/in)
- You can have multiple restaurant admins for the same restaurant
