# EPIC 2.1: Restaurant Domain Schema and RBAC Linking - COMPLETE

## Overview
Implemented the Restaurant domain schema with RBAC (Role-Based Access Control) linking, allowing users to own and manage multiple restaurants.

## What Was Implemented

### 1. Prisma Schema Updates

Added two new models to `prisma/schema.prisma`:

#### Restaurant Model
- `id`: Unique identifier (CUID)
- `name`: Restaurant name (required)
- `description`: Optional description
- `cuisine`: Optional cuisine type
- `city`: Optional city
- `address`: Optional address
- `latitude`, `longitude`: Optional coordinates
- `phone`: Optional phone number
- `website`: Optional website URL
- `heroImageUrl`: Optional hero image
- `createdAt`, `updatedAt`: Timestamps
- Relation: `members` (one-to-many with RestaurantMember)

#### RestaurantMember Model
- `id`: Unique identifier (CUID)
- `restaurantId`: Foreign key to Restaurant
- `userId`: Foreign key to User
- `role`: OWNER or MANAGER (enum)
- `createdAt`: Timestamp
- Indexes on `restaurantId` and `userId`
- Unique constraint on `[restaurantId, userId]`
- Cascade delete when restaurant or user is deleted

#### RestaurantMemberRole Enum
- `OWNER`: Full control over restaurant
- `MANAGER`: Management permissions (future use)

### 2. Repository Layer (`packages/db`)

Created `RestaurantRepository` with the following methods:

#### Core CRUD Operations
- `findById(id)`: Get restaurant by ID
- `findByIdWithMembers(id)`: Get restaurant with member details
- `findMany()`: Get all restaurants
- `create(data)`: Create restaurant (without owner)
- `update(id, data)`: Update restaurant
- `delete(id)`: Delete restaurant

#### User-Specific Operations
- `createWithOwner(data, ownerUserId)`: Create restaurant and assign owner
- `findManyForUser(userId)`: Get all restaurants for a user

#### Authorization Helpers
- `getUserRole(restaurantId, userId)`: Get user's role in restaurant
- `isUserMember(restaurantId, userId)`: Check if user is a member
- `isUserOwner(restaurantId, userId)`: Check if user is an owner

### 3. Zod Schemas (`packages/shared`)

Created `restaurant.schema.ts` with validation schemas:

- `createRestaurantSchema`: Validates restaurant creation
  - Required: `name`
  - Optional: all other fields with appropriate validation
  - URL validation for `website` and `heroImageUrl`
  - Coordinate validation for `latitude` (-90 to 90) and `longitude` (-180 to 180)

- `updateRestaurantSchema`: Validates restaurant updates
  - All fields optional
  - Same validation rules as create

- `restaurantIdSchema`: Validates restaurant ID parameter
- `restaurantMemberRoleSchema`: Validates member role enum

### 4. Migration

Created migration: `20260228125702_add_restaurant_models`
- Adds `RestaurantMemberRole` enum
- Creates `restaurants` table
- Creates `restaurant_members` table
- Adds indexes and foreign keys
- Sets up cascade delete

## Files Created/Modified

### Created
- `packages/db/src/repositories/restaurant.repository.ts`
- `packages/shared/src/schemas/restaurant.schema.ts`
- `prisma/migrations/20260228125702_add_restaurant_models/migration.sql`
- `run-restaurant-migration.ps1`
- `EPIC_2.1_COMPLETE.md`

### Modified
- `prisma/schema.prisma`
- `packages/db/src/repositories/index.ts`
- `packages/shared/src/schemas/index.ts`

## How to Apply Changes

### Option 1: Using the PowerShell Script (Recommended)
```powershell
.\run-restaurant-migration.ps1
```

### Option 2: Manual Steps
```powershell
# Navigate to prisma directory
cd prisma

# Apply migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Return to root
cd ..
```

## Usage Examples

### Creating a Restaurant with Owner
```typescript
import { restaurantRepository } from "@dinewithme/db";

const restaurant = await restaurantRepository.createWithOwner(
  {
    name: "The Gourmet Kitchen",
    description: "Fine dining experience",
    cuisine: "French",
    city: "Cape Town",
    address: "123 Main St",
    phone: "+27 21 123 4567",
    website: "https://gourmetkitchen.co.za",
  },
  userId // The owner's user ID
);
```

### Getting Restaurants for a User
```typescript
const userRestaurants = await restaurantRepository.findManyForUser(userId);
```

### Checking User Permissions
```typescript
const isOwner = await restaurantRepository.isUserOwner(restaurantId, userId);
const isMember = await restaurantRepository.isUserMember(restaurantId, userId);
```

### Updating a Restaurant
```typescript
const updated = await restaurantRepository.update(restaurantId, {
  name: "Updated Name",
  description: "New description",
});
```

## Future-Proofing

The schema is designed to support:
- Multiple restaurants per user
- Multiple users per restaurant
- Different role types (OWNER, MANAGER)
- Easy addition of new fields
- Cascade deletion for data integrity

## Non-Goals (As Specified)

- No UI implementation
- No dinner functionality yet
- No API endpoints yet

## Next Steps

To use this in your application:
1. Run the migration script
2. Import repository functions where needed
3. Use Zod schemas for validation in API routes
4. Implement UI components (EPIC 2.2+)
5. Add dinner functionality (EPIC 2.3+)

## Testing the Implementation

```typescript
// Example test flow
import { restaurantRepository, userRepository } from "@dinewithme/db";

// 1. Create a user (or use existing)
const user = await userRepository.findById("user_id");

// 2. Create a restaurant
const restaurant = await restaurantRepository.createWithOwner(
  {
    name: "Test Restaurant",
    city: "Cape Town",
  },
  user.id
);

// 3. Verify ownership
const isOwner = await restaurantRepository.isUserOwner(restaurant.id, user.id);
console.log("Is owner:", isOwner); // true

// 4. Get user's restaurants
const restaurants = await restaurantRepository.findManyForUser(user.id);
console.log("User restaurants:", restaurants.length); // 1
```
