# EPIC 1.3: Roles and Permissions Foundation

## Overview

Implements role-based access control (RBAC) system with three roles: DINER, RESTAURANT_ADMIN, and PLATFORM_ADMIN.

## Schema Changes

### Prisma Schema (`prisma/schema.prisma`)

**Added:**
```prisma
enum Role {
  DINER
  RESTAURANT_ADMIN
  PLATFORM_ADMIN
}

model User {
  // ... existing fields
  role Role @default(DINER)
}
```

**Migration:**
```bash
cd apps/web
npx prisma db push --schema=../../prisma/schema.prisma
```

## RBAC Helpers (`packages/shared/src/rbac/`)

### Core Functions

#### `canPerform(action: Action, user: UserWithRole): boolean`
Check if user can perform a specific action.

```typescript
import { canPerform, Action } from "@dinewithme/shared";

if (canPerform(Action.CREATE_RESTAURANT, user)) {
  // User can create restaurants
}
```

#### `canAccessAdmin(user: UserWithRole): boolean`
Check if user can access admin panel (PLATFORM_ADMIN only).

```typescript
import { canAccessAdmin } from "@dinewithme/shared";

if (canAccessAdmin(user)) {
  // Show admin panel
}
```

#### `canAccessRestaurantPortal(user: UserWithRole): boolean`
Check if user can access restaurant portal (RESTAURANT_ADMIN or PLATFORM_ADMIN).

```typescript
import { canAccessRestaurantPortal } from "@dinewithme/shared";

if (canAccessRestaurantPortal(user)) {
  // Show restaurant management
}
```

### Additional Helpers

- `isDiner(user)` - Check if user is a diner
- `isRestaurantAdmin(user)` - Check if user is restaurant admin
- `isPlatformAdmin(user)` - Check if user is platform admin
- `getUserPermissions(user)` - Get all actions user can perform
- `hasRoleLevel(userRole, requiredRole)` - Check role hierarchy

## Roles

### DINER (Default)
**Permissions:**
- View/edit own profile
- Create/join/leave dinners
- View restaurants
- Leave reviews

**Assigned:** Automatically on user creation

### RESTAURANT_ADMIN
**Permissions:**
- All DINER permissions
- Create/edit/delete restaurants
- View restaurant analytics
- Manage restaurant dinners

**Assigned:** Manually by PLATFORM_ADMIN

### PLATFORM_ADMIN
**Permissions:**
- All permissions
- Access admin panel
- Manage all users
- Manage all restaurants
- Assign roles
- View platform analytics

**Assigned:** Via seed script or by another PLATFORM_ADMIN

## Seed Script

### Location
`scripts/seed.ts`

### Purpose
Creates or promotes a user to PLATFORM_ADMIN role.

### Usage

1. **Set admin email in `.env`:**
```env
PLATFORM_ADMIN_EMAIL=your-email@example.com
```

2. **Sign in to app first** (user must exist in database)

3. **Run seed script:**
```bash
npm run seed
```

### Output

**If user exists:**
```
🌱 Starting database seed...
📧 Platform admin email: admin@example.com
✅ Platform admin already exists:
   ID: clxxx
   Email: admin@example.com
   Role: PLATFORM_ADMIN
✨ Seed completed!
```

**If user needs promotion:**
```
🌱 Starting database seed...
📧 Platform admin email: admin@example.com
✅ Platform admin already exists:
   ID: clxxx
   Email: admin@example.com
   Role: DINER
🔄 Updating role to PLATFORM_ADMIN...
✅ Role updated successfully!
   New role: PLATFORM_ADMIN
✨ Seed completed!
```

**If user doesn't exist:**
```
🌱 Starting database seed...
📧 Platform admin email: admin@example.com
⚠️  User not found in database.
   The user must sign in at least once before being promoted to admin.
   Steps:
   1. Sign in to the app with this email
   2. Run this seed script again
✨ Seed completed!
```

## Analytics Events

### Event: `user_role_assigned`

**Emitted when:** User role is changed

**Properties:**
```typescript
{
  userId: string;
  email: string;
  oldRole: Role;
  newRole: Role;
  assignedBy: string; // User ID who assigned the role
  timestamp: string;
}
```

