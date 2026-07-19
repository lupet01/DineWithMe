# EPIC 1.3 Test Guide

## Prerequisites
- ✅ Database migrated with role column
- ✅ Scripts dependencies installed
- ✅ User signed in at least once

## Test 1: Verify Default Role

### Steps
1. Sign up a new user or check existing user
2. Run query:
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -d dinewithme -c "SELECT email, role FROM users;"
```

### Expected Result
```
         email          |  role
------------------------+--------
 user@example.com       | DINER
```

✅ **Pass:** All users have `DINER` role by default

## Test 2: Seed Script - Create Platform Admin

### Steps

1. **Set your email in `.env`:**
```bash
# In apps/web/.env
PLATFORM_ADMIN_EMAIL=your-actual-email@example.com
```

2. **Make sure you're signed in** (user must exist in database)

3. **Run seed script:**
```powershell
npm run seed
```

### Expected Output

**Success:**
```
🌱 Starting database seed...
📧 Platform admin email: your-email@example.com
✅ Platform admin already exists:
   ID: clxxx
   Email: your-email@example.com
   Role: DINER
🔄 Updating role to PLATFORM_ADMIN...
✅ Role updated successfully!
   New role: PLATFORM_ADMIN
✨ Seed completed!
```

4. **Verify in database:**
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -d dinewithme -c "SELECT email, role FROM users WHERE email = 'your-email@example.com';"
```

### Expected Result
```
         email              |      role
----------------------------+----------------
 your-email@example.com     | PLATFORM_ADMIN
```

✅ **Pass:** User role updated to PLATFORM_ADMIN

## Test 3: RBAC Helper Functions

### Create Test File

Create `test-rbac.ts` in project root:

```typescript
import { 
  canAccessAdmin, 
  canAccessRestaurantPortal, 
  canPerform,
  Action,
  Role,
  isDiner,
  isRestaurantAdmin,
  isPlatformAdmin,
  getUserPermissions
} from "@dinewithme/shared";

// Test users
const diner = { id: "1", role: Role.DINER };
const restaurantAdmin = { id: "2", role: Role.RESTAURANT_ADMIN };
const platformAdmin = { id: "3", role: Role.PLATFORM_ADMIN };

console.log("=== Testing RBAC Helpers ===\n");

// Test canAccessAdmin
console.log("canAccessAdmin:");
console.log("  DINER:", canAccessAdmin(diner)); // false
console.log("  RESTAURANT_ADMIN:", canAccessAdmin(restaurantAdmin)); // false
console.log("  PLATFORM_ADMIN:", canAccessAdmin(platformAdmin)); // true

// Test canAccessRestaurantPortal
console.log("\ncanAccessRestaurantPortal:");
console.log("  DINER:", canAccessRestaurantPortal(diner)); // false
console.log("  RESTAURANT_ADMIN:", canAccessRestaurantPortal(restaurantAdmin)); // true
console.log("  PLATFORM_ADMIN:", canAccessRestaurantPortal(platformAdmin)); // true

// Test canPerform
console.log("\ncanPerform:");
console.log("  DINER can CREATE_DINNER:", canPerform(Action.CREATE_DINNER, diner)); // true
console.log("  DINER can CREATE_RESTAURANT:", canPerform(Action.CREATE_RESTAURANT, diner)); // false
console.log("  RESTAURANT_ADMIN can CREATE_RESTAURANT:", canPerform(Action.CREATE_RESTAURANT, restaurantAdmin)); // true
console.log("  PLATFORM_ADMIN can MANAGE_USERS:", canPerform(Action.MANAGE_USERS, platformAdmin)); // true

// Test role checks
console.log("\nRole Checks:");
console.log("  isDiner(diner):", isDiner(diner)); // true
console.log("  isRestaurantAdmin(restaurantAdmin):", isRestaurantAdmin(restaurantAdmin)); // true
console.log("  isPlatformAdmin(platformAdmin):", isPlatformAdmin(platformAdmin)); // true

// Test getUserPermissions
console.log("\nDINER Permissions:");
const dinerPerms = getUserPermissions(diner);
console.log("  Total:", dinerPerms.length);
console.log("  Sample:", dinerPerms.slice(0, 5));

console.log("\nPLATFORM_ADMIN Permissions:");
const adminPerms = getUserPermissions(platformAdmin);
console.log("  Total:", adminPerms.length);
console.log("  All actions available");

console.log("\n✅ All tests completed!");
```

### Run Test

```powershell
npx tsx test-rbac.ts
```

### Expected Output

```
=== Testing RBAC Helpers ===

canAccessAdmin:
  DINER: false
  RESTAURANT_ADMIN: false
  PLATFORM_ADMIN: true

canAccessRestaurantPortal:
  DINER: false
  RESTAURANT_ADMIN: true
  PLATFORM_ADMIN: true

canPerform:
  DINER can CREATE_DINNER: true
  DINER can CREATE_RESTAURANT: false
  RESTAURANT_ADMIN can CREATE_RESTAURANT: true
  PLATFORM_ADMIN can MANAGE_USERS: true

Role Checks:
  isDiner(diner): true
  isRestaurantAdmin(restaurantAdmin): true
  isPlatformAdmin(platformAdmin): true

DINER Permissions:
  Total: 8
  Sample: [ 'VIEW_PROFILE', 'EDIT_PROFILE', 'DELETE_ACCOUNT', 'CREATE_DINNER', 'EDIT_DINNER' ]

PLATFORM_ADMIN Permissions:
  Total: 18
  All actions available

✅ All tests completed!
```

