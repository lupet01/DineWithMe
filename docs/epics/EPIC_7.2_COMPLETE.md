# EPIC 7.2: Create Payment Intent API - COMPLETE ✅

## Status: COMPLETED

All requirements for EPIC 7.2 have been implemented.

## ✅ Completed Requirements

### 1. Payment Configuration

**File**: `packages/config/src/payment.ts`

Created payment configuration with:
- `commitmentAmount`: 7500 cents (R75.00)
- `currency`: "ZAR"
- `defaultProvider`: "PAYSTACK"
- Helper functions: `getCommitmentAmount()`, `formatAmount()`, `toCents()`, `toRands()`

### 2. Paystack Service

**File**: `packages/payment/src/paystack.ts`

Created `PaystackService` class with methods:

#### `initializeTransaction(params)`
```typescript
await paystack.initializeTransaction({
  email: "user@example.com",
  amount: 7500, // Amount in kobo (cents)
  reference: "payment_intent_id",
  callback_url: "https://app.com/callback",
  metadata: { ... },
});
```

Returns:
- `authorization_url` - URL to redirect user for payment
- `access_code` - Paystack access code
- `reference` - Transaction reference

#### `verifyTransaction(reference)`
```typescript
await paystack.verifyTransaction(reference);
```

Returns transaction details including status (success/failed/abandoned).

#### `verifyWebhookSignature(payload, signature)`
Validates webhook signatures from Paystack.

### 3. API Endpoint

**Endpoint**: `POST /api/payments/create`

**File**: `apps/web/src/app/api/payments/create/route.ts`

**Request Body**:
```json
{
  "seatId": "cm..."
}
```

**Flow**:
1. Validate user is authenticated
2. Get seat and validate it's HELD by current user
3. Check hold hasn't expired
4. Get dinner information
5. Check no existing successful payment for seat
6. Calculate commitment amount (R75.00)
7. Create PaymentIntent with status CREATED
8. Initialize Paystack transaction
9. Store provider reference
10. Emit analytics event
11. Return authorization URL

**Response**:
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "cm...",
    "authorizationUrl": "https://checkout.paystack.com/...",
    "amount": 7500,
    "currency": "ZAR",
    "reference": "cm..."
  }
}
```

**Error Responses**:
- 401: Unauthorized (not authenticated)
- 400: Invalid request (missing seatId, seat not held, hold expired, payment already exists)
- 403: Forbidden (seat held by different user)
- 404: Seat or dinner not found
- 500: Server error (Paystack API error, etc.)

### 4. Analytics Event

**Event**: `payment_intent_created`

**File**: `packages/analytics/src/events.ts`

**Payload**:
```typescript
{
  paymentIntentId: string;
  userId: string;
  dinnerId: string;
  seatId: string;
  amount: number;
  currency: string;
  provider: string;
  restaurantId: string;
  restaurantName: string;
  timestamp: string;
}
```

### 5. Environment Variables

Added to configuration:
- `PAYSTACK_SECRET_KEY` - Paystack secret key (required)
- `PAYSTACK_PUBLIC_KEY` - Paystack public key (for frontend)

## 📁 Files Created

1. `packages/config/src/payment.ts` - Payment configuration
2. `packages/payment/src/paystack.ts` - Paystack service
3. `packages/payment/src/index.ts` - Package exports
4. `packages/payment/package.json` - Package configuration
5. `packages/payment/tsconfig.json` - TypeScript configuration
6. `apps/web/src/app/api/payments/create/route.ts` - API endpoint
7. `test-payment-create.ts` - Test script
8. `EPIC_7.2_COMPLETE.md` - This document

## 📝 Files Modified

1. `packages/analytics/src/events.ts` - Added payment events
2. `packages/config/src/env.ts` - Added Paystack env vars (if needed)

## 🔄 Updated Seat Confirmation Flow

### Old Flow
```
HELD → CONFIRMED
```

### New Flow
```
HELD → PaymentIntent CREATED → SUCCEEDED → CONFIRMED
```

**Critical**: Seat must NOT confirm before webhook success.

## 💳 Payment Flow

### 1. User Holds Seat
```typescript
// User clicks "Book Seat"
const seat = await seatRepository.holdSeatForDinner(userId, dinnerId);
// Status: HELD
// Hold expires in 10 minutes
```

### 2. Create Payment Intent
```typescript
// Frontend calls API
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ seatId: seat.id }),
});

const { data } = await response.json();
// Returns: { paymentIntentId, authorizationUrl, amount, currency, reference }
```

### 3. Redirect to Paystack
```typescript
// Frontend redirects user to Paystack
window.location.href = data.authorizationUrl;
```

### 4. User Completes Payment
- User enters card details on Paystack
- Paystack processes payment
- Paystack redirects to callback URL

### 5. Webhook Confirms Payment (EPIC 7.3)
```typescript
// Paystack sends webhook to /api/payments/webhook
// Webhook handler:
// 1. Verify signature
// 2. Mark payment as SUCCEEDED
// 3. Confirm seat
// 4. Emit analytics
```

### 6. Seat Confirmed
```
Seat status: HELD → CONFIRMED
Payment status: CREATED → SUCCEEDED
```

## 🧪 Testing

### Manual Testing

```bash
# 1. Set environment variables
echo "PAYSTACK_SECRET_KEY=sk_test_your_key" >> .env
echo "PAYSTACK_PUBLIC_KEY=pk_test_your_key" >> .env

