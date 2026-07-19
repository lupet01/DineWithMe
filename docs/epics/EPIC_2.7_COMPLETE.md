# EPIC 2.7: Light Verification & Quality Controls - Complete ✅

## Overview
Implemented restaurant verification and approval workflow with platform admin controls to ensure quality before restaurants can create dinners.

---

## What Was Implemented

### 1. Database Schema
**File**: `prisma/schema.prisma`

Added:
- `RestaurantStatus` enum: PENDING, ACTIVE, PAUSED
- `status` field to Restaurant model (defaults to PENDING)
- New restaurants start as PENDING and require approval

### 2. Restaurant Repository Extensions
**File**: `packages/db/src/repositories/restaurant.repository.ts`

New methods:
- `updateStatus()` - Change restaurant status
- `approve()` - Set status to ACTIVE
- `pause()` - Set status to PAUSED
- `findPending()` - Get all pending restaurants
- `findByStatus()` - Filter by status
- `isActive()` - Check if restaurant is active

### 3. Dinner Creation Validation
**File**: `packages/db/src/repositories/dinner.repository.ts`

Modified `create()` method to:
- Check restaurant status before creating dinner
- Only allow ACTIVE restaurants to create dinners
- Throw error if restaurant is PENDING or PAUSED

### 4. Analytics Events
**File**: `packages/analytics/src/events.ts`

Added events:
- `RESTAURANT_APPROVED` - Tracks when restaurant is approved
- `RESTAURANT_PAUSED` - Tracks when restaurant is paused

Event payloads include:
- restaurantId, restaurantName
- approvedBy/pausedBy (admin user ID)
- approverEmail/pauserEmail
- reason (for pause)
- timestamp

### 5. Platform Admin Operations Page

#### Ops Layout
**File**: `apps/web/src/app/admin/ops/layout.tsx`

Features:
- PLATFORM_ADMIN only access
- Redirects non-admins to unauthorized page
- Clean header with admin badge
- Centered content layout

#### Restaurants Page
**File**: `apps/web/src/app/admin/ops/restaurants/page.tsx`

Features:
- Server-side data fetching
- Loads all restaurants with members
- Passes data to table component

#### Server Actions
**File**: `apps/web/src/app/admin/ops/restaurants/actions.ts`

Actions:
- `approveRestaurant()` - Approve pending restaurant
- `pauseRestaurant()` - Pause active restaurant (with reason)
- `reactivateRestaurant()` - Reactivate paused restaurant
- All actions check PLATFORM_ADMIN role
- All actions track analytics

### 6. UI Components

#### RestaurantsTable Component
**File**: `apps/web/src/app/admin/ops/restaurants/components/restaurants-table.tsx`

Features:
- Stats cards showing counts by status
- Filter tabs: All, Pending, Active, Paused
- Responsive table layout
- Empty state for no restaurants
- Columns: Restaurant, Owner, Location, Status, Created, Actions

#### RestaurantRow Component
**File**: `apps/web/src/app/admin/ops/restaurants/components/restaurant-row.tsx`

Features:
- Displays restaurant details
- Shows owner information
- Color-coded status badges
- Conditional action buttons:
  - "Approve" (PENDING → ACTIVE)
  - "Pause" (ACTIVE → PAUSED, with reason prompt)
  - "Reactivate" (PAUSED → ACTIVE)
- Confirmation dialogs
- Loading states

---

## Status Badge Colors

- **PENDING**: Yellow (bg-yellow-100, text-yellow-800)
- **ACTIVE**: Green (bg-green-100, text-green-800)
- **PAUSED**: Red (bg-red-100, text-red-800)

---

## Business Logic

### Restaurant Lifecycle
```
PENDING → ACTIVE → PAUSED
    ↓        ↑________↑
(Created)  (Reactivate)
```

Rules:
- New restaurants start as PENDING
- Only PLATFORM_ADMIN can approve/pause restaurants
- Only ACTIVE restaurants can create dinners
- PENDING restaurants cannot create dinners
- PAUSED restaurants cannot create dinners
- Paused restaurants can be reactivated

### Dinner Creation Validation
- Before creating a dinner, check restaurant status
- If restaurant is not ACTIVE, throw error
- Error message includes current status
- Prevents dinners from being created by unapproved restaurants

### Authorization
- Only PLATFORM_ADMIN can access `/admin/ops/*`
- All status change actions verify PLATFORM_ADMIN role
- Non-admins redirected to unauthorized page

---

## Files Created

1. `apps/web/src/app/admin/ops/layout.tsx`
2. `apps/web/src/app/admin/ops/restaurants/page.tsx`
3. `apps/web/src/app/admin/ops/restaurants/actions.ts`
4. `apps/web/src/app/admin/ops/restaurants/components/restaurants-table.tsx`
5. `apps/web/src/app/admin/ops/restaurants/components/restaurant-row.tsx`

