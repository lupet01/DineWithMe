# EPIC 3.5: Seat Cancellation Policy - ✅ COMPLETE & TESTED

## What Was Built

### 1. Policy Configuration
**File:** `packages/config/src/seat-policy.ts`

#### Configuration Object: `seatCancellationPolicy`
```typescript
export const seatCancellationPolicy = {
  cutoffHours: 6,                      // Cancel at least 6 hours before dinner
  autoReleaseCancelledSeats: true,     // Seat becomes AVAILABLE
  retainConfirmedUserOnCancel: true,   // Keep confirmedByUserId for audit
} as const;
```

#### Helper Functions:
- `isCancellationAllowed(dinnerStartsAt, now?)` - Check if cancellation is allowed
- `getCancellationDeadline(dinnerStartsAt)` - Get the cancellation deadline

**Policy Rules:**
- ✅ Must cancel at least 6 hours before dinner starts (configurable)
- ✅ Cannot cancel after dinner has started
- ✅ Cancelled seats become AVAILABLE for rebooking (configurable)
- ✅ User ID retained for audit trail (configurable)

### 2. Repository Method
**File:** `packages/db/src/repositories/seat.repository.ts`

#### Method: `cancelSeat()`
```typescript
async cancelSeat(seatId: string, userId: string): Promise<{
  seat: Seat;
  policyResult: { allowed: boolean; reason?: string; hoursUntilDinner?: number };
}>
```

**Validations:**
1. ✅ Seat exists
2. ✅ Seat status is CONFIRMED
3. ✅ User owns the confirmation
4. ✅ Cancellation is within policy (hours before dinner)

**Behavior:**
- Checks policy using `isCancellationAllowed()`
- Sets status to AVAILABLE (if `autoReleaseCancelledSeats: true`)
- Sets status to CANCELLED (if `autoReleaseCancelledSeats: false`)
- Retains `confirmedByUserId` (if `retainConfirmedUserOnCancel: true`)
- Clears `confirmedByUserId` (if `retainConfirmedUserOnCancel: false`)
- Clears `heldByUserId` and `holdExpiresAt` if releasing

### 3. API Endpoint
**File:** `apps/web/src/app/api/seats/cancel/route.ts`

