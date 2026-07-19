# EPIC 3: Seat Confirmation - Payment Integration Update

## Overview

As of EPIC 7 (Payment System), seat confirmation logic has been updated to require successful payment before seats can be confirmed.

## What Changed

### Before (EPIC 3.4)
```
User Flow:
1. Hold seat → POST /api/seats/hold
2. Confirm seat → POST /api/seats/confirm
3. Seat status: HELD → CONFIRMED
```

### After (EPIC 7.4)
```
User Flow:
1. Hold seat → POST /api/seats/hold
2. Create payment → POST /api/payments/create
3. Complete payment on Paystack
4. Webhook confirms seat → POST /api/payments/webhook
5. Seat status: HELD → CONFIRMED (automatic)
```

## Breaking Changes

### 1. Direct Confirmation Endpoint Deprecated

**Endpoint**: `POST /api/seats/confirm`

**Status**: 410 Gone (Deprecated)

**Response**:
```json
{
  "success": false,
  "error": {
    "message": "Direct seat confirmation is no longer supported. Please use the payment flow.",
    "code": "ENDPOINT_DEPRECATED",
    "details": {
      "reason": "Seats must be confirmed through payment",
      "flow": [
        "1. Hold seat: POST /api/seats/hold",
        "2. Create payment: POST /api/payments/create",
        "3. Complete payment on Paystack",
        "4. Seat confirmed automatically via webhook"
      ]
    }
  }
}
```

### 2. Repository Method Updated

**Method**: `seatRepository.confirmSeat(seatId, userId)`

**New Validation**:
- Checks for PaymentIntent existence
- Validates PaymentIntent.status === "SUCCEEDED"
- Throws error if payment not completed

**Error Messages**:
```typescript
// No payment intent found
"No payment intent found for this seat. Payment is required to confirm seat."

// Payment not succeeded
"Payment has not succeeded. Current payment status: CREATED. Seats can only be confirmed after successful payment."
```

### 3. State Machine Documentation Updated

**File**: `packages/db/src/services/seat-state-machine.ts`

**Comment Added**:
```typescript
/**
 * IMPORTANT: As of EPIC 7 (Payment System):
 * - HELD → CONFIRMED transition requires successful payment
 * - This transition should ONLY happen via payment webhook
 * - Direct confirmation is not allowed
 */
```

## Migration Guide

### For Frontend Developers

#### Old Code (Remove)
```typescript
// ❌ This no longer works
async function confirmSeat(seatId: string) {
  const response = await fetch('/api/seats/confirm', {
    method: 'POST',
    body: JSON.stringify({ seatId }),
  });
  // Returns 410 Gone
}
```

#### New Code (Use)
```typescript
// ✅ Use payment flow
async function confirmSeatWithPayment(seatId: string) {
  // 1. Create payment intent
  const paymentResponse = await fetch('/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatId }),
  });
  
  const { authorizationUrl, reference } = await paymentResponse.json();
  
  // 2. Redirect to Paystack
  window.location.href = authorizationUrl;
  
  // 3. Paystack redirects back to callback URL
  // 4. Webhook confirms seat automatically
  // 5. Show confirmation page
}
```

### For Backend Developers

#### Old Code (Remove)
```typescript
// ❌ Don't call confirmSeat directly
app.post('/api/seats/confirm', async (req, res) => {
  const { seatId } = req.body;
  const seat = await seatRepository.confirmSeat(seatId, userId);
  res.json({ seat });
});
```

#### New Code (Use)
```typescript
// ✅ Only call confirmSeat from webhook
app.post('/api/payments/webhook', async (req, res) => {
  // Validate signature
  const isValid = paystack.verifyWebhookSignature(body, signature);
  if (!isValid) return res.status(401).json({ error: 'Invalid signature' });
  
  // Get payment intent
  const paymentIntent = await paymentIntentRepository.findById(reference);
  
  // Mark payment succeeded
  await paymentIntentRepository.markPaymentSucceeded(paymentIntent.id, reference);
  
  // Confirm seat (this now checks payment status)
  await seatRepository.confirmSeat(paymentIntent.seatId, paymentIntent.userId);
  
  res.json({ success: true });
});
```

## Testing

### Test Payment Flow

```bash
# 1. Hold a seat
curl -X POST http://localhost:3001/api/seats/hold \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dinnerId":"cm...","holdDurationMinutes":10}'

# 2. Create payment intent
curl -X POST http://localhost:3001/api/payments/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"seatId":"cm..."}'

# 3. Complete payment on Paystack (use test card: 4084 0840 8408 4081)

# 4. Webhook confirms seat automatically

# 5. Verify seat is confirmed
curl http://localhost:3001/api/dinners/cm.../seats \
  -H "Authorization: Bearer <token>"
```

### Test Direct Confirmation (Should Fail)

```bash
# This should return 410 Gone
curl -X POST http://localhost:3001/api/seats/confirm \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"seatId":"cm..."}'

# Expected response:
# {
#   "success": false,
#   "error": {
#     "message": "Direct seat confirmation is no longer supported...",
#     "code": "ENDPOINT_DEPRECATED"
#   }
# }
```

