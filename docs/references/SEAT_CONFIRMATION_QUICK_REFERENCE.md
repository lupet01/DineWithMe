# Seat Confirmation - Quick Reference

## Current Flow (EPIC 7 Integration)

```
AVAILABLE → HELD → PAYMENT → CONFIRMED
```

## API Endpoints

### ✅ Hold Seat
```
POST /api/seats/hold
Body: { dinnerId: string, holdDurationMinutes?: number }
Response: { seatId, holdExpiresAt }
```

### ✅ Create Payment
```
POST /api/payments/create
Body: { seatId: string }
Response: { authorizationUrl, reference }
```

### ✅ Webhook (Automatic)
```
POST /api/payments/webhook
Headers: { x-paystack-signature }
Body: Paystack webhook payload
→ Confirms seat automatically
```

### ❌ Direct Confirmation (DEPRECATED)
```
POST /api/seats/confirm
Status: 410 Gone
Message: "Use payment flow instead"
```

## Repository Method

### confirmSeat()

**Usage**: WEBHOOK ONLY

**Validation**:
- ✅ Seat must be HELD
- ✅ User must own the hold
- ✅ Hold must not be expired
- ✅ **Payment must be SUCCEEDED**

**Errors**:
```typescript
// No payment
"No payment intent found for this seat. Payment is required to confirm seat."

// Payment not succeeded
"Payment has not succeeded. Current payment status: CREATED"
```

## State Transitions

```
AVAILABLE
  ↓ holdSeat()
HELD (10 min hold)
  ↓ Payment Flow:
  ↓ 1. Create payment intent
  ↓ 2. User pays on Paystack
  ↓ 3. Webhook confirms seat
CONFIRMED
  ↓ checkIn()
ATTENDED
  ↓ checkOut()
COMPLETED
```

## Payment Requirement

### Why?
- Ensures all bookings are paid
- Reduces no-shows
- Protects revenue

### How?
- Repository checks PaymentIntent.status
- Must be "SUCCEEDED" before confirmation
- No way to bypass

### When?
- Every seat confirmation
- No exceptions (even for admins)

## Testing

### Test Cards (Paystack)
```
Success: 4084 0840 8408 4081
Failure: 5060 6666 6666 6666 4444
```

### Test Script
```bash
npx tsx test-seat-payment-requirement.ts
```

### Manual Test
```bash
# 1. Hold seat
curl -X POST http://localhost:3001/api/seats/hold \
  -H "Authorization: Bearer <token>" \
  -d '{"dinnerId":"cm...","holdDurationMinutes":10}'

# 2. Create payment
curl -X POST http://localhost:3001/api/payments/create \
  -H "Authorization: Bearer <token>" \
  -d '{"seatId":"cm..."}'

# 3. Complete payment on Paystack

# 4. Verify confirmation
curl http://localhost:3001/api/dinners/cm.../seats \
  -H "Authorization: Bearer <token>"
```

## Common Errors

### "No payment intent found"
**Cause**: Trying to confirm without payment
**Solution**: Create payment intent first

### "Payment has not succeeded"
**Cause**: Payment still pending or failed
**Solution**: Complete payment on Paystack

### "Seat hold has expired"
**Cause**: Took too long to pay
**Solution**: Hold seat again and pay faster

### "410 Gone"
**Cause**: Using deprecated direct confirmation endpoint
**Solution**: Use payment flow instead

## Security

### Race Conditions
- Payment status checked atomically
- Idempotent webhook processing
- Database-level validation

### Double Confirmation
- Payment status prevents duplicates
- Webhook checks existing status
- State machine validates transitions

### Webhook Security
- Signature validation (HMAC SHA512)
- Payment status verification
- Idempotent processing

## Documentation

- `EPIC_3_PAYMENT_INTEGRATION_UPDATE.md` - Complete guide
- `EPIC_3_SEAT_CONFIRMATION_UPDATE_SUMMARY.md` - Summary
- `SEAT_LIFECYCLE_REFERENCE.md` - Full lifecycle
- `EPIC_7_PAYMENT_SUMMARY.md` - Payment system

## Key Points

1. ✅ Seats require payment to confirm
2. ❌ Direct confirmation is deprecated
3. ✅ Webhook confirms automatically
4. ✅ Payment status validated in repository
5. ✅ No way to bypass payment
6. ✅ Race conditions prevented
7. ✅ Double confirmation prevented
8. ✅ Comprehensive error messages

---

**Updated**: March 2, 2026
**Status**: Production Ready
**Breaking Change**: Yes
