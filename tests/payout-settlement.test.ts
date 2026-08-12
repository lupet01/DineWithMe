import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PayoutRepository } from '../packages/db/src/repositories/payout.repository';

// Payout settlement (Platform Ops "Process Selected Payouts"): markPaid() must
// only ever move READY -> PAID (never touch HELD), and findSettleableWithOwner()
// feeds the payout-paid email + audit trail with the owner emails and amounts
// of exactly the settleable payouts. This test pins both contracts against a
// READY payout and a HELD payout for the same restaurant.

const prisma = new PrismaClient();
const payoutRepository = new PayoutRepository(prisma);

describe('Payout settlement', () => {
  let restaurantId: string;
  let themeId: string;
  let ownerUserId: string;
  let readyDinnerId: string;
  let heldDinnerId: string;
  let readyPayoutId: string;
  let heldPayoutId: string;
  const ownerEmail = `payout-owner-${Date.now()}@example.com`;

  async function makeDinner(): Promise<string> {
    const dinner = await prisma.dinner.create({
      data: {
        restaurantId,
        themeId,
        startsAt: new Date(Date.now() - 90000000),
        endsAt: new Date(Date.now() - 86400000),
        seatCount: 2,
        pricePerSeatCents: 25000,
        status: 'COMPLETED',
      },
    });
    return dinner.id;
  }

  beforeAll(async () => {
    const restaurant = await prisma.restaurant.create({
      data: { name: '__payout_test_r__', status: 'ACTIVE' },
    });
    restaurantId = restaurant.id;

    const theme = await prisma.theme.create({
      data: {
        key: `__payout_test_t_${Date.now()}__`,
        title: 'Test Payout Theme',
        shortDescription: 'test',
        whatToExpect: 'test',
        boundaries: 'test',
        conversationStarters: [],
      },
    });
    themeId = theme.id;

    const owner = await prisma.user.create({
      data: { authProviderId: `__payout_owner_${Date.now()}__`, email: ownerEmail },
    });
    ownerUserId = owner.id;
    await prisma.restaurantMember.create({
      data: { restaurantId, userId: ownerUserId, role: 'OWNER' },
    });

    readyDinnerId = await makeDinner();
    heldDinnerId = await makeDinner();

    const readyPayout = await prisma.payout.create({
      data: {
        restaurantId,
        dinnerId: readyDinnerId,
        grossAmountCents: 50000,
        commissionAmountCents: 7500,
        bookingFeeCents: 1000,
        netAmountCents: 42500,
        status: 'READY',
        scheduledAt: new Date(Date.now() - 3600000),
      },
    });
    readyPayoutId = readyPayout.id;

    const heldPayout = await prisma.payout.create({
      data: {
        restaurantId,
        dinnerId: heldDinnerId,
        grossAmountCents: 50000,
        commissionAmountCents: 7500,
        bookingFeeCents: 1000,
        netAmountCents: 42500,
        status: 'HELD',
        scheduledAt: new Date(Date.now() + 3600000),
      },
    });
    heldPayoutId = heldPayout.id;
  });

  afterAll(async () => {
    await prisma.payout.deleteMany({ where: { restaurantId } });
    await prisma.dinner.deleteMany({ where: { restaurantId } });
    await prisma.restaurantMember.deleteMany({ where: { restaurantId } });
    await prisma.restaurant.deleteMany({ where: { id: restaurantId } });
    await prisma.theme.deleteMany({ where: { id: themeId } });
    await prisma.user.deleteMany({ where: { id: ownerUserId } });
  });

  it('findSettleableWithOwner returns only READY payouts with owner emails and amounts', async () => {
    const settleable = await payoutRepository.findSettleableWithOwner([readyPayoutId, heldPayoutId]);

    expect(settleable).toHaveLength(1);
    const row = settleable[0];
    expect(row.id).toBe(readyPayoutId);
    expect(row.netAmountCents).toBe(42500);
    expect(row.restaurantId).toBe(restaurantId);
    expect(row.ownerEmails).toContain(ownerEmail);
    expect(row.dinnerTitle).toBe('Test Payout Theme');
  });

  it('markPaid moves only READY -> PAID and leaves HELD untouched', async () => {
    const count = await payoutRepository.markPaid([readyPayoutId, heldPayoutId]);
    expect(count).toBe(1);

    const [ready, held] = await Promise.all([
      prisma.payout.findUnique({ where: { id: readyPayoutId } }),
      prisma.payout.findUnique({ where: { id: heldPayoutId } }),
    ]);

    expect(ready?.status).toBe('PAID');
    expect(ready?.paidAt).toBeTruthy();
    expect(held?.status).toBe('HELD');
    expect(held?.paidAt).toBeNull();
  });
});
