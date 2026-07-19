# EPIC 2.6: Admin Dinners Dashboard - Complete ✅

## Overview
Implemented a complete admin dashboard for managing dinner events with status updates, cancellation, and seat management.

---

## What Was Implemented

### 1. Database Schema
**File**: `prisma/schema.prisma`

Added:
- `DinnerStatus` enum: SCHEDULED, LIVE, COMPLETED, CANCELLED
- `Dinner` model with fields:
  - id, restaurantId, scheduledAt, theme, description
  - totalSeats, filledSeats, status
  - Indexes for efficient querying
  - Cascade delete when restaurant is deleted

### 2. Dinner Repository
**File**: `packages/db/src/repositories/dinner.repository.ts`

Methods:
- `findById()` - Get dinner by ID
- `findByIdWithRestaurant()` - Get dinner with restaurant info
- `findByRestaurant()` - Get all dinners for a restaurant
- `findByRestaurantWithStatus()` - Filter by status
- `findUpcomingByRestaurant()` - Get upcoming dinners only
- `updateStatus()` - Change dinner status
- `cancelDinner()` - Cancel and release seats
- `isAuthorizedToManage()` - Check user permissions

### 3. Analytics Events
**File**: `packages/analytics/src/events.ts`

Added events:
- `DINNER_CANCELLED` - Tracks cancellations with seat release info
- `DINNER_STATUS_CHANGED` - Tracks status transitions

Event payloads include:
- dinnerId, restaurantId, restaurantName
- userId, timestamp
- Status-specific data (old/new status, released seats)

### 4. Server Actions
**File**: `apps/web/src/app/admin/dinners/actions.ts`

Actions:
- `updateDinnerStatus()` - Mark dinner as LIVE or COMPLETED
  - Validates authorization
  - Tracks analytics
  - Revalidates page
- `cancelDinner()` - Cancel dinner and release seats
  - Prevents cancelling completed dinners
  - Releases all filled seats
  - Tracks analytics

### 5. UI Components

#### DinnersTable Component
**File**: `apps/web/src/app/admin/dinners/components/dinners-table.tsx`

Features:
- Filter tabs: All, Upcoming, Past
- Responsive table layout
- Empty state for no dinners
- Columns: Date/Time, Theme, Seats, Status, Actions

#### DinnerRow Component
**File**: `apps/web/src/app/admin/dinners/components/dinner-row.tsx`

Features:
- Formatted date and time display
- Seat availability (filled / total)
- Color-coded status badges
- Conditional action buttons:
  - "Mark Live" (SCHEDULED → LIVE)
  - "Complete" (LIVE → COMPLETED)
  - "Cancel" (SCHEDULED/LIVE → CANCELLED)
- Confirmation dialogs
- Loading states

#### Dinners Page
**File**: `apps/web/src/app/admin/dinners/page.tsx`

Features:
- Server-side data fetching
- Authentication check
- User authorization
- Renders DinnersTable with data

---

## Status Badge Colors

- **SCHEDULED**: Blue (bg-blue-100, text-blue-800)
- **LIVE**: Green (bg-green-100, text-green-800)
- **COMPLETED**: Gray (bg-slate-100, text-slate-800)
- **CANCELLED**: Red (bg-red-100, text-red-800)

---

## Business Logic

### Status Transitions
```
SCHEDULED → LIVE → COMPLETED
     ↓
CANCELLED
```

Rules:
- Can mark SCHEDULED as LIVE
- Can mark LIVE as COMPLETED
- Can cancel SCHEDULED or LIVE
- Cannot cancel COMPLETED
- Cannot cancel already CANCELLED

### Seat Management
- When dinner is cancelled: `filledSeats` set to 0
- Tracks released seats in analytics
- Shows available seats (totalSeats - filledSeats)

### Authorization
- User must be OWNER or MANAGER of the restaurant
- Checked via `RestaurantMember` relationship
- Enforced in server actions

---

## Files Created/Modified

### Created
1. `packages/db/src/repositories/dinner.repository.ts`
2. `apps/web/src/app/admin/dinners/actions.ts`
3. `apps/web/src/app/admin/dinners/components/dinners-table.tsx`
4. `apps/web/src/app/admin/dinners/components/dinner-row.tsx`
5. `seed-dinners.ts` (test data script)

