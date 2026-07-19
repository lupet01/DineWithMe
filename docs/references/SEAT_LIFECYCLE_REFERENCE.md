# Seat Lifecycle Reference

**Updated for EPIC 7 (Payment System)**: Seats now require payment confirmation before transitioning to CONFIRMED status.

## State Diagram

```
AVAILABLE
    ↓ holdSeat()
HELD (with expiration timer)
    ↓ Payment Flow:
    ↓ 1. Create payment intent
    ↓ 2. Complete payment on Paystack
    ↓ 3. Webhook confirms seat
CONFIRMED
    ↓ checkIn() [diner arrives]
ATTENDED
    ↓ checkOut() [diner leaves]
COMPLETED
```

## Alternative Paths

```
HELD → EXPIRED (automatic, when holdExpiresAt passes)
HELD → AVAILABLE (releaseSeat(), user cancels or payment fails)
CONFIRMED → CANCELLED (cancelSeat(), user cancels with refund)
CONFIRMED → NO_SHOW (markNoShow(), didn't arrive)
ATTENDED → LEFT_EARLY (markLeftEarly(), left before end)
```

## Status Definitions

| Status | Description | Can Transition To |
|--------|-------------|-------------------|
| AVAILABLE | Seat is open for reservation | HELD |
| HELD | Temporarily reserved (10 min default) | CONFIRMED (via payment only), EXPIRED, AVAILABLE |
| CONFIRMED | Reservation confirmed (payment succeeded) | ATTENDED, CANCELLED, NO_SHOW |
| ATTENDED | Diner checked in | COMPLETED, LEFT_EARLY |
| COMPLETED | Diner checked out normally | (final state) |
| CANCELLED | Reservation cancelled by user | (final state) |
| EXPIRED | Hold expired without confirmation | (final state) |
| NO_SHOW | Diner didn't show up | (final state) |
| LEFT_EARLY | Diner left before dinner ended | (final state) |

## Repository Methods

### Reservation Flow (Updated for Payment System)
```typescript
// 1. User selects a seat
const seat = await seatRepository.holdSeat(seatId, userId, 10);
// Status: AVAILABLE → HELD
// holdExpiresAt: now + 10 minutes

// 2. Create payment intent
const paymentIntent = await paymentIntentRepository.createPaymentIntent({
  userId,
  dinnerId: seat.dinnerId,
  seatId: seat.id,
  amount: 7500, // R75.00 in cents
  currency: "ZAR",
  provider: "PAYSTACK",
});
// POST /api/payments/create returns authorization URL

// 3. User completes payment on Paystack
// Paystack sends webhook to /api/payments/webhook

// 4. Webhook automatically confirms seat
const confirmed = await seatRepository.confirmSeat(seatId, userId);
// Status: HELD → CONFIRMED
// confirmedByUserId: userId
// IMPORTANT: This is called by webhook, not directly by user

// 5. User cancels before dinner (with refund if >24h)
const cancelled = await seatRepository.cancelSeat(seatId);
// Status: CONFIRMED → CANCELLED
// Refund processed if eligible
```

### Check-in/Check-out Flow
```typescript
// 1. Diner arrives at restaurant
const attended = await seatRepository.checkIn(seatId);
// Status: CONFIRMED → ATTENDED
// checkedInAt: now

// 2. Diner finishes dinner
const completed = await seatRepository.checkOut(seatId);
// Status: ATTENDED → COMPLETED
// checkedOutAt: now
```

### Edge Cases
```typescript
// Hold expires (automatic via cron job)
const expiredCount = await seatRepository.expireHolds();
// Status: HELD → EXPIRED (for all expired holds)

// Diner doesn't show up
const noShow = await seatRepository.markNoShow(seatId);
// Status: CONFIRMED → NO_SHOW

// Diner leaves early
const leftEarly = await seatRepository.markLeftEarly(seatId);
// Status: ATTENDED → LEFT_EARLY
// checkedOutAt: now

// Release a held seat
const released = await seatRepository.releaseSeat(seatId);
// Status: HELD → AVAILABLE

// Cancel all seats for a dinner
const count = await seatRepository.releaseAllSeatsForDinner(dinnerId);
// Status: HELD/CONFIRMED → CANCELLED (for all seats)
```

## Query Methods

```typescript
// Get all seats for a dinner
const seats = await seatRepository.findByDinner(dinnerId);

// Get available seats
const available = await seatRepository.findByDinnerWithStatus(
  dinnerId,
  "AVAILABLE"
);

// Count confirmed seats
const confirmedCount = await seatRepository.countByDinnerAndStatus(
  dinnerId,
  "CONFIRMED"
);

// Get user's reservations
const userSeats = await seatRepository.findByUser(userId);

// Get seat with user details
const seatWithUser = await seatRepository.findByIdWithUser(seatId);
```

## Validation Rules

### holdSeat()
- ✅ Seat must be AVAILABLE
- ✅ holdDurationMinutes: 1-60 minutes (default: 10)
- ❌ Cannot hold if already HELD, CONFIRMED, etc.

### confirmSeat() - WEBHOOK ONLY
- ✅ Seat must be HELD
- ✅ User must be the one who held it (heldByUserId === userId)
- ✅ **Payment must be SUCCEEDED** (checked in repository)
- ❌ Cannot confirm if not held by this user
- ❌ Cannot confirm without successful payment
- ⚠️ **This method should ONLY be called by payment webhook**