✅ **Pass:** All RBAC functions work correctly

## Test 4: Seed Script Edge Cases

### Test 4a: User Doesn't Exist

1. **Set email for non-existent user:**
```env
PLATFORM_ADMIN_EMAIL=nonexistent@example.com
```

2. **Run seed:**
```powershell
npm run seed
```

3. **Expected Output:**
```
🌱 Starting database seed...
📧 Platform admin email: nonexistent@example.com
⚠️  User not found in database.
   The user must sign in at least once before being promoted to admin.
   Steps:
   1. Sign in to the app with this email
   2. Run this seed script again
✨ Seed completed!
```

✅ **Pass:** Graceful handling of non-existent user

### Test 4b: No Email Set

1. **Remove PLATFORM_ADMIN_EMAIL from `.env`**

2. **Run seed:**
```powershell
npm run seed
```

3. **Expected Output:**
```
🌱 Starting database seed...
⚠️  PLATFORM_ADMIN_EMAIL not set. Skipping admin creation.
   Set PLATFORM_ADMIN_EMAIL in .env to create a platform admin.
✨ Seed completed!
```

✅ **Pass:** Graceful handling of missing email

### Test 4c: Already Platform Admin

1. **Run seed again** (after successful promotion)

2. **Expected Output:**
```
🌱 Starting database seed...
📧 Platform admin email: your-email@example.com
✅ Platform admin already exists:
   ID: clxxx
   Email: your-email@example.com
   Role: PLATFORM_ADMIN
✨ Seed completed!
```

✅ **Pass:** Idempotent - doesn't fail if already admin

## Test 5: Permission Matrix Verification

### Create Permission Matrix Test

```typescript
import { canPerform, Action, Role } from "@dinewithme/shared";

const roles = [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN];
const actions = [
  Action.VIEW_PROFILE,
  Action.CREATE_DINNER,
  Action.CREATE_RESTAURANT,
  Action.VIEW_RESTAURANT_ANALYTICS,
  Action.VIEW_ADMIN_PANEL,
  Action.MANAGE_USERS,
];

console.log("Permission Matrix:\n");
console.log("Action".padEnd(30), "DINER", "REST_ADMIN", "PLAT_ADMIN");
console.log("-".repeat(60));

actions.forEach(action => {
  const results = roles.map(role => 
    canPerform(action, { id: "test", role }) ? "✅" : "❌"
  );
  console.log(
    action.padEnd(30),
    results[0].padEnd(6),
    results[1].padEnd(11),
    results[2]
  );
});
```

### Expected Output

```
Permission Matrix:

Action                         DINER  REST_ADMIN  PLAT_ADMIN
------------------------------------------------------------
VIEW_PROFILE                   ✅     ✅          ✅
CREATE_DINNER                  ✅     ✅          ✅
CREATE_RESTAURANT              ❌     ✅          ✅
VIEW_RESTAURANT_ANALYTICS      ❌     ✅          ✅
VIEW_ADMIN_PANEL               ❌     ❌          ✅
MANAGE_USERS                   ❌     ❌          ✅
```

✅ **Pass:** Permission matrix matches specification

## Test 6: Integration Test

### Test in Dashboard

1. **Update dashboard to show role:**

```typescript
// In apps/web/src/app/dashboard/page.tsx
import { userRepository } from "@dinewithme/db";

// After syncing user
const dbUser = await userRepository.findByAuthProviderId(userId);

// Display role
<div>
  <dt className="text-sm font-medium text-slate-600">Role</dt>
  <dd className="text-slate-900">{dbUser?.role || "DINER"}</dd>
</div>
```

2. **Visit dashboard**

3. **Expected:** See your role displayed (PLATFORM_ADMIN if you ran seed)

✅ **Pass:** Role persisted and displayed correctly

## Summary Checklist

- [ ] Test 1: Default role is DINER ✅
- [ ] Test 2: Seed script creates PLATFORM_ADMIN ✅
- [ ] Test 3: RBAC helpers work correctly ✅
- [ ] Test 4a: Handles non-existent user ✅
- [ ] Test 4b: Handles missing email ✅
- [ ] Test 4c: Idempotent seed script ✅
- [ ] Test 5: Permission matrix correct ✅
- [ ] Test 6: Role displayed in dashboard ✅

## Troubleshooting

### Seed Script Fails

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```powershell
cd scripts
npm install
```

### Database Connection Error

**Error:** `P1010: User denied access`

**Solution:** Check DATABASE_URL in `apps/web/.env`

### Role Not Updating

**Solution:** 
1. Check user exists: `SELECT * FROM users WHERE email = 'your-email';`
2. Verify PLATFORM_ADMIN_EMAIL matches exactly
3. Run seed script again

## Next Steps

After all tests pass:
1. ✅ EPIC 1.3 is complete
2. Ready for admin UI implementation
3. Ready for role assignment API
4. Ready for restaurant creation flow
