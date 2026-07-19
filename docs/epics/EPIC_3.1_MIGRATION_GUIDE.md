# EPIC 3.1: Dinner/Seat Lifecycle Migration Guide

## Overview
This migration updates the Prisma schema to support a proper seat reservation system with holds, confirmations, and lifecycle tracking.

## Schema Changes

### Dinner Model Updates
- `scheduledAt` → `startsAt` (renamed)
- Added `endsAt` field (DateTime)
- `totalSeats` → `seatCount` (renamed)
- Removed `filledSeats` (now calculated from Seat records)
- Added `seats` relation to Seat model

### New Seat Model
```prisma
model Seat {
  id                String     @id @default(cuid())
  dinnerId          String
  status            SeatStatus @default(AVAILABLE)
  heldByUserId      String?
  holdExpiresAt     DateTime?
  confirmedByUserId String?
  checkedInAt       DateTime?
  checkedOutAt      DateTime?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
}
```

### New SeatStatus Enum
- AVAILABLE - Seat is open for reservation
- HELD - Temporarily reserved (with expiration)
- CONFIRMED - Reservation confirmed (payment completed)
- ATTENDED - Diner checked in
- COMPLETED - Diner checked out
- CANCELLED - Reservation cancelled
- EXPIRED - Hold expired without confirmation
- NO_SHOW - Diner didn't show up
- LEFT_EARLY - Diner left before dinner ended

### User Model Updates
Added relations for seat tracking:
- `heldSeats` - Seats currently held by user
- `confirmedSeats` - Seats confirmed by user

## Migration Steps

### 1. Stop Dev Server (IMPORTANT!)
```powershell
# Stop the dev server to avoid file locking issues
# Press Ctrl+C in the terminal running the dev server
```

### 2. Apply Schema Changes
```powershell
cd prisma
npx prisma db push
```

This will:
- Rename `scheduledAt` to `startsAt` in dinners table
- Add `endsAt` column to dinners table
- Rename `totalSeats` to `seatCount` in dinners table
- Remove `filledSeats` column from dinners table
- Create new `seats` table with all fields and indexes
- Add seat relations to users table

### 3. Generate Prisma Client
```powershell
npx prisma generate
```

### 4. Clear Old Data (Recommended)
Since the schema changed significantly, it's best to clear old dinners:

```powershell
psql -U postgres -d dinewithme -c 'DELETE FROM dinners;'
```

### 5. Seed New Data
```powershell
cd ..
npx tsx seed-dinners.ts
```

This will create sample dinners with proper seats.

## New Repository: SeatRepository

Location: `packages/db/src/repositories/seat.repository.ts`

### Key Methods

**Seat Lifecycle:**
- `holdSeat(seatId, userId, holdDurationMinutes)` - Hold a seat temporarily
- `confirmSeat(seatId, userId)` - Confirm a held seat
- `releaseSeat(seatId)` - Release a seat back to available
- `cancelSeat(seatId)` - Cancel a reservation

**Check-in/Check-out:**
- `checkIn(seatId)` - Mark diner as attended
- `checkOut(seatId)` - Mark diner as completed
- `markNoShow(seatId)` - Mark as no-show
- `markLeftEarly(seatId)` - Mark as left early

**Queries:**
- `findByDinner(dinnerId)` - Get all seats for a dinner
- `findByDinnerWithStatus(dinnerId, status)` - Filter by status
- `findByUser(userId)` - Get user's seats
- `countByDinnerAndStatus(dinnerId, status)` - Count seats

**Maintenance:**
- `expireHolds()` - Expire all holds past their expiration time
- `releaseAllSeatsForDinner(dinnerId)` - Cancel all seats (used when cancelling dinner)

## Updated DinnerRepository

### Changes to Existing Methods:
- `create()` - Now automatically creates seats based on `seatCount`
- `cancelDinner()` - Now cancels all held/confirmed seats
- All queries updated to use `startsAt` instead of `scheduledAt`

### Seat Count Calculation:
Instead of `filledSeats`, calculate from Seat records:
```typescript
const confirmedCount = await seatRepository.countByDinnerAndStatus(
  dinnerId,
  "CONFIRMED"
);
```

## Zod Schemas

### Dinner Schemas
Location: `packages/shared/src/schemas/dinner.schema.ts`

- `createDinnerSchema` - Validates dinner creation (startsAt, endsAt, seatCount)
- `updateDinnerSchema` - Validates dinner updates
- `dinnerStatusSchema` - Enum validation

### Seat Schemas
Location: `packages/shared/src/schemas/seat.schema.ts`

- `holdSeatSchema` - Validates seat hold requests
- `confirmSeatSchema` - Validates seat confirmations
- `releaseSeatSchema` - Validates seat releases
- `checkInSchema` / `checkOutSchema` - Validates check-in/out

## Breaking Changes

### API/UI Updates Needed:
1. Update any code referencing `scheduledAt` → use `startsAt`
2. Update any code referencing `totalSeats` → use `seatCount`
3. Remove any code using `filledSeats` → calculate from seats
4. Update dinner creation forms to include `endsAt`
5. Update dinner display to show seat counts from Seat records

### Example: Getting Filled Seats Count
```typescript
// OLD
const filledSeats = dinner.filledSeats;

// NEW
const confirmedSeats = await seatRepository.countByDinnerAndStatus(
  dinner.id,
  "CONFIRMED"
);
```

## Testing

### Verify Schema:
```powershell
psql -U postgres -d dinewithme -c "\d dinners"
psql -U postgres -d dinewithme -c "\d seats"
```

### Check Seed Data:
```powershell
psql -U postgres -d dinewithme -c "SELECT id, theme, \"startsAt\", \"endsAt\", \"seatCount\", status FROM dinners;"
psql -U postgres -d dinewithme -c "SELECT \"dinnerId\", status, COUNT(*) FROM seats GROUP BY \"dinnerId\", status;"
```

## Next Steps (Not in this EPIC)

These features will be implemented in future EPICs:
- UI for seat reservation flow
- Payment integration for seat confirmation
- Automated hold expiration job
- Diner check-in/check-out UI
- Seat availability real-time updates
- Waitlist functionality

## Rollback (If Needed)

If you need to rollback:
1. Restore the old schema from git
2. Run `npx prisma db push --force-reset`
3. Re-seed with old data structure

## Support

If you encounter issues:
1. Check that dev server is stopped before running `npx prisma generate`
2. Verify PostgreSQL is running
3. Check that all environment variables are set correctly
4. Review error messages carefully - they usually indicate the exact issue