### checkIn()
- ✅ Seat must be CONFIRMED
- ❌ Cannot check in if not confirmed

### checkOut()
- ✅ Seat must be ATTENDED
- ❌ Cannot check out if not attended

## Database Fields

```typescript
interface Seat {
  id: string;                    // Unique identifier
  dinnerId: string;              // Which dinner
  status: SeatStatus;            // Current state
  heldByUserId?: string;         // Who's holding it (if HELD)
  holdExpiresAt?: DateTime;      // When hold expires
  confirmedByUserId?: string;    // Who confirmed it (if CONFIRMED+)
  checkedInAt?: DateTime;        // When checked in
  checkedOutAt?: DateTime;       // When checked out
  createdAt: DateTime;           // When seat was created
  updatedAt: DateTime;           // Last status change
}
```

## Indexes

```prisma
@@index([dinnerId, status])      // Fast filtering by dinner and status
@@index([heldByUserId])          // Fast user lookup for held seats
@@index([confirmedByUserId])     // Fast user lookup for confirmed seats
```

## Common Queries

### Get seat availability for a dinner
```typescript
const availableCount = await seatRepository.countByDinnerAndStatus(
  dinnerId,
  "AVAILABLE"
);
const confirmedCount = await seatRepository.countByDinnerAndStatus(
  dinnerId,
  "CONFIRMED"
);
const totalSeats = dinner.seatCount;
const seatsLeft = availableCount;
```

### Check if user has a reservation
```typescript
const userSeats = await seatRepository.findByUser(userId);
const hasReservation = userSeats.some(
  seat => seat.dinnerId === dinnerId && 
          ["HELD", "CONFIRMED", "ATTENDED"].includes(seat.status)
);
```

### Get all active reservations for a dinner
```typescript
const confirmed = await seatRepository.findByDinnerWithStatus(
  dinnerId,
  "CONFIRMED"
);
const attended = await seatRepository.findByDinnerWithStatus(
  dinnerId,
  "ATTENDED"
);
const activeReservations = [...confirmed, ...attended];
```

## Cron Job (Future Implementation)

```typescript
// Run every minute to expire holds
async function expireHoldsJob() {
  const expiredCount = await seatRepository.expireHolds();
  if (expiredCount > 0) {
    console.log(`Expired ${expiredCount} seat holds`);
  }
}
```

## Analytics Events (Future Implementation)

```typescript
// Track seat lifecycle events
track("seat_held", { seatId, dinnerId, userId });
track("seat_confirmed", { seatId, dinnerId, userId });
track("seat_cancelled", { seatId, dinnerId, userId });
track("seat_checked_in", { seatId, dinnerId, userId });
track("seat_checked_out", { seatId, dinnerId, userId });
track("seat_no_show", { seatId, dinnerId, userId });
track("seat_expired", { seatId, dinnerId });
```

## Error Handling

All methods throw descriptive errors:
```typescript
try {
  await seatRepository.confirmSeat(seatId, userId);
} catch (error) {
  // "Seat not found"
  // "Seat is not held. Current status: AVAILABLE"
  // "Seat is held by a different user"
  // "No payment intent found for this seat. Payment is required to confirm seat."
  // "Payment has not succeeded. Current payment status: CREATED"
}
```

## Payment Integration

### Payment Flow
```typescript
// 1. Hold seat
POST /api/seats/hold
Body: { dinnerId, holdDurationMinutes: 10 }
Response: { seatId, holdExpiresAt }

// 2. Create payment intent
POST /api/payments/create
Body: { seatId }
Response: { authorizationUrl, reference }

// 3. Redirect user to Paystack
window.location.href = authorizationUrl;

// 4. Paystack webhook confirms seat (automatic)
POST /api/payments/webhook (from Paystack)
→ Validates signature
→ Marks payment SUCCEEDED
→ Calls seatRepository.confirmSeat()
→ Seat status: HELD → CONFIRMED

// 5. User sees confirmation
Redirect to /dinner/[id]/confirm?reference=xxx
```

### Direct Confirmation Endpoint (DEPRECATED)
```typescript
// ❌ This endpoint is deprecated as of EPIC 7
POST /api/seats/confirm
Response: 410 Gone - "Direct seat confirmation is no longer supported"

// Use payment flow instead
```

## Best Practices

1. **Always check seat status** before attempting transitions
2. **Use transactions** when updating multiple seats
3. **Run expireHolds()** regularly (cron job)
4. **Track analytics** for all state transitions
5. **Validate user ownership** before confirmations
6. **Handle race conditions** (multiple users trying to hold same seat)
7. **Set reasonable hold durations** (10 min default, max 60 min)
8. **Clean up expired holds** to keep seats available
9. **Never call confirmSeat() directly** - only via payment webhook
10. **Always verify payment status** before confirming seats
11. **Handle payment failures gracefully** - release seat back to AVAILABLE
12. **Implement refund logic** for cancellations (24h cutoff)

## Security Considerations

### Race Conditions
- Multiple users trying to hold the same seat
- Payment webhook arriving before/after hold expiration
- Double confirmation attempts

### Prevention
- Database-level unique constraints
- Optimistic locking with updatedAt checks
- Idempotent webhook processing
- Payment status validation in confirmSeat()

### Webhook Security
- Validate Paystack signature (HMAC SHA512)
- Check payment status before confirming
- Prevent duplicate processing
- Log all webhook events for audit
