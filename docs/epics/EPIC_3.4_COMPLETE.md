# EPIC 3.4: Seat Confirmation Endpoint - COMPLETE ✅

## What Was Built

### 1. Enhanced Repository Method
**File:** `packages/db/src/repositories/seat.repository.ts`

#### Updated Method: `confirmSeat()`
```typescript
async confirmSeat(seatId: string, userId: string): Promise<Seat>
```

**Enhancements:**
- ✅ Added expiration check (`holdExpiresAt <= now`)
- ✅ Validates seat is HELD
- ✅ Validates user owns the hold
- ✅ Clears hold fields on confirmation
- ✅ Sets confirmedByUserId

**Validation Rules:**
1. Seat must exist
2. Seat status must be HELD
3. heldByUserId must match current user
4. holdExpiresAt must be in the future
5. On success: status → CONFIRMED, clear hold fields

### 2. API Endpoint
**File:** `apps/web/src/app/api/seats/confirm/route.ts`

#### POST /api/seats/confirm

**Request Body:**
```json
{
  "seatId": "cmm7xxx..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "seatId": "cmm7xxx...",
    "dinnerId": "cmm7xxx...",
    "status": "CONFIRMED",
    "confirmedAt": "2026-03-01T15:30:00.000Z",
    "message": "Seat confirmed successfully"
  }
}
```

**Response (Error - Expired Hold):**
```json
{
  "success": false,
  "error": {
    "message": "Seat hold has expired",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Response (Error - Wrong User):**
```json
{
  "success": false,
  "error": {
    "message": "Seat is held by a different user",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Response (Error - Not Held):**
```json
{
  "success": false,
  "error": {
    "message": "Seat is not held. Current status: AVAILABLE",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Features:**
- ✅ Clerk authentication required
- ✅ Zod validation for request body
- ✅ Analytics events emitted
- ✅ Audit logging
- ✅ Proper error handling
- ✅ User ownership validation

### 3. Analytics Events
**File:** `packages/analytics/src/events.ts`

#### New Events:
- ✅ `SEAT_CONFIRM_REQUESTED` - When user initiates confirmation
- ✅ `SEAT_CONFIRMED` - When seat is successfully confirmed
- ✅ `SEAT_CONFIRM_FAILED` - When confirmation fails (with reason)

**Event Payloads:**
```typescript
interface SeatConfirmRequestedEvent {
  userId: string;
  seatId: string;
  dinnerId: string;
  timestamp: string;
}

interface SeatConfirmedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  timestamp: string;
}

interface SeatConfirmFailedEvent {
  userId: string;
  seatId: string;
  reason: string;
  timestamp: string;
}
```

### 4. Validation Schema
**File:** `packages/shared/src/schemas/seat.schema.ts`

#### Updated Schema: `confirmSeatSchema`
```typescript
export const confirmSeatSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
});
```

**Note:** userId is extracted from authentication, not from request body.

### 5. Test Script
**File:** `test-seat-confirm.ts`

#### Test Scenarios:
1. ✅ Successful confirmation
2. ✅ Expired hold detection
3. ✅ Wrong user prevention
4. ✅ Already confirmed detection
5. ✅ Seat not held detection

**Run Tests:**
```powershell
npx tsx test-seat-confirm.ts
```

## Seat Lifecycle Flow

```
AVAILABLE
    ↓ holdSeat()
HELD (with expiration)
    ↓ confirmSeat() [this EPIC]
CONFIRMED
    ↓ checkIn() [future]
ATTENDED
    ↓ checkOut() [future]
COMPLETED
```

## API Usage Examples

### Confirm a Held Seat

```typescript
// 1. First, hold a seat
const holdResponse = await fetch("/api/seats/hold", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    dinnerId: "cmm7xxx...",
    holdDurationMinutes: 10
  })
});

const holdData = await holdResponse.json();
const seatId = holdData.data.seatId;

// 2. Then, confirm the seat (simulating payment completion)
const confirmResponse = await fetch("/api/seats/confirm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    seatId: seatId
  })
});

const confirmData = await confirmResponse.json();

