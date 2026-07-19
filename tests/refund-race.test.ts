import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PaymentIntentRepository } from '../packages/db/src/repositories/payment-intent.repository';

// paymentIntentRepository.refundPayment() previously read the payment status,
// then called the payment provider, then wrote "REFUNDED" — two concurrent
// requests for the same payment intent could both pass the read-only status
// check before either wrote, both triggering a real refund call against the
// provider. Fixed 2026-07-18 by making the DB claim an atomic guarded update
// that happens BEFORE the provider is ever called (see api/payments/refund).
// This test covers just the repository-level race; the route wraps it with
// revertRefundClaim() to release the claim if the provider call then fails.

const prisma = new PrismaClient();
const paymentIntentRepository = new PaymentIntentRepository(prisma);

describe('Refund race condition', () => {
  let restaurantId: string;
  let themeId: string;
  let dinnerId: string;
  let seatId: string;
  let userId: string;
  let paymentIntentId: string;

  beforeAll(async () => {
    const restaurant = await prisma.restaurant.create({ data: { name: '__refund_test_r__', status: 'ACTIVE' } });
    restaurantId = restaurant.id;

    const theme = await prisma.theme.create({
      data: {
        key: `__refund_test_t_${Date.now()}__`,
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
        seatCount: 1,
        status: 'SCHEDULED',
      },
    });
    dinnerId = dinner.id;

    const seat = await prisma.seat.create({ data: { dinnerId, status: 'AVAILABLE' } });
    seatId = seat.id;

    const user = await prisma.user.create({
      data: { authProviderId: `__refund_test_u_${Date.now()}__`, email: `refund-test-${Date.now()}@example.com` },
    });
    userId = user.id;

    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        userId,
        dinnerId,
        seatId,
        amount: 47500,
        currency: 'ZAR',
        provider: 'PAYSTACK',
        status: 'SUCCEEDED',
      },
    });
    paymentIntentId = paymentIntent.id;
  });

  afterAll(async () => {
    await prisma.paymentIntent.deleteMany({ where: { id: paymentIntentId } });
    await prisma.seat.deleteMany({ where: { dinnerId } });
    await prisma.dinner.deleteMany({ where: { id: dinnerId } });
    await prisma.restaurant.deleteMany({ where: { id: restaurantId } });
    await prisma.theme.deleteMany({ where: { id: themeId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('allows exactly one of two concurrent refundPayment calls to succeed', async () => {
    const results = await Promise.allSettled([
      paymentIntentRepository.refundPayment(paymentIntentId),
      paymentIntentRepository.refundPayment(paymentIntentId),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const final = await prisma.paymentIntent.findUnique({ where: { id: paymentIntentId } });
    expect(final?.status).toBe('REFUNDED');
  });
});
