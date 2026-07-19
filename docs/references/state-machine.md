# Seat State Machine

## Overview

The seat state machine is a centralized system that manages all seat status transitions in the DineWithMe platform. It ensures data consistency, proper analytics tracking, and audit logging for every state change.

## Architecture

### Core Components

1. **SeatStateMachine** (`packages/db/src/services/seat-state-machine.ts`)
   - Central state transition logic
   - Validation of allowed transitions
   - Automatic analytics event emission
   - Automatic audit log creation

2. **SeatRepository** (`packages/db/src/repositories/seat.repository.ts`)
   - Business logic methods (hold, confirm, cancel, etc.)
   - Uses state machine for all status updates
   - Handles policy validation

3. **API Endpoints** (`apps/web/src/app/api/seats/*`)
   - HTTP interface for seat operations
   - Authentication and authorization
   - Input validation

## State Diagram

```
AVAILABLE
    ↓
  HELD ←──────────────┐
    ↓                 │
    ├→ CONFIRMED      │
    │      ↓          │
    │   ATTENDED      │
    │      ↓          │
    │   COMPLETED     │
    │      ↓          │
    │   LEFT_EARLY    │
    │      ↓          │
    │   NO_SHOW       │
    │                 │
    ├→ EXPIRED ───────┤
    │                 │
    └→ CANCELLED ─────┘
         ↓
    AVAILABLE
```

## Valid Transitions

| From Status | To Status(es) | Trigger |
|------------|---------------|---------|
| AVAILABLE | HELD | User holds a seat |
| HELD | CONFIRMED | User confirms reservation |
| HELD | AVAILABLE | Hold expires or user releases |
| HELD | EXPIRED | Hold expiration (cron job) |
| CONFIRMED | ATTENDED | User checks in at venue |
| CONFIRMED | CANCELLED | User cancels within policy |
| CONFIRMED | NO_SHOW | No check-in after threshold |
| ATTENDED | COMPLETED | User completes dinner |
| ATTENDED | LEFT_EARLY | User leaves before end |
| CANCELLED | AVAILABLE | Seat released back to pool |
| EXPIRED | AVAILABLE | Expired hold released |

## Terminal States

These states cannot transition to any other state:
- **COMPLETED**: Dinner finished successfully
- **NO_SHOW**: User didn't attend
- **LEFT_EARLY**: User left before dinner ended

## Usage

### Basic Transition

```typescript
import { createSeatStateMachine } from "@dinewithme/db";
import { prisma } from "@dinewithme/db";

const stateMachine = createSeatStateMachine(prisma);

// Transition a seat
const result = await stateMachine.transitionSeatStatus(
  seatId,
  "CONFIRMED",
  {
    userId: "user_123",
    confirmedByUserId: "user_123",
    dinnerId: "dinner_456",
  }
);

console.log(result.seat); // Updated seat
console.log(result.fromStatus); // Previous status
console.log(result.toStatus); // New status
```

### Repository Methods

All repository methods use the state machine internally:

```typescript
import { seatRepository } from "@dinewithme/db";

// Hold a seat (AVAILABLE → HELD)
const seat = await seatRepository.holdSeatForDinner(
  userId,
  dinnerId,
  10 // hold duration in minutes
);

// Confirm a seat (HELD → CONFIRMED)
const confirmedSeat = await seatRepository.confirmSeat(seatId, userId);

// Cancel a seat (CONFIRMED → CANCELLED or AVAILABLE)
const { seat, policyResult } = await seatRepository.cancelSeat(seatId, userId);

// Check in (CONFIRMED → ATTENDED)
const { seat, policyResult } = await seatRepository.checkIn(seatId, userId);

// Mark no-shows (CONFIRMED → NO_SHOW)
const noShows = await seatRepository.markNoShows(30); // 30 min threshold

// Expire holds (HELD → AVAILABLE)
const { count, expiredSeats } = await seatRepository.expireHolds();
```

### Batch Transitions

