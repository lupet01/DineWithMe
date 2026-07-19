# PRODUCTION DEPLOYMENT PLAN - REVISED
**Version**: 2.0 (Revised after comprehensive review)  
**Date**: March 9, 2026  
**Status**: Ready for Implementation  
**Changes**: Added Phase 0, fixed 7 critical gaps, resolved 4 conflicts

---

## 📋 REVISION SUMMARY

### What Changed:
- **Added Phase 0**: Pre-deployment tasks (1.5 days)
- **Fixed 7 Critical Gaps**: User sync, race conditions, security, monitoring
- **Resolved 4 Conflicts**: Email/sync, theme migration, payment flow, indexes
- **Updated Timeline**: 9-12.5 days (was 7-11 days)
- **Added Migration Scripts**: Database, theme data, security
- **Added Monitoring**: Health checks, metrics, alerts

### Why These Changes:
Original plan assumed clean slate. Production requires:
- Data migration for existing records
- Security hardening for production environment
- Race condition fixes to prevent double bookings
- User sync fixes to prevent signup failures
- Monitoring to detect issues early

---

## 🚀 PHASE 0: PRE-DEPLOYMENT (NEW - CRITICAL)
**Duration**: 1.5 days  
**Priority**: 🔴 CRITICAL - Must complete before Phase 1  
**Can Skip**: ❌ NO - Will cause production failures

### Task 0.1: Database Migration and Backup
**Time**: 2 hours  
**Priority**: 🔴 CRITICAL

#### Create Migration Script

File: `scripts/pre-deployment-migration.ts` (NEW FILE)

```typescript
import { db } from '../packages/db';

async function preDeploymentMigration() {
  console.log('🚀 Starting pre-deployment migration...\n');
  
  // 1. Create backups
  console.log('📦 Creating backups...');
  await backupCriticalTables();
  
  // 2. Migrate theme data (string → object)
  console.log('🎨 Migrating theme data...');
  await migrateThemeData();
  
  // 3. Add database indexes (non-blocking)
  console.log('📊 Adding indexes...');
  await addIndexesConcurrently();
  
  // 4. Clean up expired holds
  console.log('🧹 Cleaning up expired holds...');
  await cleanupExpiredHolds();
  
  // 5. Verify data integrity
  console.log('✅ Verifying data integrity...');
  await verifyDataIntegrity();
  
  console.log('\n✅ Migration complete!');
}

async function backupCriticalTables() {
  const tables = ['users', 'restaurants', 'dinners', 'seats', 'payment_intents'];
  
  for (const table of tables) {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${table}_backup_${Date.now()} AS 
      SELECT * FROM ${table}
    `);
    console.log(`  ✓ Backed up ${table}`);
  }
}

async function migrateThemeData() {
  const restaurants = await db.restaurant.findMany({
    where: { theme: { not: null } },
  });
  
  let migrated = 0;
  let skipped = 0;
  
  for (const restaurant of restaurants) {
    // Check if already an object
    if (typeof restaurant.theme === 'object' && restaurant.theme !== null) {
      skipped++;
      continue;
    }
    
    // Convert string to object
    const themeColor = restaurant.theme as unknown as string;
    await db.restaurant.update({
      where: { id: restaurant.id },
      data: {
        theme: {
          primaryColor: themeColor || '#FF5733',
          secondaryColor: '#333333',
        },
      },
    });
    migrated++;
  }
  
  console.log(`  ✓ Migrated ${migrated} restaurants, skipped ${skipped}`);
}

async function addIndexesConcurrently() {
  const indexes = [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dinners_restaurant_status ON dinners(restaurant_id, status, scheduled_at)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_dinner_status ON seats(dinner_id, status)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_user ON seats(user_id)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_event_type ON analytics(event_type, created_at)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trust_events_user ON trust_events(user_id, created_at)',
  ];
  
  for (const index of indexes) {
    try {
      await db.$executeRawUnsafe(index);
      console.log(`  ✓ Added index`);
    } catch (error) {
      console.log(`  ⚠ Index might already exist`);
    }
  }
}

async function cleanupExpiredHolds() {
  const result = await db.seat.updateMany({
    where: {
      status: 'HELD',
      heldUntil: { lt: new Date() },
    },
    data: {
      status: 'AVAILABLE',
      userId: null,
      heldUntil: null,
    },
  });
  
  console.log(`  ✓ Cleaned up ${result.count} expired holds`);
}

async function verifyDataIntegrity() {
  // Check for orphaned seats
  const orphanedSeats = await db.seat.count({
    where: { dinner: null },
  });
  
  if (orphanedSeats > 0) {
    throw new Error(`❌ Found ${orphanedSeats} orphaned seats`);
  }
  
  // Check for invalid payment states
  const invalidPayments = await db.paymentIntent.count({
    where: {
      status: 'SUCCEEDED',
      seat: { status: { not: 'CONFIRMED' } },
    },
  });
  
  if (invalidPayments > 0) {
    console.warn(`  ⚠ Found ${invalidPayments} payments with mismatched seat status`);
  }
  
  console.log('  ✓ Data integrity verified');
}

