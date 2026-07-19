# EPIC 7.4: Refund Logic - Quick Reference

## API Endpoint

```
POST /api/payments/refund
```

## Request

```json
{
  "paymentIntentId": "cm...",
  "reason": "user_cancelled" | "dinner_cancelled"
}
```

## Response (Success)

```json
{
  "success": true,
  "data": {
    "refundId": "cm...",
    "amount": 7500,
    "currency": "ZAR",
    "reason": "user_cancelled"
  }
}
```

## Refund Rules

| Scenario | Refund | Condition |
|----------|--------|-----------|
| User cancels before 24h | ✅ Full refund (R75.00) | >24h before dinner |
| User cancels within 24h | ❌ No refund | <24h before dinner |
| User no-shows | ❌ No refund | Seat status = NO_SHOW |
| Platform cancels dinner | ✅ Full refund | Admin only |

## Helper Functions

### Check Refund Eligibility

```typescript
import { isRefundAllowed } from "@dinewithme/config/src/payment";

const check = isRefundAllowed(dinner.startsAt);
// Returns: { allowed: boolean, reason?: string, hoursUntilDinner?: number }
```

### Process Refund

```typescript
import { createPaystackService } from "@dinewithme/payment";

const paystack = createPaystackService(process.env.PAYSTACK_SECRET_KEY!);

const refundResponse = await paystack.refundTransaction({
  reference: paymentIntent.providerReference,
  amount: paymentIntent.amount, // Full refund
  merchant_note: "Refund: user_cancelled",
  customer_note: "Your payment has been refunded",
});
```

## Analytics Events

### payment_refunded

```typescript
track("payment_refunded", {
  paymentIntentId: string;
  userId: string;
  dinnerId: string;
  seatId: string;
  amount: number;
  currency: string;
  provider: string;
  reason: string;
  timestamp: string;
});
```

### refund_failed

```typescript
track("refund_failed", {
  paymentIntentId: string;
  userId: string;
  dinnerId: string;
  seatId: string;
  amount: number;
  currency: string;
  provider: string;
  reason: string;
  error: string;
  timestamp: string;
});
```

## Error Responses

| Status | Error | Reason |
|--------|-------|--------|
| 401 | Unauthorized | No auth token |
| 403 | Forbidden | Not payment owner or not admin |
| 400 | Invalid status | Payment not SUCCEEDED |
| 400 | Past cutoff | <24h before dinner |
| 400 | No-show | Seat status = NO_SHOW |
| 404 | Not found | Payment or dinner not found |
| 500 | Refund failed | Paystack API error |

## Testing

### Manual Test

```bash
# 1. Create payment
curl -X POST http://localhost:3001/api/payments/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"seatId":"cm..."}'

# 2. Complete payment on Paystack (test card: 4084 0840 8408 4081)

# 3. Request refund
curl -X POST http://localhost:3001/api/payments/refund \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId":"cm...","reason":"user_cancelled"}'
```

### Test Script

```bash
npx tsx test-payment-refund.ts
```

## Status Flow

```
SUCCEEDED → REFUNDED
```

## Configuration

```typescript
// packages/config/src/payment.ts
export const paymentConfig = {
  refund: {
    cutoffHours: 24, // Must match seat cancellation policy
    reasons: {
      USER_CANCELLED: "user_cancelled",
      DINNER_CANCELLED: "dinner_cancelled",
      NO_SHOW: "no_show", // No refund
    },
  },
};
```

## Security

- User cancellation: User must own payment, >24h before dinner
- Platform cancellation: PLATFORM_ADMIN role required
- No refunds for no-shows
- Idempotent (status check prevents double refunds)

## Paystack Integration

- Endpoint: `POST https://api.paystack.co/refund`
- Full refund by default
- Merchant and customer notes included
- Refund appears in Paystack dashboard

---

**Status**: ✅ Complete
**Date**: March 2, 2026