if (confirmData.success) {
  console.log("Seat confirmed:", confirmData.data.seatId);
  console.log("Status:", confirmData.data.status); // "CONFIRMED"
} else {
  console.error("Failed:", confirmData.error.message);
}
```

### Error Scenarios

#### 1. Expired Hold
```typescript
// Hold expires after 10 minutes
// If you try to confirm after expiration:
{
  "success": false,
  "error": {
    "message": "Seat hold has expired",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Hold a new seat

#### 2. Wrong User
```typescript
// User A holds a seat
// User B tries to confirm it:
{
  "success": false,
  "error": {
    "message": "Seat is held by a different user",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Each user can only confirm their own holds

#### 3. Seat Not Held
```typescript
// Trying to confirm an AVAILABLE seat:
{
  "success": false,
  "error": {
    "message": "Seat is not held. Current status: AVAILABLE",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Hold the seat first

#### 4. Already Confirmed
```typescript
// Trying to confirm a CONFIRMED seat:
{
  "success": false,
  "error": {
    "message": "Seat is not held. Current status: CONFIRMED",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Seat is already confirmed, no action needed

## Testing

### Manual Testing

1. **Hold a seat:**
   ```bash
   curl -X POST http://localhost:3001/api/seats/hold \
     -H "Content-Type: application/json" \
     -d '{"dinnerId": "YOUR_DINNER_ID"}'
   ```

2. **Confirm the seat:**
   ```bash
   curl -X POST http://localhost:3001/api/seats/confirm \
     -H "Content-Type: application/json" \
     -d '{"seatId": "YOUR_SEAT_ID"}'
   ```

3. **Verify in database:**
   ```sql
   SELECT id, status, "heldByUserId", "confirmedByUserId", "holdExpiresAt"
   FROM seats
   WHERE id = 'YOUR_SEAT_ID';
   ```

### Automated Testing

```powershell
# Run test script
npx tsx test-seat-confirm.ts
```

Expected output:
```
✅ Test 1: Successful confirmation
✅ Test 2: Expired hold detection
✅ Test 3: Wrong user prevention
✅ Test 4: Already confirmed detection
✅ Test 5: Seat not held detection
```

### Browser Console Testing

```javascript
// 1. Hold a seat
const holdRes = await fetch("/api/seats/hold", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ dinnerId: "YOUR_DINNER_ID" })
});
const holdData = await holdRes.json();
console.log("Held:", holdData);

// 2. Confirm the seat
const confirmRes = await fetch("/api/seats/confirm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ seatId: holdData.data.seatId })
});
const confirmData = await confirmRes.json();
console.log("Confirmed:", confirmData);
```

## Database Changes

### Seat Status Transition

**Before:**
```sql
SELECT status, "heldByUserId", "confirmedByUserId", "holdExpiresAt"
FROM seats WHERE id = 'xxx';

-- Result:
-- status: HELD
-- heldByUserId: user_id
-- confirmedByUserId: null
-- holdExpiresAt: 2026-03-01T15:30:00Z
```

**After Confirmation:**
```sql
SELECT status, "heldByUserId", "confirmedByUserId", "holdExpiresAt"
FROM seats WHERE id = 'xxx';

-- Result:
-- status: CONFIRMED
-- heldByUserId: user_id (unchanged)
-- confirmedByUserId: user_id
-- holdExpiresAt: null (cleared)
```

### Query Confirmed Seats

```sql
-- Get all confirmed seats for a dinner
SELECT 
  s.id,
  s.status,
  u.email AS confirmed_by,
  s."updatedAt" AS confirmed_at
FROM seats s
JOIN users u ON s."confirmedByUserId" = u.id
WHERE s."dinnerId" = 'YOUR_DINNER_ID'
  AND s.status = 'CONFIRMED'
ORDER BY s."updatedAt" DESC;
```

## Analytics & Monitoring

### Key Metrics

1. **Confirmation Rate**
   - `SEAT_CONFIRMED` / `SEAT_HELD_SUCCESS`
   - Should be >80% for healthy system

2. **Confirmation Failure Reasons**
   - Track `SEAT_CONFIRM_FAILED` events
   - Group by reason
   - Common reasons:
     - "Seat hold has expired" - Users taking too long
     - "Seat is held by a different user" - Bug or attack
     - "Seat is not held" - Race condition or bug

3. **Time to Confirm**
   - Time between `SEAT_HELD_SUCCESS` and `SEAT_CONFIRMED`
   - Should be < 5 minutes on average

### Analytics Queries

```typescript
// Get confirmation rate
const held = await track.count(AnalyticsEvents.SEAT_HELD_SUCCESS);
const confirmed = await track.count(AnalyticsEvents.SEAT_CONFIRMED);
const confirmationRate = (confirmed / held) * 100;

console.log(`Confirmation rate: ${confirmationRate.toFixed(2)}%`);

// Get failure reasons
const failures = await track.query(AnalyticsEvents.SEAT_CONFIRM_FAILED);
const reasonCounts = failures.reduce((acc, event) => {
  acc[event.reason] = (acc[event.reason] || 0) + 1;
  return acc;
}, {});

console.log("Failure reasons:", reasonCounts);
```

### Database Queries

```sql
-- Confirmation rate by dinner
SELECT 
  d.theme,
  COUNT(CASE WHEN s.status = 'CONFIRMED' THEN 1 END) AS confirmed,
  COUNT(CASE WHEN s.status = 'HELD' THEN 1 END) AS held,
  COUNT(CASE WHEN s.status = 'AVAILABLE' THEN 1 END) AS available,
  d."seatCount" AS total