For operations like expiring multiple holds:

```typescript
const transitions = expiredSeats.map(seat => ({
  seatId: seat.id,
  toStatus: "AVAILABLE" as SeatStatus,
  metadata: {
    userId: "system",
    heldByUserId: seat.heldByUserId,
    dinnerId: seat.dinnerId,
    reason: "hold_expired",
  },
}));

const results = await stateMachine.transitionMultipleSeats(transitions);
```

## Automatic Side Effects

Every state transition automatically:

### 1. Emits Analytics Event

```typescript
// Example: HELD → CONFIRMED
await track(AnalyticsEvents.SEAT_CONFIRMED, {
  userId: "user_123",
  dinnerId: "dinner_456",
  seatId: "seat_789",
  timestamp: "2026-03-01T10:00:00Z",
});
```

### 2. Creates Audit Log

```typescript
// Example: CONFIRMED → CANCELLED
await auditLogger.log(
  "user_123",
  AuditAction.SEAT_CANCELLED,
  AuditEntity.SEAT,
  "seat_789",
  {
    fromStatus: "CONFIRMED",
    toStatus: "CANCELLED",
    dinnerId: "dinner_456",
    reason: "user_cancelled",
    hoursUntilDinner: 12,
  }
);
```

### 3. Updates Database Fields

Status-specific fields are automatically managed:

- **HELD**: Sets `holdExpiresAt`, `heldByUserId`
- **CONFIRMED**: Sets `confirmedByUserId`, clears `holdExpiresAt`
- **ATTENDED**: Sets `checkedInAt`
- **COMPLETED/LEFT_EARLY**: Sets `checkedOutAt`
- **AVAILABLE**: Clears `heldByUserId`, `holdExpiresAt`, optionally `confirmedByUserId`

## Metadata Fields

Common metadata fields for transitions:

```typescript
interface TransitionMetadata {
  userId?: string;              // User performing action
  dinnerId?: string;            // Associated dinner
  reason?: string;              // Reason for transition
  holdExpiresAt?: Date;         // For HELD transitions
  checkedInAt?: Date;           // For ATTENDED transitions
  checkedOutAt?: Date;          // For COMPLETED/LEFT_EARLY
  heldByUserId?: string | null; // User holding seat
  confirmedByUserId?: string | null; // User confirming seat
  holdDurationMinutes?: number; // Duration of hold
  hoursUntilDinner?: number;    // For cancellation context
  minutesUntilStart?: number;   // For check-in timing
  minutesAfterStart?: number;   // For no-show marking
  dinnerTheme?: string;         // For analytics context
  restaurantId?: string;        // For analytics context
}
```

## Error Handling

### Invalid Transition

```typescript
try {
  await stateMachine.transitionSeatStatus(seatId, "COMPLETED", {});
} catch (error) {
  // Error: Invalid transition: AVAILABLE -> COMPLETED.
  // Allowed transitions from AVAILABLE: HELD
}
```

### Seat Not Found

```typescript
try {
  await stateMachine.transitionSeatStatus("invalid_id", "HELD", {});
} catch (error) {
  // Error: Seat not found: invalid_id
}
```

### Analytics/Audit Failures

Analytics and audit logging failures are caught and logged but don't break the main flow:

```typescript
// If analytics fails, transition still succeeds
// Error is logged to console:
// [SeatStateMachine] Failed to emit analytics event: ...
```

## API Integration

All seat APIs use the repository methods, which use the state machine:

### POST /api/seats/hold

```typescript
// Repository handles state machine
const seat = await seatRepository.holdSeatForDinner(userId, dinnerId);

// State machine automatically:
// 1. Validates AVAILABLE → HELD transition
// 2. Emits SEAT_HELD_SUCCESS event
// 3. Creates audit log
```

### POST /api/seats/confirm

```typescript
const seat = await seatRepository.confirmSeat(seatId, userId);

// State machine automatically:
// 1. Validates HELD → CONFIRMED transition
// 2. Emits SEAT_CONFIRMED event
// 3. Creates audit log
```

