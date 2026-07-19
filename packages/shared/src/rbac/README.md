# RBAC (Role-Based Access Control)

Role-based access control system for DineWithMe.

## Roles

### DINER (Default)
- Can create and join dinners
- Can manage their own profile
- Can leave reviews and feedback

### RESTAURANT_ADMIN
- All DINER permissions
- Can create and manage restaurants
- Can view restaurant analytics
- Can manage restaurant-specific dinners

### PLATFORM_ADMIN
- All permissions
- Can access admin panel
- Can manage all users
- Can manage all restaurants
- Can assign roles
- Can view platform analytics

## Usage

### Check Permissions

```typescript
import { canPerform, Action, Role } from "@dinewithme/shared";

const user = {
  id: "123",
  role: Role.DINER,
};

// Check specific action
if (canPerform(Action.CREATE_RESTAURANT, user)) {
  // User can create restaurants
}
```

### Check Role-Based Access

```typescript
import { canAccessAdmin, canAccessRestaurantPortal } from "@dinewithme/shared";

// Check admin access
if (canAccessAdmin(user)) {
  // Show admin panel
}

// Check restaurant portal access
if (canAccessRestaurantPortal(user)) {
  // Show restaurant management
}
```

### Get User Permissions

```typescript
import { getUserPermissions } from "@dinewithme/shared";

const permissions = getUserPermissions(user);
// Returns array of all actions user can perform
```

### Role Checks

```typescript
import { isDiner, isRestaurantAdmin, isPlatformAdmin } from "@dinewithme/shared";

if (isPlatformAdmin(user)) {
  // Platform admin specific logic
}

if (isRestaurantAdmin(user)) {
  // Restaurant admin specific logic
}

if (isDiner(user)) {
  // Diner specific logic
}
```

## Actions

Available actions are defined in `actions.ts`:

### User Actions
- `VIEW_PROFILE` - View user profile
- `EDIT_PROFILE` - Edit user profile
- `DELETE_ACCOUNT` - Delete user account

### Dinner Actions
- `CREATE_DINNER` - Create a dinner event
- `EDIT_DINNER` - Edit dinner details
- `DELETE_DINNER` - Delete a dinner
- `JOIN_DINNER` - Join a dinner
- `LEAVE_DINNER` - Leave a dinner

### Restaurant Actions
- `CREATE_RESTAURANT` - Create a restaurant
- `EDIT_RESTAURANT` - Edit restaurant details
- `DELETE_RESTAURANT` - Delete a restaurant
- `VIEW_RESTAURANT_ANALYTICS` - View restaurant analytics

### Platform Admin Actions
- `VIEW_ADMIN_PANEL` - Access admin panel
- `MANAGE_USERS` - Manage all users
- `MANAGE_RESTAURANTS` - Manage all restaurants
- `VIEW_PLATFORM_ANALYTICS` - View platform analytics
- `ASSIGN_ROLES` - Assign roles to users

## Permission Matrix

| Action | DINER | RESTAURANT_ADMIN | PLATFORM_ADMIN |
|--------|-------|------------------|----------------|
| View Profile | ✅ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ |
| Create Dinner | ✅ | ✅ | ✅ |
| Create Restaurant | ❌ | ✅ | ✅ |
| View Restaurant Analytics | ❌ | ✅ | ✅ |
| View Admin Panel | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Assign Roles | ❌ | ❌ | ✅ |

## Extending Permissions

### Add New Action

1. Add to `actions.ts`:
```typescript
export enum Action {
  // ... existing
  MY_NEW_ACTION = "MY_NEW_ACTION",
}
```

2. Add to permission matrix in `permissions.ts`:
```typescript
const PERMISSIONS: Record<Action, Role[]> = {
  // ... existing
  [Action.MY_NEW_ACTION]: [Role.PLATFORM_ADMIN],
};
```

### Add New Role

1. Add to Prisma schema:
```prisma
enum Role {
  DINER
  RESTAURANT_ADMIN
  PLATFORM_ADMIN
  MY_NEW_ROLE
}
```

2. Add to `roles.ts`:
```typescript
export enum Role {
  // ... existing
  MY_NEW_ROLE = "MY_NEW_ROLE",
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  // ... existing
  [Role.MY_NEW_ROLE]: 4,
};
```

3. Update permission matrix in `permissions.ts`

4. Run migration:
```bash
npx prisma db push
```