## Files Modified

1. `prisma/schema.prisma` - Added RestaurantStatus enum and status field
2. `packages/db/src/repositories/restaurant.repository.ts` - Added status management methods
3. `packages/db/src/repositories/dinner.repository.ts` - Added restaurant status check
4. `packages/analytics/src/events.ts` - Added approval/pause events

---

## Testing Guide

### 1. Setup Database

Stop dev server, then sync schema:
```bash
cd prisma
npx prisma db push
npx prisma generate
```

### 2. Update Existing Restaurant Status

Your existing restaurant is probably missing the status field:
```bash
psql -U postgres -d dinewithme -c "UPDATE restaurants SET status = 'PENDING' WHERE status IS NULL;"
```

### 3. Make Yourself Platform Admin

```bash
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'luupetros@gmail.com';"
```

### 4. Access Ops Page

1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:3001/admin/ops/restaurants

Expected: See restaurants table with your restaurant in PENDING status

### 5. Test Approval Workflow

**Approve Restaurant**:
1. Find your restaurant (status: PENDING)
2. Click "Approve" button
3. Confirm in dialog
4. Status should change to green "ACTIVE"

**Pause Restaurant**:
1. Find an ACTIVE restaurant
2. Click "Pause" button
3. Enter reason (optional)
4. Status should change to red "PAUSED"

**Reactivate Restaurant**:
1. Find a PAUSED restaurant
2. Click "Reactivate" button
3. Confirm in dialog
4. Status should change to green "ACTIVE"

### 6. Test Dinner Creation Validation

**With PENDING Restaurant**:
```bash
# Try to create dinner for pending restaurant
# Should fail with error about restaurant status
```

**With ACTIVE Restaurant**:
```bash
# Approve restaurant first
# Then create dinner - should succeed
npx tsx seed-dinners.ts
```

### 7. Test Filter Tabs

- Click "All" - shows all restaurants
- Click "Pending" - shows only PENDING
- Click "Active" - shows only ACTIVE
- Click "Paused" - shows only PAUSED

### 8. Verify Analytics

Check console for analytics events:
- `restaurant_approved` when approving
- `restaurant_paused` when pausing

---

## API Integration

The restaurant status is now enforced at the repository level:

```typescript
// This will throw error if restaurant is not ACTIVE
await dinnerRepository.create({
  restaurant: { connect: { id: restaurantId } },
  scheduledAt: new Date(),
  theme: "Test Dinner",
  totalSeats: 10,
});
```

---

## Access Control

### Platform Admin Only Routes
- `/admin/ops/*` - All ops pages
- Requires `Role.PLATFORM_ADMIN`
- Non-admins redirected to `/app/unauthorized`

### Restaurant Admin Routes
- `/admin/restaurant` - Restaurant profile
- `/admin/dinners` - Dinners management
- Requires `Role.RESTAURANT_ADMIN` or `Role.PLATFORM_ADMIN`

---

## Next Steps (Future Enhancements)

1. **Email Notifications**
   - Notify restaurant owner when approved
   - Notify restaurant owner when paused
   - Include reason for pause

2. **Rejection Workflow**
   - Add REJECTED status
   - Allow platform admin to reject with reason
   - Prevent re-application

3. **Verification Checklist**
   - Required fields for approval
   - Document upload (business license, etc.)
   - Photo verification

4. **Audit Log**
   - Track all status changes
   - Show who approved/paused and when
   - Display in restaurant details

5. **Bulk Operations**
   - Approve multiple restaurants at once
   - Bulk pause/reactivate
   - Export restaurant list

6. **Advanced Filters**
   - Search by name, owner, location
   - Sort by created date, status
   - Date range filters

---

## Security Considerations

✅ PLATFORM_ADMIN role check in layout  
✅ PLATFORM_ADMIN role check in all actions  
✅ Server-side validation  
✅ Confirmation dialogs for destructive actions  
✅ Analytics tracking for audit trail  
✅ Restaurant status enforced at repository level  

---

## Performance Notes

- Indexes on restaurant status for fast filtering
- Server components for initial data fetch
- Client components only for interactive elements
- Optimistic UI updates with revalidation
- Efficient queries with Prisma includes

---

## Summary

EPIC 2.7 is complete with a full restaurant verification and approval workflow. Platform admins can now:
- View all restaurants in a centralized dashboard
- See pending restaurants requiring approval
- Approve restaurants to allow dinner creation
- Pause restaurants for quality control
- Reactivate paused restaurants
- Track all actions with analytics

The system ensures only approved (ACTIVE) restaurants can create dinners, providing a quality gate before restaurants go live on the platform.
