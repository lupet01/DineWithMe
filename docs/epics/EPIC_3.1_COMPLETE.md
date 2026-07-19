# EPIC 3.1: Dinner/Seat Lifecycle - COMPLETE ✅

## What Was Built

### 1. Prisma Schema Updates
**File:** `prisma/schema.prisma`

#### Dinner Model Changes:
- ✅ Renamed `scheduledAt` → `startsAt`
- ✅ Added `endsAt` field (DateTime)
- ✅ Renamed `totalSeats` → `seatCount`
- ✅ Removed `filledSeats` (calculated from Seat records)
- ✅ Added `seats` relation

#### New Seat Model:
- ✅ Core fields: id, dinnerId, status
- ✅ Hold tracking: heldByUserId, holdExpiresAt
- ✅ Confirmation tracking: confirmedByUserId
- ✅ Check-in/out tracking: checkedInAt, checkedOutAt
- ✅ Timestamps: createdAt, updatedAt
- ✅ Relations: dinner, heldByUser, confirmedByUser

#### New SeatStatus Enum:
- ✅ AVAILABLE, HELD, CONFIRMED, ATTENDED, COMPLETED
- ✅ CANCELLED, EXPIRED, NO_SHOW, LEFT_EARLY

#### User Model Updates:
- ✅ Added `heldSeats` relation
- ✅ Added `confirmedSeats` relation

#### Indexes:
- ✅ Seat(dinnerId, status) - for filtering seats by dinner and status
- ✅ Seat(heldByUserId) - for finding user's held seats
- ✅ Seat(confirmedByUserId) - for finding user's confirmed seats

### 2. Seat Repository
**File:** `packages/db/src/repositories/seat.repository.ts`

#### Query Methods:
- ✅ `findById()` - Get seat by ID
- ✅ `findByIdWithUser()` - Get seat with user details
- ✅ `findByDinner()` - Get all seats for a dinner
- ✅ `findByDinnerWithStatus()` - Filter seats by status
- ✅ `findByUser()` - Get user's seats (held or confirmed)
- ✅ `countByDinnerAndStatus()` - Count seats by status

#### Lifecycle Methods:
- ✅ `holdSeat()` - Hold a seat with expiration (default 15 min)
- ✅ `confirmSeat()` - Confirm a held seat
- ✅ `releaseSeat()` - Release seat back to available
- ✅ `cancelSeat()` - Cancel a reservation

#### Check-in/Check-out Methods:
- ✅ `checkIn()` - Mark diner as attended
- ✅ `checkOut()` - Mark diner as completed
- ✅ `markNoShow()` - Mark as no-show
- ✅ `markLeftEarly()` - Mark as left early

#### Maintenance Methods:
- ✅ `expireHolds()` - Expire all holds past expiration time
- ✅ `releaseAllSeatsForDinner()` - Cancel all seats for a dinner

#### Validation:
- ✅ Status checks before state transitions
- ✅ User ownership validation for confirmations
- ✅ Error messages for invalid operations

### 3. Updated Dinner Repository
**File:** `packages/db/src/repositories/dinner.repository.ts`

#### Updated Methods:
- ✅ `create()` - Now creates seats automatically based on seatCount
- ✅ `cancelDinner()` - Now cancels all held/confirmed seats
- ✅ All query methods updated to use `startsAt` instead of `scheduledAt`

### 4. Zod Validation Schemas

#### Dinner Schemas
**File:** `packages/shared/src/schemas/dinner.schema.ts`
- ✅ `createDinnerSchema` - Validates startsAt, endsAt, seatCount
- ✅ `updateDinnerSchema` - Validates updates
- ✅ `dinnerStatusSchema` - Enum validation
- ✅ Custom validation: endsAt must be after startsAt
- ✅ Custom validation: startsAt must be in future

#### Seat Schemas
**File:** `packages/shared/src/schemas/seat.schema.ts`
- ✅ `seatStatusSchema` - Enum validation
- ✅ `holdSeatSchema` - Validates hold requests
- ✅ `confirmSeatSchema` - Validates confirmations
- ✅ `releaseSeatSchema` - Validates releases
- ✅ `checkInSchema` / `checkOutSchema` - Validates check-in/out

### 5. Repository Exports
**File:** `packages/db/src/repositories/index.ts`
- ✅ Exported `SeatRepository` class
- ✅ Exported `seatRepository` instance
- ✅ Exported `SeatWithUser` type

**File:** `packages/shared/src/schemas/index.ts`
- ✅ Exported all dinner schemas
- ✅ Exported all seat schemas

