# EPIC 2.3: Restaurant Onboarding and Profile Editing - COMPLETE

## Overview
Implemented restaurant onboarding and profile editing with server actions, Zod validation, and analytics tracking. Users can create their first restaurant or edit existing restaurant information.

## What Was Implemented

### 1. Server Actions (`apps/web/src/app/admin/restaurant/actions.ts`)

Created two server actions for restaurant management:

#### `createRestaurant(input)`
- Validates input using Zod schema
- Checks if user already has a restaurant (prevents duplicates)
- Creates restaurant with user as OWNER via `RestaurantMember`
- Emits `restaurant_created` analytics event (server-side only)
- Revalidates the restaurant page
- Returns success with restaurantId or error with field errors

#### `updateRestaurant(restaurantId, input)`
- Validates input using Zod schema
- Verifies user is owner of the restaurant
- Tracks which fields were updated
- Updates restaurant data
- Emits `restaurant_profile_updated` analytics event
- Revalidates the restaurant page
- Returns success or error with field errors

#### `ActionResult<T>` Type
```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

### 2. Restaurant Form Component (`restaurant-form.tsx`)

Client component with two modes:

#### Create Mode (Onboarding)
- Shows when user has no restaurant
- Collects basic information
- Creates restaurant and assigns user as owner
- Redirects to edit mode after creation

#### Edit Mode
- Shows when user has a restaurant
- Pre-fills form with existing data
- Updates restaurant information
- Refreshes page to show updated data

#### Features
- Real-time validation with field-level error display
- Loading states during submission
- Error alerts for general errors
- Optimistic UI updates with `useTransition`
- Form state management with React hooks
- Accessible form inputs with labels

#### Form Fields
- Restaurant Name (required)
- Description (textarea)
- Cuisine Type
- City
- Address
- Phone Number
- Website (URL validation)

### 3. Restaurant Profile Page (`page.tsx`)

Server component that:
- Fetches user's restaurant from database
- Shows onboarding flow if no restaurant exists
- Shows edit form if restaurant exists
- Handles authentication automatically (via layout)

#### Onboarding View
- Welcome message with emoji
- Friendly onboarding copy
- Create form

#### Edit View
- Page header
- Edit form with existing data

### 4. Analytics Events

Added two new events to `packages/analytics/src/events.ts`:

#### `restaurant_created` (Server-side only)
```typescript
interface RestaurantCreatedEvent {
  restaurantId: string;
  restaurantName: string;
  userId: string;
  email: string;
  timestamp: string;
}
```

#### `restaurant_profile_updated`
```typescript
interface RestaurantProfileUpdatedEvent {
  restaurantId: string;
  restaurantName: string;
  userId: string;
  fields: string[];  // Which fields were updated
  timestamp: string;
}
```

### 5. Repository Usage

Uses `RestaurantRepository` methods:
- `findManyForUser(userId)` - Get user's restaurants
- `createWithOwner(data, userId)` - Create restaurant with owner
- `isUserOwner(restaurantId, userId)` - Check ownership
- `findById(restaurantId)` - Get restaurant for comparison
- `update(restaurantId, data)` - Update restaurant

### 6. Validation

Uses Zod schemas from `@dinewithme/shared`:
- `createRestaurantSchema` - Validates creation
- `updateRestaurantSchema` - Validates updates

#### Validation Rules
- Name: Required, min 1 character
- Website: Must be valid URL or empty
- All other fields: Optional
- Empty strings converted to null in database

### 7. Error Handling

#### Field-Level Errors
- Displayed below each input
- Cleared when user starts typing
- Returned from Zod validation

#### General Errors
- Displayed in alert banner at top
- Includes permission errors
- Includes database errors

#### Permission Checks
- User must be owner to edit
- Prevents editing other users' restaurants
- Clear error messages

## Files Created/Modified

### Created
- `apps/web/src/app/admin/restaurant/actions.ts`
- `apps/web/src/app/admin/restaurant/components/restaurant-form.tsx`
- `EPIC_2.3_COMPLETE.md`

### Modified
- `apps/web/src/app/admin/restaurant/page.tsx`
- `packages/analytics/src/events.ts`

## User Flow

### First-Time User (Onboarding)
1. User navigates to `/admin/restaurant`
2. Sees welcome message and onboarding form
3. Fills in restaurant details
4. Clicks "Create Restaurant"
5. Restaurant created with user as OWNER
6. Page refreshes to show edit form
7. Analytics event `restaurant_created` emitted

### Existing User (Editing)
1. User navigates to `/admin/restaurant`
2. Sees edit form with current data
3. Updates fields as needed
4. Clicks "Save Changes"
5. Restaurant updated in database
6. Page refreshes to show updated data
7. Analytics event `restaurant_profile_updated` emitted

## Technical Details

### Server Actions
- Use `"use server"` directive
- Run on server-side only
- Type-safe with TypeScript
- Automatic serialization
- No API routes needed

### Form State Management
- `useState` for form data
- `useTransition` for pending state
- `useRouter` for navigation
- Optimistic UI updates

### Data Flow
```
User Input → Form State → Server Action → Validation → Repository → Database
                                                    ↓
                                              Analytics Event
                                                    ↓
                                              Revalidate Path
                                                    ↓
                                              Refresh UI
