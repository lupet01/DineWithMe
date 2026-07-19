# EPIC 7.1: Commitment Payment Schema - COMPLETE ✅

## Status: COMPLETED

All requirements for EPIC 7.1 have been implemented.

## ✅ Completed Requirements

### 1. PaymentIntent Model

**File**: `prisma/schema.prisma`

Created `PaymentIntent` model with all required fields:

```prisma
model PaymentIntent {
  id                String          @id @default(cuid())
  userId            String
  dinnerId          String
  seatId            String
  amount            Int             // Amount in cents
  currency          String          @default("ZAR")
  provider          PaymentProvider
  providerReference String?         // Reference from payment provider
  status            PaymentStatus   @default(CREATED)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  dinner Dinner @relation(fields: [dinnerId], references: [id], onDelete: Cascade)
  seat   Seat   @relation(fields: [seatId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([dinnerId])
  @@index([seatId])
  @@index([status])
  @@index([userId, status])
  @@map("payment_intents")
}
```

### 2. Enums

**PaymentProvider**:
```prisma
enum PaymentProvider {
  PAYSTACK
  YOCO
}
```

**PaymentStatus**:
```prisma
enum PaymentStatus {
  CREATED
  REQUIRES_ACTION
  SUCCEEDED
  FAILED
  REFUNDED
}
```

### 3. Relations

**User → PaymentIntent** (one-to-many):
- User can have multiple payment intents
- Cascade delete when user is deleted

**Dinner → PaymentIntent** (one-to-many):
- Dinner can have multiple payment intents
- Cascade delete when dinner is deleted

**Seat → PaymentIntent** (one-to-many):
- Seat can have multiple payment intents (e.g., failed attempts, refunds)
- Cascade delete when seat is deleted

### 4. Indexes

Created indexes for optimal query performance:
- `userId` - Find payments by user
- `dinnerId` - Find payments by dinner
- `seatId` - Find payments by seat
- `status` - Find payments by status
- `userId, status` - Composite index for user-specific status queries

### 5. Database Migration

**Migration Applied**: ✅

```bash
npx prisma db push --schema=./prisma/schema.prisma
```

**Database State**:
- `payment_intents` table created
- All foreign keys established
- All indexes created
- Enums created (PaymentProvider, PaymentStatus)

### 6. Repository Methods

**File**: `packages/db/src/repositories/payment-intent.repository.ts`

#### Core Methods

**`createPaymentIntent(data)`**
```typescript
await paymentIntentRepository.createPaymentIntent({
  userId: "cm...",
  dinnerId: "cm...",
  seatId: "cm...",
  amount: 5000, // R50.00 in cents
  currency: "ZAR",
  provider: "PAYSTACK",
});
```

**`markPaymentSucceeded(id, providerReference?)`**
```typescript
await paymentIntentRepository.markPaymentSucceeded(
  paymentId,
  "paystack_ref_123456"
);
```

**`markPaymentFailed(id)`**
```typescript
await paymentIntentRepository.markPaymentFailed(paymentId);
```

**`refundPayment(id)`**
```typescript
await paymentIntentRepository.refundPayment(paymentId);
// Validates payment status is SUCCEEDED before refunding
```

#### Query Methods

- `findById(id)` - Find payment by ID
- `findByIdWithRelations(id)` - Find with user, dinner, seat relations
- `findMany()` - Find all payments
- `findByUser(userId)` - Find all payments by user
- `findByDinner(dinnerId)` - Find all payments by dinner
- `findBySeat(seatId)` - Find payment by seat
- `findByStatus(status)` - Find payments by status
- `findByUserAndStatus(userId, status)` - Find user payments by status

#### Statistics Methods

**`getUserPaymentStats(userId)`**
```typescript
const stats = await paymentIntentRepository.getUserPaymentStats(userId);
// Returns:
// {
//   totalPayments: 10,
//   succeededPayments: 8,
//   failedPayments: 1,
//   refundedPayments: 1,
//   totalAmountPaid: 40000 // R400.00 in cents
// }
```

**`getDinnerPaymentStats(dinnerId)`**
```typescript
const stats = await paymentIntentRepository.getDinnerPaymentStats(dinnerId);
// Returns:
// {
//   totalPayments: 6,
//   succeededPayments: 6,
//   failedPayments: 0,
//   totalAmountCollected: 30000 // R300.00 in cents
// }
```

### 7. Repository Export

**File**: `packages/db/src/repositories/index.ts`

Exported:
- `paymentIntentRepository` - Repository instance
- `PaymentIntentRepository` - Class export
- `PaymentIntentWithRelations` - Type export