#### POST /api/seats/cancel

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
    "status": "AVAILABLE",
    "message": "Seat cancelled successfully",
    "hoursUntilDinner": 12.5
  }
}
```

**Response (Error - After Cutoff):**
```json
{
  "success": false,
  "error": {
    "message": "Cancellation cutoff has passed. Must cancel at least 6 hours before dinner starts",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Response (Error - Dinner Started):**
```json
{
  "success": false,
  "error": {
    "message": "Dinner has already started or passed",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Response (Error - Wrong User):**
```json
{
  "success": false,
  "error": {
    "message": "Seat is confirmed by a different user",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Features:**
- ✅ Clerk authentication required
- ✅ Zod validation for request body
- ✅ Policy enforcement
- ✅ Analytics events emitted
- ✅ Audit logging
- ✅ Proper error handling

### 4. Analytics Events
**File:** `packages/analytics/src/events.ts`

#### New Events:
- ✅ `SEAT_CANCEL_REQUESTED` - When user initiates cancellation
- ✅ `SEAT_CANCELLED` - When seat is successfully cancelled
- ✅ `SEAT_CANCEL_DENIED` - When cancellation is denied by policy

**Event Payloads:**
```typescript
interface SeatCancelRequestedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  hoursUntilDinner: number;
  timestamp: string;
}

interface SeatCancelledEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  hoursUntilDinner: number;
  timestamp: string;
}

interface SeatCancelDeniedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  reason: string;
  hoursUntilDinner: number;
  timestamp: string;
}
```

### 5. Validation Schema
**File:** `packages/shared/src/schemas/seat.schema.ts`

#### Schema: `cancelSeatSchema`
```typescript
export const cancelSeatSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
});
```

### 6. Audit Logging
**File:** `packages/db/src/utils/audit-logger.ts`

#### Method: `seatCancelled()`
```typescript
async seatCancelled(
  actorUserId: string,
  seatId: string,
  dinnerId: string,
  metadata?: Record<string, any>
): Promise<void>
```

Logs all seat cancellations with actor, seat, dinner, and optional metadata.

### 7. Test Script
**File:** `test-seat-cancel.ts`

#### Test Scenarios:
1. ✅ Successful cancellation (within policy)
2. ✅ Denied cancellation (after cutoff)
3. ✅ Denied cancellation (dinner already started)
4. ✅ Wrong user trying to cancel
5. ✅ Seat not confirmed

**Run Tests:**
```powershell
npx tsx test-seat-cancel.ts
```

## Seat Lifecycle Flow

```
AVAILABLE
    ↓ holdSeat()
HELD (with expiration)
    ↓ confirmSeat()
CONFIRMED
    ↓ cancelSeat() [this EPIC]
AVAILABLE (if within policy)
    OR
CANCELLED (if policy denies)
```

## Policy Configuration

### Default Settings

```typescript
{
  cutoffHours: 6,                      // 6 hours before dinner
  autoReleaseCancelledSeats: true,     // Seat becomes AVAILABLE
  retainConfirmedUserOnCancel: true,   // Keep user ID for audit
}
```

### Customization

To change the policy, edit `packages/config/src/seat-policy.ts`:

```typescript
export const seatCancellationPolicy = {
  cutoffHours: 24,                     // 24 hours before dinner
  autoReleaseCancelledSeats: false,    // Keep as CANCELLED
  retainConfirmedUserOnCancel: false,  // Clear user ID
} as const;
```

### Policy Examples

**Scenario 1: Dinner at 7:00 PM, Cutoff 6 hours**
- Cancellation deadline: 1:00 PM same day
- Can cancel: Before 1:00 PM ✅
- Cannot cancel: After 1:00 PM ❌

**Scenario 2: Dinner at 12:00 PM, Cutoff 6 hours**
- Cancellation deadline: 6:00 AM same day
- Can cancel: Before 6:00 AM ✅
- Cannot cancel: After 6:00 AM ❌

**Scenario 3: Dinner already started**
- Cannot cancel: Dinner has started ❌

## API Usage Examples

### Cancel a Confirmed Seat

```typescript
// 1. First, confirm a seat
const confirmResponse = await fetch("/api/seats/confirm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    seatId: "cmm7xxx..."
  })
});

// 2. Later, cancel the seat (if within policy)
const cancelResponse = await fetch("/api/seats/cancel", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    seatId: "cmm7xxx..."
  })
});

const cancelData = await cancelResponse.json();

if (cancelData.success) {
  console.log("Seat cancelled:", cancelData.data.seatId);
  console.log("Status:", cancelData.data.status); // "AVAILABLE"
  console.log("Hours until dinner:", cancelData.data.hoursUntilDinner);
} else {
  console.error("Failed:", cancelData.error.message);
}
```

### Check Cancellation Policy

```typescript
import { isCancellationAllowed, getCancellationDeadline } from "@dinewithme/config";

// Check if cancellation is allowed
const dinnerStartsAt = new Date("2026-03-01T19:00:00");
const policyCheck = isCancellationAllowed(dinnerStartsAt);

if (policyCheck.allowed) {
  console.log("Cancellation allowed");
  console.log("Hours until dinner:", policyCheck.hoursUntilDinner);
} else {
  console.log("Cancellation denied:", policyCheck.reason);
}

// Get cancellation deadline
const deadline = getCancellationDeadline(dinnerStartsAt);
console.log("Must cancel before:", deadline.toLocaleString());
```

## Error Scenarios

### 1. After Cutoff
```json
{
  "success": false,
  "error": {
    "message": "Cancellation cutoff has passed. Must cancel at least 6 hours before dinner starts",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Cancellation window has closed. Contact support for special cases.

### 2. Dinner Already Started
```json
{
  "success": false,
  "error": {
    "message": "Dinner has already started or passed",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Cannot cancel past dinners.

### 3. Wrong User
```json
{
  "success": false,
  "error": {
    "message": "Seat is confirmed by a different user",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Each user can only cancel their own seats.

### 4. Seat Not Confirmed
```json
{
  "success": false,
  "error": {
    "message": "Seat is not confirmed. Current status: AVAILABLE",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Only confirmed seats can be cancelled.

## Testing

### Test Results

All tests passed successfully:

```
✅ Test 1: Successful cancellation (within policy)
✅ Test 2: Denied cancellation (after cutoff)
✅ Test 3: Denied cancellation (dinner started)
✅ Test 4: Wrong user prevention
✅ Test 5: Seat not confirmed detection
```

### Manual Testing

1. **Confirm a seat:**
   ```bash
   curl -X POST http://localhost:3001/api/seats/confirm \
     -H "Content-Type: application/json" \
     -d '{"seatId": "YOUR_SEAT_ID"}'
   ```

2. **Cancel the seat:**
   ```bash
   curl -X POST http://localhost:3001/api/seats/cancel \
     -H "Content-Type: application/json" \
     -d '{"seatId": "YOUR_SEAT_ID"}'
   ```

3. **Verify in database:**
   ```sql
   SELECT id, status, "confirmedByUserId", "updatedAt"
   FROM seats
   WHERE id = 'YOUR_SEAT_ID';
   ```

### Browser Console Testing

```javascript
// 1. Confirm a seat
const confirmRes = await fetch("/api/seats/confirm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ seatId: "YOUR_SEAT_ID" })
});
const confirmData = await confirmRes.json();
console.log("Confirmed:", confirmData);

// 2. Cancel the seat
const cancelRes = await fetch("/api/seats/cancel", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ seatId: confirmData.data.seatId })
});
const cancelData = await cancelRes.json();
console.log("Cancelled:", cancelData);
```

## Database Changes

### Seat Status Transition

**Before Cancellation:**
```sql
SELECT status, "confirmedByUserId", "heldByUserId"
FROM seats WHERE id = 'xxx';

-- Result:
-- status: CONFIRMED
-- confirmedByUserId: user_id
-- heldByUserId: user_id
```

**After Cancellation (autoReleaseCancelledSeats: true):**
```sql
SELECT status, "confirmedByUserId", "heldByUserId"
FROM seats WHERE id = 'xxx';

-- Result:
-- status: AVAILABLE
-- confirmedByUserId: user_id (retained for audit)
-- heldByUserId: null (cleared)
```

**After Cancellation (autoReleaseCancelledSeats: false):**
```sql
SELECT status, "confirmedByUserId", "heldByUserId"
FROM seats WHERE id = 'xxx';

-- Result:
-- status: CANCELLED
-- confirmedByUserId: user_id (retained for audit)
-- heldByUserId: user_id (unchanged)
```

### Query Cancelled Seats

```sql
-- Get all cancelled seats for a dinner
SELECT 
  s.id,
  s.status,
  u.email AS confirmed_by,
  s."updatedAt" AS cancelled_at
FROM seats s
LEFT JOIN users u ON s."confirmedByUserId" = u.id
WHERE s."dinnerId" = 'YOUR_DINNER_ID'
  AND s.status IN ('CANCELLED', 'AVAILABLE')
  AND s."confirmedByUserId" IS NOT NULL
ORDER BY s."updatedAt" DESC;
```

## Analytics & Monitoring

### Key Metrics

1. **Cancellation Rate**
   - `SEAT_CANCELLED` / `SEAT_CONFIRMED`
   - Should be <20% for healthy system

2. **Cancellation Denial Rate**
   - `SEAT_CANCEL_DENIED` / `SEAT_CANCEL_REQUESTED`
   - High rate indicates users trying to cancel too late

3. **Average Hours Until Dinner**
   - Track `hoursUntilDinner` in `SEAT_CANCELLED` events
   - Shows how far in advance users cancel

### Analytics Queries

```typescript
// Get cancellation rate
const confirmed = await track.count(AnalyticsEvents.SEAT_CONFIRMED);
const cancelled = await track.count(AnalyticsEvents.SEAT_CANCELLED);
const cancellationRate = (cancelled / confirmed) * 100;

console.log(`Cancellation rate: ${cancellationRate.toFixed(2)}%`);

// Get denial reasons
const denials = await track.query(AnalyticsEvents.SEAT_CANCEL_DENIED);
const reasonCounts = denials.reduce((acc, event) => {
  acc[event.reason] = (acc[event.reason] || 0) + 1;
  return acc;
}, {});

console.log("Denial reasons:", reasonCounts);
```

### Database Queries

```sql
-- Cancellation rate by dinner
SELECT 
  d.theme,
  COUNT(CASE WHEN s.status = 'CONFIRMED' THEN 1 END) AS confirmed,
  COUNT(CASE WHEN s.status = 'AVAILABLE' AND s."confirmedByUserId" IS NOT NULL THEN 1 END) AS cancelled,
  d."seatCount" AS total
FROM dinners d
LEFT JOIN seats s ON d.id = s."dinnerId"
WHERE d.status = 'SCHEDULED'
GROUP BY d.id, d.theme, d."seatCount"
ORDER BY d."startsAt" ASC;
```

## Refund Logic (Future)

This endpoint does not implement refunds. In production:

1. **Add payment tracking:**
   ```typescript
   // Store payment info when confirming
   await prisma.payment.create({
     data: {
       seatId,
       userId,
       amount: dinnerPrice,
       status: "succeeded",
       stripePaymentIntentId: paymentIntent.id,
     }
   });
   ```

2. **Process refund on cancellation:**
   ```typescript
   // In cancelSeat endpoint
   if (result.seat.status === "AVAILABLE") {
     const payment = await prisma.payment.findFirst({
       where: { seatId: result.seat.id }
     });
     
     if (payment) {
       // Refund via Stripe
       await stripe.refunds.create({
         payment_intent: payment.stripePaymentIntentId,
       });
       
       // Update payment status
       await prisma.payment.update({
         where: { id: payment.id },
         data: { status: "refunded" }
       });
     }
   }
   ```

3. **Partial refunds for late cancellations:**
   ```typescript
   const hoursUntilDinner = result.policyResult.hoursUntilDinner || 0;
   let refundPercentage = 100;
   
   if (hoursUntilDinner < 24) {
     refundPercentage = 50; // 50% refund if < 24 hours
   }
   
   const refundAmount = (payment.amount * refundPercentage) / 100;
   ```

## Security Considerations

### User Ownership Validation

✅ **Implemented:**
- User can only cancel seats they confirmed
- Checked via `confirmedByUserId === userId`
- Prevents cancelling other users' seats

### Policy Enforcement

✅ **Implemented:**
- Cutoff time enforced server-side
- Cannot bypass via client manipulation
- Policy checked in repository layer

### Audit Trail

✅ **Implemented:**
- All cancellations logged to audit_logs table
- Retains confirmedByUserId for accountability
- Tracks who cancelled what and when

## Files Changed

### New Files:
- `packages/config/src/seat-policy.ts` - Policy configuration
- `apps/web/src/app/api/seats/cancel/route.ts` - Cancellation endpoint
- `test-seat-cancel.ts` - Test script
- `EPIC_3.5_COMPLETE.md` - This document

### Modified Files:
- `packages/config/src/index.ts` - Export policy functions
- `packages/db/src/repositories/seat.repository.ts` - Added cancelSeat method
- `packages/analytics/src/events.ts` - Added cancellation events
- `packages/shared/src/schemas/seat.schema.ts` - Added cancelSeatSchema
- `packages/db/src/utils/audit-logger.ts` - Added seatCancelled method

## Success Criteria ✅

- ✅ POST /api/seats/cancel endpoint implemented
- ✅ Policy configuration in packages/config
- ✅ Validates seat is CONFIRMED
- ✅ Validates user owns the confirmation
- ✅ Validates cancellation within policy (6 hours cutoff)
- ✅ Seat becomes AVAILABLE for rebooking (configurable)
- ✅ User ID retained for audit (configurable)
- ✅ Analytics events emitted
- ✅ Audit logging implemented
- ✅ Test script created and passing
- ✅ Error handling for all failure paths
- ✅ Documentation complete

## Status: ✅ COMPLETE & TESTED

The seat cancellation policy is complete and all tests have passed successfully.

### Test Results

```
✅ Test 1: Successful cancellation (within policy)
✅ Test 2: Denied cancellation (after cutoff)
✅ Test 3: Denied cancellation (dinner started)
✅ Test 4: Wrong user prevention
✅ Test 5: Seat not confirmed detection
```

All validation rules working correctly:
- ✅ Seat must be CONFIRMED
- ✅ User must own the confirmation
- ✅ Must be within policy cutoff (6 hours)
- ✅ Cannot cancel after dinner starts
- ✅ Status transitions correctly
- ✅ Seat becomes AVAILABLE for rebooking

## Quick Test

```powershell
# Run test script
npx tsx test-seat-cancel.ts

# Test via API (in browser console)
# 1. Confirm a seat
const confirm = await fetch("/api/seats/confirm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ seatId: "YOUR_SEAT_ID" })
}).then(r => r.json());

# 2. Cancel the seat
const cancel = await fetch("/api/seats/cancel", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ seatId: confirm.data.seatId })
}).then(r => r.json());

console.log(cancel);
```

## Next Steps

- EPIC 3.6: Check-in/check-out endpoints
- EPIC 3.7: Payment integration (Stripe)
- EPIC 3.8: Email notifications
- EPIC 3.9: Refund logic
