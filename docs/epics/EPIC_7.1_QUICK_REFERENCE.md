# EPIC 7.1: Commitment Payment Schema - Quick Reference

## Database Schema

```prisma
model PaymentIntent {
  id                String          @id @default(cuid())
  userId            String
  dinnerId          String
  seatId            String
  amount            Int             // Amount in cents
  currency          String          @default("ZAR")
  provider          PaymentProvider
  providerReference String?
  status            PaymentStatus   @default(CREATED)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

## Enums

```typescript
enum PaymentProvider {
  PAYSTACK
  YOCO
}

enum PaymentStatus {
  CREATED
  REQUIRES_ACTION
  SUCCEEDED
  FAILED
  REFUNDED
}
```

## Repository Methods

### Create Payment Intent

```typescript
import { paymentIntentRepository } from "@dinewithme/db";

const payment = await paymentIntentRepository.createPaymentIntent({
  userId: "cm...",
  dinnerId: "cm...",
  seatId: "cm...",
  amount: 5000, // R50.00 in cents
  currency: "ZAR",
  provider: "PAYSTACK",
});
```

### Mark Payment Succeeded

```typescript
await paymentIntentRepository.markPaymentSucceeded(
  paymentId,
  "paystack_ref_123456" // Provider reference
);
```

### Mark Payment Failed

```typescript
await paymentIntentRepository.markPaymentFailed(paymentId);
```

### Refund Payment

```typescript
// Validates payment status is SUCCEEDED
await paymentIntentRepository.refundPayment(paymentId);
```

### Query Methods

```typescript
// Find by ID
const payment = await paymentIntentRepository.findById(paymentId);

// Find with relations
const payment = await paymentIntentRepository.findByIdWithRelations(paymentId);

// Find by user
const payments = await paymentIntentRepository.findByUser(userId);

// Find by dinner
const payments = await paymentIntentRepository.findByDinner(dinnerId);

// Find by seat
const payment = await paymentIntentRepository.findBySeat(seatId);

// Find by status
const payments = await paymentIntentRepository.findByStatus("SUCCEEDED");
```

### Statistics

```typescript
// User payment stats
const stats = await paymentIntentRepository.getUserPaymentStats(userId);
// Returns: { totalPayments, succeededPayments, failedPayments, refundedPayments, totalAmountPaid }

// Dinner payment stats
const stats = await paymentIntentRepository.getDinnerPaymentStats(dinnerId);
// Returns: { totalPayments, succeededPayments, failedPayments, totalAmountCollected }
```

## Payment Status Flow

```
CREATED → REQUIRES_ACTION → SUCCEEDED → REFUNDED
   ↓            ↓
FAILED       FAILED
```

## Amount Handling

**Storage**: Cents (integer)
```typescript
R50.00 = 5000 cents
R100.00 = 10000 cents
```

**Display**: Convert to currency
```typescript
const displayAmount = `R${(amount / 100).toFixed(2)}`;
```

## Testing

```bash
# Run test script
npx tsx test-payment-intent.ts

# Check database
psql -U postgres -d dinewithme -c "SELECT * FROM payment_intents;"
```

## Files

- **Schema**: `prisma/schema.prisma`
- **Repository**: `packages/db/src/repositories/payment-intent.repository.ts`
- **Test**: `test-payment-intent.ts`
- **Docs**: `EPIC_7.1_COMPLETE.md`