## 📁 Files Created

1. `packages/db/src/repositories/payment-intent.repository.ts` - Payment intent repository
2. `test-payment-intent.ts` - Test script
3. `EPIC_7.1_COMPLETE.md` - This document

## 📝 Files Modified

1. `prisma/schema.prisma` - Added PaymentIntent model and enums
2. `packages/db/src/repositories/index.ts` - Added repository export

## 💰 Payment Flow

### 1. Create Payment Intent
```typescript
// User initiates booking
const paymentIntent = await paymentIntentRepository.createPaymentIntent({
  userId: user.id,
  dinnerId: dinner.id,
  seatId: seat.id,
  amount: 5000, // R50.00 commitment fee
  provider: "PAYSTACK",
});
// Status: CREATED
```

### 2. Process Payment
```typescript
// Send to payment provider (Paystack/Yoco)
// Provider returns reference

// If requires additional action (3D Secure)
await paymentIntentRepository.markPaymentRequiresAction(
  paymentIntent.id,
  providerReference
);
// Status: REQUIRES_ACTION

// If payment succeeds
await paymentIntentRepository.markPaymentSucceeded(
  paymentIntent.id,
  providerReference
);
// Status: SUCCEEDED

// If payment fails
await paymentIntentRepository.markPaymentFailed(paymentIntent.id);
// Status: FAILED
```

### 3. Refund (if needed)
```typescript
// User cancels within refund window
await paymentIntentRepository.refundPayment(paymentIntent.id);
// Status: REFUNDED
// Validates payment was SUCCEEDED before refunding
```

## 🔄 Payment Status Transitions

```
CREATED
  ↓
  ├→ REQUIRES_ACTION (3D Secure, etc.)
  │    ↓
  │    ├→ SUCCEEDED
  │    └→ FAILED
  │
  ├→ SUCCEEDED
  │    ↓
  │    └→ REFUNDED
  │
  └→ FAILED
```

**Valid Transitions**:
- CREATED → REQUIRES_ACTION
- CREATED → SUCCEEDED
- CREATED → FAILED
- REQUIRES_ACTION → SUCCEEDED
- REQUIRES_ACTION → FAILED
- SUCCEEDED → REFUNDED

**Invalid Transitions**:
- FAILED → REFUNDED (cannot refund failed payment)
- REFUNDED → any status (refund is final)

## 🧪 Testing

### Manual Testing

```bash
# Run test script
npx tsx test-payment-intent.ts

# Expected output:
# ✓ Created payment intent
# ✓ Marked payment as succeeded
# ✓ Marked payment as failed
# ✓ Refunded payment
# ✓ Statistics calculated correctly
```

### Database Verification

```sql
-- Check payment_intents table
SELECT * FROM payment_intents ORDER BY "createdAt" DESC LIMIT 5;

-- Check payment by status
SELECT status, COUNT(*) as count, SUM(amount) as total_amount
FROM payment_intents
GROUP BY status;

-- Check user payments
SELECT u.email, COUNT(pi.id) as payment_count, SUM(pi.amount) as total_paid
FROM users u
LEFT JOIN payment_intents pi ON u.id = pi."userId" AND pi.status = 'SUCCEEDED'
GROUP BY u.id, u.email;
```

### API Testing (Future)

```bash
# Create payment intent
curl -X POST http://localhost:3001/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "seatId": "cm...",
    "provider": "PAYSTACK"
  }'

# Webhook from payment provider
curl -X POST http://localhost:3001/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "paystack_ref_123456"
    }
  }'
```

## 💳 Payment Providers

### Paystack
- **Currency**: ZAR (South African Rand)
- **Minimum**: R1.00 (100 cents)
- **Features**: Card payments, 3D Secure, webhooks
- **Reference Format**: `paystack_ref_*`

### Yoco
- **Currency**: ZAR (South African Rand)
- **Minimum**: R1.00 (100 cents)
- **Features**: Card payments, mobile payments
- **Reference Format**: `yoco_ref_*`

## 💰 Amount Handling

**Storage**: All amounts stored in cents (integer)
- R50.00 = 5000 cents
- R100.00 = 10000 cents
- R1.50 = 150 cents

**Display**: Convert to currency format
```typescript
const displayAmount = (amount / 100).toFixed(2);
// 5000 → "50.00"
```

**Validation**: Ensure positive amounts
```typescript
if (amount <= 0) {
  throw new Error("Amount must be positive");
}
```

## 🔒 Security Considerations

