import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SeatRepository } from '../packages/db/src/repositories/seat.repository';

const prisma = new PrismaClient();
const seatRepository = new SeatRepository(prisma);

// Exercises seatRepository.holdSeatForDinner() — the method actually wired up
// to /api/bookings/create and /api/seats/hold in production.
describe('Concurrent Booking Test', () => {
  let testDinnerId: string;
  let testRestaurantId: string;
  let testThemeId: string;
  let testUserIds: string[] = [];

  beforeAll(async () => {
    for (let i = 1; i <= 10; i++) {
      const user = await prisma.user.create({
        data: {
          authProviderId: `test-hold-auth-${Date.now()}-${i}`,
          email: `test-hold-${i}-${Date.now()}@example.com`,
          firstName: `Test${i}`,
          lastName: 'User',
        },
      });
      testUserIds.push(user.id);
    }

    const theme = await prisma.theme.create({
      data: {
        key: 'test-hold-theme-' + Date.now(),
        title: 'Test Hold Theme',
        shortDescription: 'Test theme for concurrent hold tests',
        whatToExpect: 'Testing concurrent holds',
        boundaries: 'No boundaries in testing',
        conversationStarters: ['How are you?'],
      },
    });
    testThemeId = theme.id;

    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Hold Restaurant',
        description: 'Test',
        address: 'Test Address',
        city: 'Test City',
        status: 'ACTIVE',
      },
    });
    testRestaurantId = restaurant.id;

    const dinner = await prisma.dinner.create({
      data: {
        restaurantId: restaurant.id,
        themeId: theme.id,
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 27 * 60 * 60 * 1000),
        seatCount: 2,
        status: 'SCHEDULED',
      },
    });
    testDinnerId = dinner.id;
  });

  afterAll(async () => {
    await prisma.seat.deleteMany({ where: { dinnerId: testDinnerId } });
    await prisma.dinner.deleteMany({ where: { id: testDinnerId } });
    await prisma.restaurant.deleteMany({ where: { id: testRestaurantId } });
    await prisma.theme.deleteMany({ where: { id: testThemeId } });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
  });

  it('should allow exactly one winner when 10 users race for 1 seat', async () => {
    // One dedicated seat for this test, separate from the "multiple seats" test below
    const seat = await prisma.seat.create({
      data: { dinnerId: testDinnerId, status: 'AVAILABLE' },
    });

    const results = await Promise.allSettled(
      testUserIds.map((userId) =>
        seatRepository.holdSeatForDinner(userId, testDinnerId, 10)
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(9);

    const refreshedSeat = await prisma.seat.findUnique({ where: { id: seat.id } });
    expect(refreshedSeat?.status).toBe('HELD');
    expect(refreshedSeat?.heldByUserId).toBeTruthy();
    expect(testUserIds).toContain(refreshedSeat?.heldByUserId);
  });

  it('should prevent a user from holding a second seat for the same dinner', async () => {
    const seatA = await prisma.seat.create({
      data: { dinnerId: testDinnerId, status: 'AVAILABLE' },
    });
    const seatB = await prisma.seat.create({
      data: { dinnerId: testDinnerId, status: 'AVAILABLE' },
    });

    // A dedicated user, not one from the shared race-test pool above —
    // reusing one of those risked it already holding a seat from that test.
    const user = await prisma.user.create({
      data: {
        authProviderId: `test-second-seat-auth-${Date.now()}`,
        email: `test-second-seat-${Date.now()}@example.com`,
      },
    });

    // Hold the first seat
    await seatRepository.holdSeatForDinner(user.id, testDinnerId, 10);

    // Second hold attempt for the same dinner should fail, regardless of which
    // seat it would have picked
    await expect(
      seatRepository.holdSeatForDinner(user.id, testDinnerId, 10)
    ).rejects.toThrow('User already has a seat for this dinner');

    await prisma.seat.deleteMany({ where: { id: { in: [seatA.id, seatB.id] } } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
