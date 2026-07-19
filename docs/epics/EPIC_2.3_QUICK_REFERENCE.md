# EPIC 2.3: Quick Reference

## Server Actions

### Create Restaurant
```typescript
import { createRestaurant } from "@/app/admin/restaurant/actions";

const result = await createRestaurant({
  name: "My Restaurant",
  description: "Great food",
  cuisine: "Italian",
  city: "Cape Town",
  address: "123 Main St",
  phone: "+27 21 123 4567",
  website: "https://example.com",
});

if (result.success) {
  console.log("Created:", result.data.restaurantId);
}
```

### Update Restaurant
```typescript
import { updateRestaurant } from "@/app/admin/restaurant/actions";

const result = await updateRestaurant(restaurantId, {
  name: "Updated Name",
  description: "New description",
});

if (result.success) {
  console.log("Updated successfully");
}
```

## Form Component

```typescript
import { RestaurantForm } from "./components/restaurant-form";

// Onboarding (create)
<RestaurantForm mode="create" />

// Edit existing
<RestaurantForm restaurant={restaurant} mode="edit" />
```

## Analytics Events

### Restaurant Created
```typescript
await trackServerSide(AnalyticsEvents.RESTAURANT_CREATED, {
  restaurantId: "...",
  restaurantName: "...",
  userId: "...",
  email: "...",
  timestamp: new Date().toISOString(),
});
```

### Restaurant Updated
```typescript
await track(AnalyticsEvents.RESTAURANT_PROFILE_UPDATED, {
  restaurantId: "...",
  restaurantName: "...",
  userId: "...",
  fields: ["name", "description"],
  timestamp: new Date().toISOString(),
});
```

## Repository Methods Used

```typescript
import { restaurantRepository } from "@dinewithme/db";

// Get user's restaurants
const restaurants = await restaurantRepository.findManyForUser(userId);

// Create with owner
const restaurant = await restaurantRepository.createWithOwner(data, userId);

// Check ownership
const isOwner = await restaurantRepository.isUserOwner(restaurantId, userId);

// Update
const updated = await restaurantRepository.update(restaurantId, data);
```

## Validation Schema

```typescript
import { createRestaurantSchema } from "@dinewithme/shared";

const result = createRestaurantSchema.safeParse(input);
if (result.success) {
  // Valid data
} else {
  // Validation errors
  console.log(result.error.flatten().fieldErrors);
}
```

## Form Fields

### Required
- name: string (min 1 character)

### Optional
- description: string
- cuisine: string
- city: string
- address: string
- phone: string
- website: string (URL validation)

## Error Handling

```typescript
// Field errors
{
  success: false,
  error: "Validation failed",
  fieldErrors: {
    name: ["Restaurant name is required"],
    website: ["Invalid website URL"]
  }
}

// General error
{
  success: false,
  error: "You do not have permission to edit this restaurant"
}
```

## User Flow

1. Navigate to `/admin/restaurant`
2. If no restaurant → Onboarding form
3. If has restaurant → Edit form
4. Fill/update fields
5. Submit form
6. Server action validates and saves
7. Analytics event emitted
8. Page refreshes with updated data

## Testing Checklist

- [ ] Create restaurant with valid data
- [ ] Create restaurant without name (should fail)
- [ ] Create restaurant with invalid URL (should fail)
- [ ] Try to create second restaurant (should fail)
- [ ] Edit existing restaurant
- [ ] Update multiple fields
- [ ] Verify analytics events
- [ ] Check database records
- [ ] Test permission checks