### POST /api/seats/cancel

```typescript
const { seat } = await seatRepository.cancelSeat(seatId, userId);

// State machine automatically:
// 1. Validates CONFIRMED → CANCELLED/AVAILABLE transition
// 2. Emits SEAT_CANCELLED event
// 3. Creates audit log
```

### POST /api/seats/check-in

```typescript
const { seat } = await seatRepository.checkIn(seatId, userId);

// State machine automatically:
// 1. Validates CONFIRMED → ATTENDED transition
// 2. Emits SEAT_CHECK_IN_SUCCESS event
// 3. Creates audit log
```

### GET /api/cron/expire-holds

```typescript
const { expiredSeats } = await seatRepository.expireHolds();

// State machine automatically (for each seat):
// 1. Validates HELD → AVAILABLE transition
// 2. Emits SEAT_HOLD_EXPIRED event
// 3. Creates audit log
```

### POST /api/cron/mark-no-shows

```typescript
const noShows = await seatRepository.markNoShows(30);

// State machine automatically (for each seat):
// 1. Validates CONFIRMED → NO_SHOW transition
// 2. Emits SEAT_NO_SHOW_MARKED event
// 3. Creates audit log
```

## Benefits

### 1. Consistency
- Single source of truth for state transitions
- Impossible to bypass validation
- All transitions follow same pattern

### 2. Observability
- Every transition tracked in analytics
- Complete audit trail
- Easy to debug issues

### 3. Maintainability
- Centralized logic
- Easy to add new transitions
- Clear documentation of allowed flows

### 4. Safety
- Invalid transitions rejected
- Type-safe with TypeScript
- Transaction support

## Testing

### Unit Tests

```typescript
import { createSeatStateMachine } from "@dinewithme/db";

describe("SeatStateMachine", () => {
  it("should allow AVAILABLE → HELD transition", async () => {
    const result = await stateMachine.transitionSeatStatus(
      seatId,
      "HELD",
      { userId: "user_123" }
    );
    
    expect(result.fromStatus).toBe("AVAILABLE");
    expect(result.toStatus).toBe("HELD");
  });

  it("should reject invalid transitions", async () => {
    await expect(
      stateMachine.transitionSeatStatus(seatId, "COMPLETED", {})
    ).rejects.toThrow("Invalid transition");
  });
});
```

### Integration Tests

See test scripts:
- `test-seat-hold-concurrency.ts`
- `test-seat-confirm.ts`
- `test-seat-cancel.ts`
- `test-seat-check-in.ts`
- `test-mark-no-shows.ts`

## Future Enhancements

### Planned Features

1. **State Machine Hooks**
   - Pre-transition validation hooks
   - Post-transition side effects
   - Custom business logic injection

2. **Transition History**
   - Track all state changes
   - Audit trail with timestamps
   - Rollback capability

3. **Conditional Transitions**
   - Time-based rules
   - User role-based rules
   - Dinner status-based rules

4. **Metrics Dashboard**
   - Transition frequency
   - Average time in each state
   - Failure rate by transition type

## Related Documentation

- [Seat Lifecycle Reference](../SEAT_LIFECYCLE_REFERENCE.md)
- [EPIC 3.1: Seat Lifecycle](../EPIC_3.1_COMPLETE.md)
- [EPIC 3.2: Seat Hold](../EPIC_3.2_COMPLETE.md)
- [EPIC 3.4: Seat Confirmation](../EPIC_3.4_COMPLETE.md)
- [EPIC 3.5: Seat Cancellation](../EPIC_3.5_COMPLETE.md)
- [EPIC 3.6: Check-in](../EPIC_3.6_COMPLETE.md)
- [EPIC 3.7: No-Show Marking](../EPIC_3.7_COMPLETE.md)

## Support

For questions or issues:
1. Check this documentation
2. Review test scripts for examples
3. Check audit logs for transition history
4. Review analytics events for tracking data
