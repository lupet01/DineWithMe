import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createSeatStateMachine } from '../packages/db/src/services/seat-state-machine';

// Real assertions on the seat state machine's transition table, converted from
// the old tests/test-state-machine.ts (a manual console.log walkthrough that
// required pre-seeded data and a hardcoded personal email — this version
// creates its own fixtures and actually asserts on the results).

const prisma = new PrismaClient();
const stateMachine = createSeatStateMachine(prisma);

describe('Seat state machine — transition table', () => {
  let dinnerId: string;
  let restaurantId: string;
  let themeId: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        authProviderId: `test-sm-auth-${Date.now()}`,
        email: `test-sm-${Date.now()}@example.com`,
      },
    });
    userId = user.id;

    const theme = await prisma.theme.create({
      data: {
        key: `test-sm-theme-${Date.now()}`,
        title: 'Test Theme',
        shortDescription: 'test',
        whatToExpect: 'test',
        boundaries: 'test',
        conversationStarters: [],
      },
    });
    themeId = theme.id;

    const restaurant = await prisma.restaurant.create({
      data: { name: '__sm_test_restaurant__', status: 'ACTIVE' },
    });
    restaurantId = restaurant.id;

    const dinner = await prisma.dinner.create({
      data: {
        restaurantId,
        themeId,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 90000000),
        seatCount: 10,
        status: 'SCHEDULED',
      },
    });
    dinnerId = dinner.id;
  });

  afterAll(async () => {
    await prisma.seat.deleteMany({ where: { dinnerId } });
    await prisma.dinner.delete({ where: { id: dinnerId } });
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    await prisma.theme.delete({ where: { id: themeId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  async function freshSeat() {
    return prisma.seat.create({ data: { dinnerId, status: 'AVAILABLE' } });
  }

  it('walks a seat through its full valid lifecycle: AVAILABLE → HELD → CONFIRMED → ATTENDED → COMPLETED', async () => {
    const seat = await freshSeat();
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const held = await stateMachine.transitionSeatStatus(seat.id, 'HELD', {
      userId, heldByUserId: userId, holdExpiresAt, dinnerId,
    });
    expect(held.toStatus).toBe('HELD');
    expect(held.seat.heldByUserId).toBe(userId);

    const confirmed = await stateMachine.transitionSeatStatus(held.seat.id, 'CONFIRMED', {
      userId, confirmedByUserId: userId, dinnerId,
    });
    expect(confirmed.toStatus).toBe('CONFIRMED');
    expect(confirmed.seat.holdExpiresAt).toBeNull(); // hold fields cleared on confirm

    const attended = await stateMachine.transitionSeatStatus(confirmed.seat.id, 'ATTENDED', {
      userId, checkedInAt: new Date(), dinnerId,
    });
    expect(attended.toStatus).toBe('ATTENDED');
    expect(attended.seat.checkedInAt).not.toBeNull();

    const completed = await stateMachine.transitionSeatStatus(attended.seat.id, 'COMPLETED', {
      userId, checkedOutAt: new Date(), dinnerId,
    });
    expect(completed.toStatus).toBe('COMPLETED');
  });

  it('rejects invalid transitions, including from terminal states', async () => {
    const seat = await freshSeat();
    const held = await stateMachine.transitionSeatStatus(seat.id, 'HELD', {
      userId, heldByUserId: userId, holdExpiresAt: new Date(Date.now() + 600000), dinnerId,
    });
    const confirmed = await stateMachine.transitionSeatStatus(held.seat.id, 'CONFIRMED', {
      userId, confirmedByUserId: userId, dinnerId,
    });

    // CONFIRMED -> HELD is not a valid transition
    await expect(
      stateMachine.transitionSeatStatus(confirmed.seat.id, 'HELD', { userId })
    ).rejects.toThrow('Invalid transition');

    const completed = await stateMachine.transitionSeatStatus(
      (await stateMachine.transitionSeatStatus(confirmed.seat.id, 'ATTENDED', { userId, checkedInAt: new Date(), dinnerId })).seat.id,
      'COMPLETED',
      { userId, checkedOutAt: new Date(), dinnerId }
    );

    // COMPLETED is terminal — nothing should be a valid transition out of it
    expect(stateMachine.getValidTransitions('COMPLETED')).toHaveLength(0);
    await expect(
      stateMachine.transitionSeatStatus(completed.seat.id, 'AVAILABLE', { userId })
    ).rejects.toThrow('Invalid transition');
  });

  it('supports direct CONFIRMED → AVAILABLE for immediate-release cancellation', async () => {
    const seat = await freshSeat();
    const held = await stateMachine.transitionSeatStatus(seat.id, 'HELD', {
      userId, heldByUserId: userId, holdExpiresAt: new Date(Date.now() + 600000), dinnerId,
    });
    const confirmed = await stateMachine.transitionSeatStatus(held.seat.id, 'CONFIRMED', {
      userId, confirmedByUserId: userId, dinnerId,
    });

    const released = await stateMachine.transitionSeatStatus(confirmed.seat.id, 'AVAILABLE', {
      userId, confirmedByUserId: null, heldByUserId: null, reason: 'user_cancelled', dinnerId,
    });

    expect(released.toStatus).toBe('AVAILABLE');
    expect(released.seat.confirmedByUserId).toBeNull();
    expect(released.seat.heldByUserId).toBeNull();
  });

  it('isValidTransition() and getValidTransitions() reflect the same table used for enforcement', () => {
    expect(stateMachine.isValidTransition('AVAILABLE', 'HELD')).toBe(true);
    expect(stateMachine.isValidTransition('AVAILABLE', 'CONFIRMED')).toBe(false);
    expect(stateMachine.isValidTransition('HELD', 'CONFIRMED')).toBe(true);
    expect(stateMachine.isValidTransition('CONFIRMED', 'ATTENDED')).toBe(true);
    expect(stateMachine.isValidTransition('COMPLETED', 'AVAILABLE')).toBe(false);
    expect(stateMachine.getValidTransitions('HELD')).toEqual(
      expect.arrayContaining(['CONFIRMED', 'AVAILABLE', 'EXPIRED'])
    );
  });
});