### Test Repository Method (Should Fail Without Payment)

```typescript
// This should throw error
try {
  await seatRepository.confirmSeat(seatId, userId);
} catch (error) {
  // Error: "No payment intent found for this seat. Payment is required to confirm seat."
}
```

## Race Condition Prevention

### Scenario 1: Webhook Arrives After Hold Expires

**Problem**: Hold expires before payment webhook arrives

**Solution**:
- Extend hold duration to 10 minutes (was 5 minutes)
- Payment must complete within hold window
- If hold expires, payment still succeeds but seat confirmation fails
- User must contact support for manual resolution

### Scenario 2: Multiple Webhook Deliveries

**Problem**: Paystack sends webhook multiple times

**Solution**:
- Check payment status before processing
- If already SUCCEEDED, return success immediately
- Idempotent processing prevents double confirmation

### Scenario 3: User Tries Direct Confirmation

**Problem**: User calls deprecated endpoint

**Solution**:
- Return 410 Gone with clear error message
- Direct users to payment flow
- No seat status changes

## Rollback Plan

If issues arise, you can temporarily allow direct confirmation:

### 1. Remove Payment Check from Repository

```typescript
// In packages/db/src/repositories/seat.repository.ts
async confirmSeat(seatId: string, userId: string): Promise<Seat> {
  // ... existing validation ...
  
  // TEMPORARILY COMMENT OUT payment check
  // const paymentIntent = await this.prisma.paymentIntent.findUnique({
  //   where: { seatId },
  // });
  // if (!paymentIntent || paymentIntent.status !== "SUCCEEDED") {
  //   throw new Error("Payment required");
  // }
  
  // ... rest of method ...
}
```

### 2. Re-enable Direct Endpoint

```typescript
// In apps/web/src/app/api/seats/confirm/route.ts
// Restore original implementation from EPIC 3.4
```

### 3. Update Documentation

```markdown
# ROLLBACK NOTICE
Direct seat confirmation temporarily re-enabled due to [reason].
Payment integration will be re-applied in [timeframe].
```

## Monitoring

### Key Metrics

- Payment success rate (target: >95%)
- Seat confirmation rate after payment (target: 100%)
- Hold expiration rate (target: <5%)
- Webhook processing time (target: <2s)

### Alerts

**Critical**:
- Payment succeeded but seat not confirmed
- High rate of hold expirations
- Webhook signature validation failures

**Warning**:
- Payment success rate <95%
- Hold expiration rate >5%
- Webhook processing time >2s

## Documentation Updates

### Files Updated

1. `packages/db/src/repositories/seat.repository.ts`
   - Added payment validation to confirmSeat()

2. `apps/web/src/app/api/seats/confirm/route.ts`
   - Deprecated endpoint, returns 410 Gone

3. `packages/db/src/services/seat-state-machine.ts`
   - Updated comments for HELD → CONFIRMED transition

4. `SEAT_LIFECYCLE_REFERENCE.md`
   - Updated flow diagrams
   - Added payment integration section
   - Updated validation rules

5. `EPIC_3_PAYMENT_INTEGRATION_UPDATE.md`
   - This document

### Related Documentation

- `EPIC_7_PAYMENT_SUMMARY.md` - Complete payment system overview
- `EPIC_7.3_COMPLETE.md` - Webhook handler details
- `EPIC_3.4_COMPLETE.md` - Original seat confirmation (deprecated)

## FAQ

### Q: Can I still test seat confirmation without payment?

**A**: No, payment is now required. Use Paystack test cards for testing:
- Success: 4084 0840 8408 4081
- Failure: 5060 6666 6666 6666 4444

### Q: What happens if payment succeeds but seat confirmation fails?

**A**: This is a critical error. The payment is marked SUCCEEDED but the seat remains HELD. Manual intervention is required to either:
1. Manually confirm the seat
2. Refund the payment

This scenario is logged and monitored.

### Q: Can admins bypass payment for testing?

**A**: Not currently. All seat confirmations require payment. For testing, use Paystack test mode with test cards.

### Q: What if a user's hold expires during payment?

**A**: The payment will succeed, but seat confirmation will fail with "Seat hold has expired". The user should contact support for a refund or manual seat confirmation.

### Q: How long do users have to complete payment?

**A**: 10 minutes (hold duration). After that, the hold expires and the seat becomes available again.

## Support

### Common Issues

**Issue**: "No payment intent found for this seat"
**Solution**: User must create payment intent first via POST /api/payments/create

**Issue**: "Payment has not succeeded"
**Solution**: User must complete payment on Paystack. Check payment status in database.

**Issue**: "Seat hold has expired"
**Solution**: User took too long to pay. They must start over (hold seat again).

**Issue**: Direct confirmation returns 410
**Solution**: Expected behavior. Direct users to payment flow.

---

**Status**: ✅ Complete
**Date**: March 2, 2026
**Breaking Change**: Yes
**Migration Required**: Yes
**Rollback Available**: Yes

This update ensures all seat confirmations are tied to successful payments, improving revenue collection and reducing no-shows.