// Run migration
preDeploymentMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
```

#### Run Migration

```bash
# 1. Test in development first
npm run migrate:pre-deployment

# 2. Create production database backup
# (Use your database provider's backup tool)

# 3. Run in production
NODE_ENV=production npm run migrate:pre-deployment
```

---

### Task 0.2: Fix User Sync Flow
**Time**: 3 hours  
**Priority**: 🔴 CRITICAL - Blocks user signups

#### Problem
Current webhook-based sync is unreliable, causes race conditions.

#### Solution
Implement client-side sync (file already exists, just needs integration).

File: `apps/web/src/app/layout.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import SyncUser from '@/components/sync-user';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SyncUser />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

#### Verification
```bash
# 1. Sign up new user
# 2. Verify user created in database immediately
# 3. Check no "User not found" errors
# 4. Test concurrent signups (10 users)
```

---

### Task 0.3: Fix Seat Booking Race Condition
**Time**: 4 hours  
**Priority**: 🔴 CRITICAL - Prevents double bookings

#### Problem
Multiple users can hold same seat simultaneously.

#### Solution
Add database-level locking and optimistic concurrency.

File: `packages/db/src/services/seat-state-machine.ts`

```typescript
async holdSeat(seatId: string, userId: string) {
  return await this.db.$transaction(
    async (tx) => {
      // 1. Lock seat for update
      const seat = await tx.$queryRaw<Seat[]>`
        SELECT * FROM seats 
        WHERE id = ${seatId} 
        FOR UPDATE
      `.then(rows => rows[0]);
      
      if (!seat) {
        throw new Error('Seat not found');
      }
      
      if (seat.status !== 'AVAILABLE') {
        throw new Error('Seat not available');
      }
      
      // 2. Check user doesn't already have a seat
      const existingSeat = await tx.seat.findFirst({
        where: {
          dinnerId: seat.dinnerId,
          userId: userId,
          status: { in: ['HELD', 'CONFIRMED', 'CHECKED_IN'] },
        },
      });
      
      if (existingSeat) {
        throw new Error('You already have a seat for this dinner');
      }
      
      // 3. Update seat atomically
      const updatedSeat = await tx.seat.update({
        where: { 
          id: seatId,
          status: 'AVAILABLE', // Double-check still available
        },
        data: {
          status: 'HELD',
          userId,
          heldUntil: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      
      // 4. Log state transition
      await tx.auditLog.create({
        data: {
          entityType: 'SEAT',
          entityId: seatId,
          action: 'HOLD',
          userId,
          metadata: { previousStatus: 'AVAILABLE' },
        },
      });
      
      return updatedSeat;
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  );
}
```

#### Verification
```bash
# Run concurrent booking test
npm run test:concurrent-bookings
```

File: `tests/concurrent-bookings.test.ts` (NEW FILE)

```typescript
import { describe, it, expect } from 'vitest';
import { SeatStateMachine } from '../packages/db/src/services/seat-state-machine';

describe('Concurrent Booking Test', () => {
  it('should prevent double bookings', async () => {
    const seatId = 'test-seat-id';
    const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
    
    // Try to book same seat concurrently
    const results = await Promise.allSettled(
      users.map(userId => 
        seatStateMachine.holdSeat(seatId, userId)
      )
    );
    
    // Only one should succeed
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(4);
  });
});
```

---

### Task 0.4: Security Hardening
**Time**: 3 hours  
**Priority**: 🔴 CRITICAL - Prevents attacks

#### Add Security Headers

File: `next.config.js`

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" 
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

#### Add Rate Limiting

```bash
npm install @upstash/ratelimit @upstash/redis --workspace=apps/web
```

File: `apps/web/src/middleware.ts` (NEW FILE)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiter (if Redis configured)
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    })
  : null;

