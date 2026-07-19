# EPIC 2.1: Quick Reference

## Run Migration
```powershell
.\run-restaurant-migration.ps1
```

## Import Repository
```typescript
import { restaurantRepository } from "@dinewithme/db";
```

## Import Schemas
```typescript
import { 
  createRestaurantSchema, 
  updateRestaurantSchema,
  type CreateRestaurantInput,
  type UpdateRestaurantInput 
} from "@dinewithme/shared/schemas";
```

## Key Functions

### Create Restaurant with Owner
```typescript
const restaurant = await restaurantRepository.createWithOwner(
  { name: "My Restaurant", city: "Cape Town" },
  userId
);
```

### Get User's Restaurants
```typescript
const restaurants = await restaurantRepository.findManyForUser(userId);
```

### Check Permissions
```typescript
const isOwner = await restaurantRepository.isUserOwner(restaurantId, userId);
const isMember = await restaurantRepository.isUserMember(restaurantId, userId);
```

### Update Restaurant
```typescript
const updated = await restaurantRepository.update(restaurantId, {
  name: "New Name",
  description: "Updated description"
});
```

## Schema Fields

### Required
- `name`: string

### Optional
- `description`: string
- `cuisine`: string
- `city`: string
- `address`: string
- `latitude`: number (-90 to 90)
- `longitude`: number (-180 to 180)
- `phone`: string
- `website`: string (URL)
- `heroImageUrl`: string (URL)

## Roles
- `OWNER`: Full control
- `MANAGER`: Management permissions
