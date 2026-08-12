import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { DinnerRepository } from '../packages/db/src/repositories/dinner.repository';

// cancelDinner() cancels a dinner's HELD/CONFIRMED seats and then the dinner
// itself. Those were previously two un-wrapped writes, so a mid-sequence
// failure could leave the dinner SCHEDULED/LIVE with seats already CANCELLED
// (or the inverse) — a half-cancelled dinner still visible/bookable to diners.
// Fixed by wrapping both writes in a single $transaction (audit finding C6).
// This test pins the end-state contract: dinner CANCELLED, HELD/CONFIRMED
// seats CANCELLED, AVAILABLE seats left untouched.

const prisma = new PrismaClient();
const dinnerRepository = new DinnerRepository(prisma);

describe('Dinner cancellation', () => {
  let restaurantId: string;
  let themeId: string;
  let dinnerId: string;
  let heldSeatId: string;
  let confirmedSeatId: string;
  let availableSeatId: string;
  let userId: string;

  beforeAll(async () => {
    const restaurant = await prisma.restaurant.create({
      data: { name: '__cancel_test_r__', status: 'ACTIVE' },
    });
    restaurantId = restaurant.id;

    const theme = await prisma.theme.create({
      data: {
        key: `__cancel_test_t_${Date.now()}__`,
        title: 'Test Theme',
        shortDescription: 'test',
        whatToExpect: 'test',
        boundaries: 'test',
        conversationStarters: [],
      },
    });
    themeId = theme.id;

    const dinner = await prisma.dinner.create({
      data: {
        restaurantId,
        themeId,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 90000000),
        seatCount: 3,
        status: 'SCHEDULED',
      },
    });
    dinnerId = dinner.id;

    const user = await prisma.user.create({
      data: {
        authProviderId: `__cancel_test_u_${Date.now()}__`,
        email: `cancel-test-${Date.now()}@example.com`,
      },
    });
    userId = user.id;

    const held = await prisma.seat.create({
      data: { dinnerId, status: 'HELD', heldByUserId: userId, holdExpiresAt: new Date(Date.now() + 600000) },
    });
    heldSeatId = held.id;

    const confirmed = await prisma.seat.create({
      data: { dinnerId, status: 'CONFIRMED', confirmedByUserId: userId },
    });
    confirmedSeatId = confirmed.id;

    const available = await prisma.seat.create({ data: { dinnerId, status: 'AVAILABLE' } });
    availableSeatId = available.id;
  });

  afterAll(async () => {
    await prisma.seat.deleteMany({ where: { dinnerId } });
    await prisma.dinner.deleteMany({ where: { id: dinnerId } });
    await prisma.restaurant.deleteMany({ where: { id: restaurantId } });
    await prisma.theme.deleteMany({ where: { id: themeId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('atomically cancels the dinner and its HELD/CONFIRMED seats, leaving AVAILABLE untouched', async () => {
    const result = await dinnerRepository.cancelDinner(dinnerId);
    expect(result.status).toBe('CANCELLED');

    const [dinner, held, confirmed, available] = await Promise.all([
      prisma.dinner.findUnique({ where: { id: dinnerId } }),
      prisma.seat.findUnique({ where: { id: heldSeatId } }),
      prisma.seat.findUnique({ where: { id: confirmedSeatId } }),
      prisma.seat.findUnique({ where: { id: availableSeatId } }),
    ]);

    expect(dinner?.status).toBe('CANCELLED');
    expect(held?.status).toBe('CANCELLED');
    expect(confirmed?.status).toBe('CANCELLED');
    // AVAILABLE seats are not part of the HELD/CONFIRMED cancellation set.
    expect(available?.status).toBe('AVAILABLE');
  });
});