export async function middleware(request: NextRequest) {
  // Rate limit sensitive endpoints
  if (request.nextUrl.pathname.startsWith('/api/seats')) {
    if (ratelimit) {
      const ip = request.ip ?? '127.0.0.1';
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);
      
      if (!success) {
        return new Response('Too Many Requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        });
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### Verify Payment Webhook Security

File: `apps/web/src/app/api/payments/webhook/route.ts`

```typescript
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature');
  
  // 1. Verify signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex');
  
  if (hash !== signature) {
    console.error('Invalid webhook signature');
    return new Response('Unauthorized', { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  // 2. Prevent replay attacks
  const eventId = event.id;
  const existing = await db.webhookEvent.findUnique({
    where: { externalId: eventId },
  });
  
  if (existing) {
    console.log('Duplicate webhook, ignoring');
    return new Response('OK', { status: 200 });
  }
  
  // 3. Store event
  await db.webhookEvent.create({
    data: {
      externalId: eventId,
      type: event.event,
      payload: event,
      processedAt: new Date(),
    },
  });
  
  // 4. Process event
  // ... existing logic
  
  return new Response('OK', { status: 200 });
}
```

---

### Task 0.5: Setup Monitoring
**Time**: 2 hours  
**Priority**: 🟠 HIGH - Detects production issues

#### Create Health Check Endpoint

File: `apps/web/src/app/api/health/route.ts` (NEW FILE)

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const checks = {
    database: false,
    bookingRate: false,
    emailDelivery: false,
  };
  
  const issues: string[] = [];
  
  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    issues.push('Database connection failed');
  }
  
  // Check booking success rate (last hour)
  try {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const totalBookings = await db.seat.count({
      where: { createdAt: { gte: hourAgo } },
    });
    
    const confirmedBookings = await db.seat.count({
      where: {
        createdAt: { gte: hourAgo },
        status: 'CONFIRMED',
      },
    });
    
    const rate = totalBookings > 0 ? confirmedBookings / totalBookings : 1;
    checks.bookingRate = rate >= 0.8;
    
    if (!checks.bookingRate) {
      issues.push(`Low booking rate: ${(rate * 100).toFixed(1)}%`);
    }
  } catch (error) {
    issues.push('Could not check booking rate');
  }
  
  const healthy = issues.length === 0;
  
  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      issues,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
```

#### Configure Monitoring

File: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/health",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 🔴 PHASE 1: CRITICAL BLOCKERS (REVISED)
**Duration**: 1 day  
**Priority**: 🔴 CRITICAL  
**Can Skip**: ❌ NO

### From Original Plan:
- ✅ Task 1.1: Fix booking confirmation flow (3h)
- ✅ Task 1.2: Remove exposed credentials (30m)

### Added Tasks:
- 🆕 Task 1.3: Trust enforcement automation (3h)
- 🆕 Task 1.4: Email retry queue (2h)

**Total**: 8.5 hours

---

## 🟠 PHASE 2: HIGH PRIORITY (REVISED)
**Duration**: 2.5-3 days  
**Priority**: 🟠 HIGH  
**Can Skip**: ⚠️ NOT RECOMMENDED

### From Original Plan:
- ✅ Task 2.1: Implement payment UI (4-6h)
- ✅ Task 2.2: Fix theme type errors (1-2h) - Run migration FIRST
- ✅ Task 2.3: Implement QR code display (2-3h)
- ✅ Task 2.4: Implement email notifications (3-4h)
- ✅ Task 2.5: Environment validation (1-2h)

### Added Tasks:
- 🆕 Task 2.6: Analytics tracking integration (3h)
- 🆕 Task 2.7: Restaurant admin assignment (2h)

**Total**: 18-23 hours

---

## 🟡 PHASE 3 & 4: UNCHANGED
All tasks from original plan remain the same.

---

## 📊 COMPLETE TIMELINE

| Phase | Duration | Can Skip? | Status |
|-------|----------|-----------|--------|
| Phase 0 | 1.5 days | ❌ NO | 🆕 NEW |
| Phase 1 | 1 day | ❌ NO | ✏️ REVISED |
| Phase 2 | 2.5-3 days | ⚠️ NOT RECOMMENDED | ✏️ REVISED |
| Phase 3 | 2-3 days | ✅ YES | ✅ UNCHANGED |
| Phase 4 | 2-3 days | ✅ YES | ✅ UNCHANGED |
| **TOTAL** | **9-12.5 days** | - | - |

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Phase 0 Completion:
- [ ] Database backups created
- [ ] Theme data migrated
- [ ] Indexes added
- [ ] User sync fixed and tested
- [ ] Race condition fixed and tested
- [ ] Security headers added
- [ ] Rate limiting implemented
- [ ] Payment webhook secured
- [ ] Monitoring setup
- [ ] Health checks working

### Ready for Phase 1:
- [ ] All Phase 0 tasks complete
- [ ] No critical errors in logs
- [ ] Test suite passing
- [ ] Staging environment tested

---

## 🎯 SUCCESS CRITERIA

### Phase 0:
- ✅ 10 concurrent signups succeed
- ✅ 10 concurrent bookings - only 1 succeeds per seat
- ✅ Payment webhook rejects invalid signatures
- ✅ Health check returns 200
- ✅ Theme displays correctly after migration

### Phase 1-2:
- ✅ All original plan success criteria
- ✅ Trust enforcement blocks unsafe users
- ✅ Analytics tracked for all events
- ✅ Restaurant admins can be assigned

---

## 🚀 DEPLOYMENT COMMAND SEQUENCE

```bash
# 1. Pre-deployment (Phase 0)
npm run migrate:pre-deployment
npm run test:concurrent-bookings
npm run test:user-sync
npm run check:security

# 2. Deploy to staging
vercel --env=staging

# 3. Test staging
npm run test:e2e:staging

# 4. Deploy to production
vercel --prod

# 5. Verify production
curl https://your-domain.com/api/health
```

---

**Document Version**: 2.0  
**Last Updated**: March 9, 2026  
**Status**: Ready for Implementation  
**Next Step**: Begin Phase 0