### Payment Intent Creation
- Validate user is authenticated
- Validate seat is available or held by user
- Validate amount matches expected commitment fee
- Validate dinner hasn't started yet

### Payment Status Updates
- Only update via webhook from payment provider
- Verify webhook signature
- Idempotent updates (handle duplicate webhooks)
- Log all status changes for audit trail

### Refunds
- Validate payment status is SUCCEEDED
- Validate refund policy (time window)
- Validate user owns the payment
- Process refund through payment provider
- Update status only after provider confirms

## 📊 Use Cases

### User Booking Flow
```typescript
// 1. User holds seat
const seat = await seatRepository.holdSeatForDinner(userId, dinnerId);

// 2. Create payment intent
const payment = await paymentIntentRepository.createPaymentIntent({
  userId,
  dinnerId,
  seatId: seat.id,
  amount: 5000, // R50.00
  provider: "PAYSTACK",
});

// 3. Send to payment provider
const paystackResponse = await paystack.initializeTransaction({
  amount: payment.amount,
  email: user.email,
  reference: payment.id,
});

// 4. User completes payment
// 5. Webhook updates payment status
await paymentIntentRepository.markPaymentSucceeded(
  payment.id,
  paystackResponse.reference
);

// 6. Confirm seat
await seatRepository.confirmSeat(seat.id, userId);
```

### Cancellation with Refund
```typescript
// 1. User cancels booking
const seat = await seatRepository.findById(seatId);

// 2. Check refund policy
const { allowed, reason } = isCancellationAllowed(dinner.startsAt);

if (allowed) {
  // 3. Find payment
  const payment = await paymentIntentRepository.findBySeat(seatId);
  
  if (payment && payment.status === "SUCCEEDED") {
    // 4. Process refund through provider
    await paystack.refundTransaction(payment.providerReference);
    
    // 5. Update payment status
    await paymentIntentRepository.refundPayment(payment.id);
  }
  
  // 6. Cancel seat
  await seatRepository.cancelSeat(seatId, userId);
}
```

### Restaurant Revenue Tracking
```typescript
// Get payment stats for a dinner
const stats = await paymentIntentRepository.getDinnerPaymentStats(dinnerId);

console.log(`Revenue: R${(stats.totalAmountCollected / 100).toFixed(2)}`);
console.log(`Success Rate: ${(stats.succeededPayments / stats.totalPayments * 100).toFixed(1)}%`);
```

## 📈 Analytics Potential

### Payment Metrics
- Total revenue per dinner
- Total revenue per restaurant
- Payment success rate
- Average payment amount
- Refund rate
- Provider performance comparison

### User Metrics
- Total amount paid per user
- Payment failure rate per user
- Refund rate per user
- Payment method preferences

### Platform Metrics
- Total platform revenue
- Revenue by theme
- Revenue by city
- Revenue trends over time

## 🚀 Next Steps (Future Epics)

### EPIC 7.2: Payment Provider Integration
- Integrate Paystack SDK
- Integrate Yoco SDK
- Implement webhook handlers
- Handle 3D Secure flows

### EPIC 7.3: Payment UI
- Payment form component
- Payment status display
- Refund request UI
- Payment history page

### EPIC 7.4: Refund Policy
- Define refund windows
- Implement refund validation
- Automated refund processing
- Refund notifications

### EPIC 7.5: Payment Analytics
- Revenue dashboard
- Payment success metrics
- Provider comparison
- Fraud detection

## 🎯 Requirements Checklist

- [x] PaymentIntent model created
- [x] id (cuid)
- [x] userId
- [x] dinnerId
- [x] seatId
- [x] amount (integer, in cents)
- [x] currency (string, default "ZAR")
- [x] provider (enum: PAYSTACK, YOCO)
- [x] providerReference (string nullable)
- [x] status (enum: CREATED, REQUIRES_ACTION, SUCCEEDED, FAILED, REFUNDED)
- [x] createdAt
- [x] updatedAt
- [x] Relations: user, dinner, seat
- [x] Indexes: userId, dinnerId, status
- [x] Prisma migration applied
- [x] createPaymentIntent() method
- [x] markPaymentSucceeded() method
- [x] markPaymentFailed() method
- [x] refundPayment() method
- [x] Repository exported
- [x] Test script provided

---

**EPIC 7.1 Status**: ✅ COMPLETE
**Date Completed**: March 2, 2026
**Database Migration**: Applied
**Repository**: PaymentIntentRepository implemented
**Testing**: Test script provided
**Ready for Integration**: Yes

The payment schema is complete and ready for payment provider integration (EPIC 7.2).