```

### Security
- Server-side validation (Zod)
- Ownership verification
- Authentication required (via layout)
- Role-based access control

## Testing

### Test Create Flow
1. Sign in as RESTAURANT_ADMIN
2. Navigate to `/admin/restaurant`
3. Should see onboarding form
4. Fill in restaurant name (required)
5. Fill in optional fields
6. Click "Create Restaurant"
7. Should see success and edit form

### Test Edit Flow
1. Have existing restaurant
2. Navigate to `/admin/restaurant`
3. Should see edit form with data
4. Update some fields
5. Click "Save Changes"
6. Should see success and updated data

### Test Validation
1. Try to create without name → Error
2. Try invalid website URL → Error
3. Try to create second restaurant → Error
4. Try to edit another user's restaurant → Error

### Test Analytics
1. Create restaurant → Check `restaurant_created` event
2. Update restaurant → Check `restaurant_profile_updated` event
3. Verify event properties are correct

## Database Schema

### Restaurant Table
```sql
CREATE TABLE restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cuisine TEXT,
  city TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  website TEXT,
  heroImageUrl TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL
);
```

### RestaurantMember Table
```sql
CREATE TABLE restaurant_members (
  id TEXT PRIMARY KEY,
  restaurantId TEXT NOT NULL REFERENCES restaurants(id),
  userId TEXT NOT NULL REFERENCES users(id),
  role RestaurantMemberRole NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(restaurantId, userId)
);
```

## Non-Goals (As Specified)

- ❌ No media upload yet (heroImageUrl field exists but no upload UI)
- ❌ No latitude/longitude input (fields exist but no UI)
- ❌ No map integration
- ❌ No image preview

## Next Steps

### EPIC 2.4: Restaurant Switcher
- Load user's restaurants in header
- Dropdown menu for selection
- Store selected restaurant in context
- Filter data by selected restaurant

### EPIC 2.5: Media Upload
- Add image upload for heroImageUrl
- Image preview
- Image optimization
- Storage integration (S3, Cloudinary, etc.)

### EPIC 2.6: Location Features
- Add latitude/longitude input
- Map integration for address selection
- Geocoding API integration
- Location preview

## Usage Examples

### Creating a Restaurant (Server Action)
```typescript
const result = await createRestaurant({
  name: "The Gourmet Kitchen",
  description: "Fine dining experience",
  cuisine: "French",
  city: "Cape Town",
  address: "123 Main St",
  phone: "+27 21 123 4567",
  website: "https://gourmetkitchen.co.za",
});

if (result.success) {
  console.log("Restaurant created:", result.data.restaurantId);
} else {
  console.error("Error:", result.error);
  console.error("Field errors:", result.fieldErrors);
}
```

### Updating a Restaurant (Server Action)
```typescript
const result = await updateRestaurant(restaurantId, {
  name: "Updated Name",
  description: "New description",
});

if (result.success) {
  console.log("Restaurant updated");
} else {
  console.error("Error:", result.error);
}
```

### Using the Form Component
```typescript
// Onboarding mode
<RestaurantForm mode="create" />

// Edit mode
<RestaurantForm restaurant={existingRestaurant} mode="edit" />
```

## Error Messages

### Validation Errors
- "Restaurant name is required"
- "Invalid website URL"
- Field-specific errors from Zod

### Business Logic Errors
- "You already have a restaurant. Please edit your existing restaurant instead."
- "You do not have permission to edit this restaurant"
- "Restaurant not found"

### System Errors
- "Failed to create restaurant"
- "Failed to update restaurant"

## Performance

- Server actions are fast (no API roundtrip)
- Optimistic UI updates with `useTransition`
- Revalidation only updates changed data
- No unnecessary re-renders
- Form state managed efficiently

## Accessibility

- Semantic HTML forms
- Proper label associations
- Required field indicators
- Error messages linked to inputs
- Keyboard navigation support
- Focus management

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Progressive enhancement ready
- Mobile-friendly responsive design