**Implementation:** To be added in role assignment API route (future epic)

## Testing

### Test 1: Default Role Assignment

1. Sign up new user
2. Check database:
```sql
SELECT email, role FROM users WHERE email = 'newuser@example.com';
```
3. Expected: `role = 'DINER'`

### Test 2: Seed Script

1. Sign in with your email
2. Add to `.env`:
```env
PLATFORM_ADMIN_EMAIL=your-email@example.com
```
3. Run: `npm run seed`
4. Check database:
```sql
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```
5. Expected: `role = 'PLATFORM_ADMIN'`

### Test 3: Permission Checks

```typescript
import { canAccessAdmin, canAccessRestaurantPortal, Role } from "@dinewithme/shared";

// Test DINER
const diner = { id: "1", role: Role.DINER };
console.log(canAccessAdmin(diner)); // false
console.log(canAccessRestaurantPortal(diner)); // false

// Test RESTAURANT_ADMIN
const restaurantAdmin = { id: "2", role: Role.RESTAURANT_ADMIN };
console.log(canAccessAdmin(restaurantAdmin)); // false
console.log(canAccessRestaurantPortal(restaurantAdmin)); // true

// Test PLATFORM_ADMIN
const platformAdmin = { id: "3", role: Role.PLATFORM_ADMIN };
console.log(canAccessAdmin(platformAdmin)); // true
console.log(canAccessRestaurantPortal(platformAdmin)); // true
```

### Test 4: Action Permissions

```typescript
import { canPerform, Action, Role } from "@dinewithme/shared";

const diner = { id: "1", role: Role.DINER };
const admin = { id: "2", role: Role.PLATFORM_ADMIN };

console.log(canPerform(Action.CREATE_DINNER, diner)); // true
console.log(canPerform(Action.CREATE_RESTAURANT, diner)); // false
console.log(canPerform(Action.CREATE_RESTAURANT, admin)); // true
console.log(canPerform(Action.MANAGE_USERS, admin)); // true
```

## Files Created/Modified

### Created (8 files)
1. `packages/shared/src/rbac/index.ts` - RBAC exports
2. `packages/shared/src/rbac/roles.ts` - Role definitions
3. `packages/shared/src/rbac/actions.ts` - Action definitions
4. `packages/shared/src/rbac/permissions.ts` - Permission checks
5. `packages/shared/src/rbac/README.md` - RBAC documentation
6. `scripts/seed.ts` - Seed script
7. `scripts/package.json` - Scripts package config
8. `EPIC_1.3_DOCUMENTATION.md` - This file

### Modified (4 files)
1. `prisma/schema.prisma` - Added Role enum and role field
2. `packages/shared/src/index.ts` - Export RBAC
3. `package.json` - Added seed script
4. `.env.example` - Added PLATFORM_ADMIN_EMAIL

## Migration Steps

1. **Update schema:**
```bash
cd apps/web
npx prisma db push --schema=../../prisma/schema.prisma
```

2. **Install scripts dependencies:**
```bash
cd scripts
npm install
```

3. **Set admin email:**
```bash
# In apps/web/.env
PLATFORM_ADMIN_EMAIL=your-email@example.com
```

4. **Sign in to app** (creates user in database)

5. **Run seed:**
```bash
npm run seed
```

6. **Verify:**
```sql
SELECT email, role FROM users;
```

## Non-Goals (Not Implemented)

- ❌ Admin UI - Future epic
- ❌ Restaurant creation - Future epic
- ❌ Role assignment API - Future epic
- ❌ Permission middleware - Future epic

## Next Steps

1. Create admin panel UI
2. Add role assignment API endpoint
3. Implement permission middleware for routes
4. Add restaurant creation flow
5. Build restaurant admin portal

## ✅ EPIC 1.3 Complete

All requirements met:
- ✅ Role enum with DINER, RESTAURANT_ADMIN, PLATFORM_ADMIN
- ✅ User has role field (default DINER)
- ✅ RBAC helpers: `canAccessAdmin`, `canAccessRestaurantPortal`, `canPerform`
- ✅ Seed script to create PLATFORM_ADMIN
- ✅ Analytics event defined (implementation in future epic)
- ✅ Documentation provided