### Modified
1. `prisma/schema.prisma` - Added Dinner model and DinnerStatus enum
2. `packages/db/src/repositories/index.ts` - Exported dinner repository
3. `packages/analytics/src/events.ts` - Added dinner events
4. `apps/web/src/app/admin/dinners/page.tsx` - Implemented dashboard

---

## Testing Guide

### 1. Setup Database

The Dinner model has been added to the schema and synced with:
```bash
npx prisma db push
```

### 2. Seed Test Data

Run the seed script to create sample dinners:
```bash
npx tsx seed-dinners.ts
```

This creates:
- 3 upcoming dinners (SCHEDULED)
- 1 completed dinner
- 1 cancelled dinner

### 3. Access Dashboard

1. Start dev server: `npm run dev`
2. Sign in as RESTAURANT_ADMIN
3. Navigate to: http://localhost:3001/admin/dinners

### 4. Test Features

**Filter Tabs**:
- Click "All Dinners" - shows all
- Click "Upcoming" - shows SCHEDULED and LIVE only
- Click "Past" - shows COMPLETED and CANCELLED

**Status Updates**:
- Find a SCHEDULED dinner
- Click "Mark Live" → Status changes to LIVE
- Click "Complete" → Status changes to COMPLETED

**Cancellation**:
- Find a SCHEDULED or LIVE dinner
- Click "Cancel" → Confirm dialog
- Status changes to CANCELLED
- Filled seats reset to 0

**Analytics**:
- Check console for analytics events
- Events tracked: `dinner_status_changed`, `dinner_cancelled`

---

## API Integration

The dinner repository is ready for API endpoints:

```typescript
// Example: GET /api/dinners
import { dinnerRepository } from "@dinewithme/db";

const dinners = await dinnerRepository.findByRestaurant(restaurantId);
```

```typescript
// Example: PATCH /api/dinners/:id
import { dinnerRepository } from "@dinewithme/db";

await dinnerRepository.updateStatus(dinnerId, "LIVE");
```

---

## Next Steps (Future Enhancements)

1. **Diner Notifications**
   - Email/SMS when dinner is cancelled
   - Reminder before dinner goes LIVE
   - Confirmation when status changes

2. **Seat Management**
   - View list of diners for each dinner
   - Manual seat allocation
   - Waitlist management

3. **Dinner Creation**
   - Form to create new dinners
   - Recurring dinner templates
   - Bulk operations

4. **Analytics Dashboard**
   - Dinner performance metrics
   - Attendance rates
   - Revenue tracking

5. **Restaurant Filtering**
   - Multi-restaurant support
   - Restaurant switcher in header
   - Filter dinners by selected restaurant

---

## Known Limitations

1. **No Restaurant Filtering**: Currently shows all dinners across all restaurants. In production, should filter by selected restaurant from header switcher.

2. **No Pagination**: All dinners loaded at once. Add pagination for large datasets.

3. **No Search**: No search functionality yet. Add search by theme, date, or status.

4. **No Diner List**: Cannot see who booked seats. Add diner management in future epic.

5. **No Edit**: Cannot edit dinner details after creation. Add edit functionality.

---

## Security Considerations

✅ Authorization checks in server actions  
✅ User must be restaurant OWNER or MANAGER  
✅ Confirmation dialogs for destructive actions  
✅ Server-side validation  
✅ Analytics tracking for audit trail  

---

## Performance Notes

- Indexes added for common queries:
  - `restaurantId` - Filter by restaurant
  - `restaurantId + status` - Filter by restaurant and status
  - `scheduledAt` - Sort by date
- Uses server components for initial data fetch
- Client components only for interactive elements
- Optimistic UI updates with revalidation

---

## Summary

EPIC 2.6 is complete with a fully functional admin dinners dashboard. Restaurant admins can now:
- View all dinners in a clean table interface
- Filter by upcoming/past dinners
- Update dinner status (SCHEDULED → LIVE → COMPLETED)
- Cancel dinners and release seats
- See seat availability at a glance
- All actions are tracked with analytics

The foundation is ready for future enhancements like diner notifications, seat management, and dinner creation.