# 2. Run test script
npx tsx test-payment-create.ts

# Expected output:
# ✓ Held seat
# ✓ Payment configuration checked
# ✓ API endpoint ready for testing
```

### API Testing

```bash
# 1. Start dev server
npm run dev

# 2. Hold a seat (via UI or API)
curl -X POST http://localhost:3001/api/seats/hold \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"dinnerId":"cm..."}'

# 3. Create payment intent
curl -X POST http://localhost:3001/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"seatId":"cm..."}'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "paymentIntentId": "cm...",
#     "authorizationUrl": "https://checkout.paystack.com/...",
#     "amount": 7500,
#     "currency": "ZAR",
#     "reference": "cm..."
#   }
# }

# 4. Visit authorization URL in browser
# 5. Complete payment with test card
# 6. Verify payment intent status updated
```

### Test Cards (Paystack)

**Success**:
- Card: 4084 0840 8408 4081
- CVV: 408
- Expiry: Any future date
- PIN: 0000

**Failure**:
- Card: 5060 6666 6666 6666
- CVV: 123
- Expiry: Any future date
- PIN: 0000

## 🔒 Security Considerations

### API Endpoint
- Requires authentication (user must be logged in)
- Validates seat ownership (user must hold the seat)
- Validates hold hasn't expired
- Prevents duplicate payments
- Validates dinner exists and is bookable

### Paystack Integration
- Secret key stored in environment variables (never exposed to client)
- Public key can be exposed to client (for frontend integration)
- Webhook signatures verified (EPIC 7.3)
- All amounts in cents to avoid floating point errors

### Payment Intent
- Reference uses our payment intent ID (prevents duplicate processing)
- Metadata includes all relevant IDs for tracking
- Callback URL includes dinner ID for redirect after payment

## 💰 Commitment Amount

**Current**: R75.00 (7500 cents)

**Rationale**:
- High enough to ensure commitment
- Low enough to not be a barrier
- Refundable if cancelled within policy window

**Future Considerations**:
- Dynamic pricing by dinner, theme, or restaurant
- Tiered pricing (e.g., premium themes cost more)
- Early bird discounts
- Loyalty program discounts

## 📊 Analytics

### Tracked Events

**payment_intent_created**:
- When: Payment intent created successfully
- Data: paymentIntentId, userId, dinnerId, seatId, amount, provider, restaurant info

**payment_succeeded** (EPIC 7.3):
- When: Webhook confirms payment success
- Data: paymentIntentId, providerReference, amount

**payment_failed** (EPIC 7.3):
- When: Webhook confirms payment failure
- Data: paymentIntentId, reason

### Metrics to Track

- Payment intent creation rate
- Payment success rate
- Payment failure rate
- Average time to payment
- Drop-off rate (created but not completed)
- Provider performance (Paystack vs Yoco)

## 🚀 Next Steps (EPIC 7.3)

### Webhook Handler
- Create `/api/payments/webhook` endpoint
- Verify Paystack webhook signature
- Handle `charge.success` event
- Mark payment as SUCCEEDED
- Confirm seat
- Handle `charge.failed` event
- Mark payment as FAILED
- Release seat hold

### Frontend Integration
- Payment button component
- Redirect to Paystack
- Handle callback
- Display payment status
- Error handling

## 🎯 Non-Goals (Confirmed)

- ❌ No seat confirmation in this endpoint (happens in webhook)
- ❌ No frontend UI (EPIC 7.4)
- ❌ No webhook handler (EPIC 7.3)
- ❌ No refund processing (EPIC 7.5)
- ❌ No Yoco integration yet (Paystack only for MVP)

## 📚 Paystack Documentation

- **API Docs**: https://paystack.com/docs/api/
- **Test Cards**: https://paystack.com/docs/payments/test-payments/
- **Webhooks**: https://paystack.com/docs/payments/webhooks/
- **Dashboard**: https://dashboard.paystack.com/

## 🔧 Configuration

### Environment Variables

```bash
# .env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Paystack Dashboard Setup

1. Sign up at https://paystack.com/
2. Get API keys from Settings > API Keys & Webhooks
3. Set webhook URL: `https://your-domain.com/api/payments/webhook`
4. Enable events: `charge.success`, `charge.failed`
5. Copy webhook secret for signature verification

## 🎯 Requirements Checklist

- [x] POST /api/payments/create endpoint
- [x] Input: seatId
- [x] Validate seat is HELD by current user
- [x] Calculate commitment amount (7500 cents)
- [x] Create PaymentIntent with status CREATED
- [x] Call Paystack initialize transaction API
- [x] Store providerReference
- [x] Return payment authorization URL
- [x] Emit analytics: payment_intent_created
- [x] No seat confirmation (non-goal)
- [x] Test script provided
- [x] Documentation complete

---

**EPIC 7.2 Status**: ✅ COMPLETE
**Date Completed**: March 2, 2026
**API Endpoint**: POST /api/payments/create
**Payment Provider**: Paystack
**Commitment Amount**: R75.00 (7500 cents)
**Ready for**: EPIC 7.3 (Webhook Handler)

The payment intent creation endpoint is complete and ready for Paystack integration testing.