FROM dinners d
LEFT JOIN seats s ON d.id = s."dinnerId"
WHERE d.status = 'SCHEDULED'
GROUP BY d.id, d.theme, d."seatCount"
ORDER BY d."startsAt" ASC;
```

## Payment Integration (Future)

This endpoint simulates payment completion. In production:

1. **Add payment provider (Stripe):**
   ```typescript
   // Create PaymentIntent
   const paymentIntent = await stripe.paymentIntents.create({
     amount: dinnerPrice * 100,
     currency: "usd",
     metadata: { seatId, dinnerId, userId }
   });
   ```

2. **Confirm seat after payment:**
   ```typescript
   // In webhook handler
   if (paymentIntent.status === "succeeded") {
     await seatRepository.confirmSeat(seatId, userId);
   }
   ```

3. **Handle payment failures:**
   ```typescript
   if (paymentIntent.status === "failed") {
     // Release the seat
     await seatRepository.releaseSeat(seatId);
   }
   ```

## Security Considerations

### User Ownership Validation

✅ **Implemented:**
- User can only confirm seats they hold
- Checked via `heldByUserId === userId`
- Prevents seat stealing

### Expiration Validation

✅ **Implemented:**
- Hold must not be expired
- Checked via `holdExpiresAt > now`
- Prevents confirming expired holds

### Status Validation

✅ **Implemented:**
- Seat must be in HELD status
- Prevents confirming available/confirmed seats
- Ensures proper state machine

## Files Changed

### New Files:
- `apps/web/src/app/api/seats/confirm/route.ts` - Confirmation endpoint
- `test-seat-confirm.ts` - Test script
- `EPIC_3.4_COMPLETE.md` - This document

### Modified Files:
- `packages/db/src/repositories/seat.repository.ts` - Added expiration check
- `packages/analytics/src/events.ts` - Added confirmation events
- `packages/shared/src/schemas/seat.schema.ts` - Updated confirmSeatSchema

## Success Criteria ✅

- ✅ POST /api/seats/confirm endpoint implemented
- ✅ Validates seat is HELD
- ✅ Validates user owns the hold
- ✅ Validates hold not expired
- ✅ Sets status to CONFIRMED
- ✅ Clears hold fields
- ✅ Analytics events emitted
- ✅ Audit logging implemented
- ✅ Test script created
- ✅ Error handling for all failure paths
- ✅ Documentation complete

## Status: ✅ COMPLETE & TESTED

The seat confirmation endpoint is complete and all tests have passed successfully.

### Test Results

```powershell
npx tsx test-seat-confirm.ts
```

**Output:**
```
✅ Found dinner: Italian Night
   Available seats: 3

✅ Found test users: luupetros@gmail.com, testuser@example.com

Test 1: Successful confirmation
-----------------------------------
✅ Held seat: cmm7ir2x...
✅ Confirmed seat: cmm7ir2x...
   Status: CONFIRMED
   Confirmed by: luupetros@gmail.com

Test 2: Expired hold
-----------------------------------
✅ Created expired hold: cmm7ir2x...
✅ Correctly detected expired hold

Test 3: Wrong user trying to confirm
-----------------------------------
✅ Held seat for user1: cmm7ir2x...
✅ Correctly prevented user2 from confirming user1's seat

Test 4: Already confirmed seat
-----------------------------------
✅ Found confirmed seat: cmm7ir2x...
✅ Correctly detected seat is not HELD

Test 5: Seat not held
-----------------------------------
✅ Found available seat: cmm7ir2x...
✅ Correctly detected seat is not HELD

============================================================
Test Summary:
============================================================
✅ Test 1: Successful confirmation
✅ Test 2: Expired hold detection
✅ Test 3: Wrong user prevention
✅ Test 4: Already confirmed detection
✅ Test 5: Seat not held detection
============================================================
```

All validation rules working correctly:
- ✅ Seat must be HELD
- ✅ User must own the hold
- ✅ Hold must not be expired
- ✅ Status transitions correctly
- ✅ Hold fields cleared on confirmation

## Quick Test

```powershell
# 1. Run test script
npx tsx test-seat-confirm.ts

# 2. Test via API (in browser console)
# Hold a seat
const hold = await fetch("/api/seats/hold", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ dinnerId: "YOUR_DINNER_ID" })
}).then(r => r.json());

# Confirm the seat
const confirm = await fetch("/api/seats/confirm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ seatId: hold.data.seatId })
}).then(r => r.json());

console.log(confirm);
```

## Next Steps

- EPIC 3.5: Seat release endpoint (cancel reservation)
- EPIC 3.6: Check-in/check-out endpoints
- EPIC 3.7: Payment integration (Stripe)
- EPIC 3.8: Email notifications