### 6. Updated Seed Script
**File:** `seed-dinners.ts`
- ✅ Updated to use `startsAt` and `endsAt`
- ✅ Updated to use `seatCount`
- ✅ Automatically creates seats for each dinner
- ✅ Creates 5 sample dinners with varying seat counts

### 7. Documentation
**Files:**
- ✅ `EPIC_3.1_MIGRATION_GUIDE.md` - Complete migration instructions
- ✅ `EPIC_3.1_COMPLETE.md` - This summary document

## Migration Required

⚠️ **IMPORTANT:** This is a breaking change that requires database migration.

### Quick Migration Steps:
```powershell
# 1. Stop dev server (Ctrl+C)

# 2. Apply schema changes
cd prisma
npx prisma db push

# 3. Generate Prisma client
npx prisma generate

# 4. Clear old data
psql -U postgres -d dinewithme -c 'DELETE FROM dinners;'

# 5. Seed new data
cd ..
npx tsx seed-dinners.ts

# 6. Restart dev server
cd apps/web
npm run dev
```

See `EPIC_3.1_MIGRATION_GUIDE.md` for detailed instructions.

## Breaking Changes

### Schema Changes:
- `Dinner.scheduledAt` → `Dinner.startsAt`
- `Dinner.totalSeats` → `Dinner.seatCount`
- `Dinner.filledSeats` removed (calculate from Seat records)
- Added `Dinner.endsAt` (required field)

### Code Updates Needed:
1. ✅ Dinner repository updated
2. ✅ Seed script updated
3. ⚠️ Admin UI needs updates (next step)
4. ⚠️ API endpoints need updates (next step)

## What's NOT Included (Future EPICs)

This EPIC focused on schema and repository layer only. NOT included:
- ❌ UI for seat reservation flow
- ❌ Payment integration
- ❌ Automated hold expiration job
- ❌ Real-time seat availability updates
- ❌ Waitlist functionality
- ❌ Diner check-in/check-out UI
- ❌ Email notifications

## Testing the Changes

### 1. Verify Schema:
```powershell
psql -U postgres -d dinewithme -c "\d dinners"
psql -U postgres -d dinewithme -c "\d seats"
```

### 2. Check Seed Data:
```powershell
# View dinners
psql -U postgres -d dinewithme -c "SELECT id, theme, \"startsAt\", \"endsAt\", \"seatCount\", status FROM dinners;"

# View seats grouped by dinner
psql -U postgres -d dinewithme -c "SELECT \"dinnerId\", status, COUNT(*) FROM seats GROUP BY \"dinnerId\", status;"
```

### 3. Test Repository Methods:
```typescript
import { seatRepository } from "@dinewithme/db";

// Hold a seat
const seat = await seatRepository.holdSeat(seatId, userId, 15);

// Confirm the hold
const confirmed = await seatRepository.confirmSeat(seatId, userId);

// Check in
const attended = await seatRepository.checkIn(seatId);

// Check out
const completed = await seatRepository.checkOut(seatId);
```

## Next Steps

### Immediate (Update Existing UI):
1. Update admin dinners dashboard to use new schema
2. Update dinner creation form to include endsAt
3. Update dinner display to show seat counts from Seat records

### Future EPICs:
1. EPIC 3.2: Diner seat reservation flow
2. EPIC 3.3: Payment integration for seat confirmation
3. EPIC 3.4: Automated hold expiration job
4. EPIC 3.5: Check-in/check-out UI for restaurant admins
5. EPIC 3.6: Real-time seat availability

## Files Changed

### Schema & Database:
- `prisma/schema.prisma` - Updated Dinner model, added Seat model

### Repositories:
- `packages/db/src/repositories/seat.repository.ts` - NEW
- `packages/db/src/repositories/dinner.repository.ts` - UPDATED
- `packages/db/src/repositories/index.ts` - UPDATED

### Validation:
- `packages/shared/src/schemas/dinner.schema.ts` - NEW
- `packages/shared/src/schemas/seat.schema.ts` - NEW
- `packages/shared/src/schemas/index.ts` - UPDATED

### Scripts:
- `seed-dinners.ts` - UPDATED

### Documentation:
- `EPIC_3.1_MIGRATION_GUIDE.md` - NEW
- `EPIC_3.1_COMPLETE.md` - NEW

## Success Criteria ✅

- ✅ Prisma schema updated with Dinner and Seat models
- ✅ SeatStatus enum with all lifecycle states
- ✅ Seat repository with full lifecycle methods
- ✅ Dinner repository updated to create seats automatically
- ✅ Zod schemas for validation
- ✅ Proper indexes for performance
- ✅ Seed script updated
- ✅ Documentation complete

## Status: READY FOR MIGRATION

All code is complete. Run the migration steps to apply changes to your database.
