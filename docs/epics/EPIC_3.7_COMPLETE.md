# EPIC 3.7: No-Show Marking Job - ✅ COMPLETE & TESTED

## What Was Built

### 1. TrustEvent Model
**File:** `prisma/schema.prisma`

#### New Model: `TrustEvent`
```prisma
model TrustEvent {
  id        String          @id @default(cuid())
  userId    String
  type      TrustEventType
  weight    Int             // Positive or negative impact
  metadata  Json?           // Additional context
  createdAt DateTime        @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@map("trust_events")
}

enum TrustEventType {
  NO_SHOW
  LATE_CANCELLATION
  CONFIRMED_ATTENDANCE
  POSITIVE_REVIEW
  NEGATIVE_REVIEW
}
```

**Purpose:**
- Track user behavior that affects trust/reputation
- Positive events: attendance, good reviews (+points)
- Negative events: no-shows, late cancellations (-points)
- Calculate trust scores for users

### 2. TrustEvent Repository
**File:** `packages/db/src/repositories/trust-event.repository.ts`

#### Key Methods:

**`createNoShowEvent()`**
```typescript
async createNoShowEvent(
  userId: string,
  seatId: string,
  dinnerId: string,
  weight: number = -10
): Promise<TrustEvent>
```
Creates a negative trust event for no-shows.

**`createAttendanceEvent()`**
```typescript
async createAttendanceEvent(
  userId: string,
  seatId: string,
  dinnerId: string,
  weight: number = 5
): Promise<TrustEvent>
```
Creates a positive trust event for confirmed attendance.

**`calculateTrustScore()`**
```typescript
async calculateTrustScore(userId: string): Promise<number>
```
Calculates total trust score (sum of all event weights).

**`getUserTrustStats()`**
```typescript
async getUserTrustStats(userId: string): Promise<{
  totalScore: number;
  noShowCount: number;
  attendanceCount: number;
  eventCount: number;
}>
```
Gets comprehensive trust statistics for a user.

### 3. Seat Repository Method
**File:** `packages/db/src/repositories/seat.repository.ts`

#### Method: `markNoShows()`
```typescript
async markNoShows(thresholdMinutes: number = 30): Promise<Array<{
  seatId: string;
  userId: string;
  dinnerId: string;
  dinnerTheme: string;
}>>
```

**What it does:**
1. Finds all CONFIRMED seats where:
   - Dinner started more than 30 minutes ago
   - No `checkedInAt` timestamp
   - Dinner status is SCHEDULED or LIVE
2. Updates them to status NO_SHOW
3. Returns details for trust event creation

**Query Logic:**
```typescript
where: {
  status: "CONFIRMED",
  checkedInAt: null,
  confirmedByUserId: { not: null },
  dinner: {
    startsAt: { lte: thresholdTime },
    status: { in: ["SCHEDULED", "LIVE"] },
  },
}
```

### 4. Cron Endpoint
**File:** `apps/web/src/app/api/cron/mark-no-shows/route.ts`

#### GET/POST /api/cron/mark-no-shows?token=SECRET

**Request:**
```bash
GET /api/cron/mark-no-shows?token=your-cron-secret
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "markedCount": 2,
    "seats": [
      {
        "seatId": "cmm7xxx...",
        "userId": "cmm7xxx...",
        "dinnerId": "cmm7xxx...",
        "dinnerTheme": "Italian Night"
      }
    ],
    "trustEventsCreated": 2
  }
}
```

**Response (Error - Invalid Token):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid or missing token",
    "code": "UNAUTHORIZED"
  }
}
```

**Features:**
- ✅ Token-based authentication
- ✅ Marks no-shows (30 min threshold)
- ✅ Creates trust events (-10 weight)
- ✅ Emits analytics events
- ✅ Returns detailed results
- ✅ Supports both GET and POST

### 5. Analytics Event
**File:** `packages/analytics/src/events.ts`

#### New Event: `SEAT_NO_SHOW_MARKED`

**Event Payload:**
```typescript
interface SeatNoShowMarkedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  dinnerTheme: string;
  minutesAfterStart: number;
  timestamp: string;
}
```

### 6. Test Script
**File:** `test-mark-no-shows.ts`

#### Test Scenarios:
1. ✅ Mark no-show for past dinner (45 min ago)
2. ✅ Don't mark if checked in
3. ✅ Don't mark if too recent (< 30 min)
4. ✅ API endpoint and trust events

**Run Tests:**
```powershell
npx tsx test-mark-no-shows.ts
```

## No-Show Detection Logic

### Criteria

A seat is marked as NO_SHOW when ALL of these are true:

1. ✅ Seat status is `CONFIRMED`
2. ✅ No `checkedInAt` timestamp
3. ✅ Has `confirmedByUserId` (user confirmed the seat)
4. ✅ Dinner started more than 30 minutes ago
5. ✅ Dinner status is `SCHEDULED` or `LIVE`

### Timeline Example

```
Dinner starts at 7:00 PM

6:30 PM - Check-in opens
7:00 PM - Dinner starts
7:30 PM - No-show threshold (30 min after start)
7:35 PM - Cron runs, marks no-shows

User A: Checked in at 6:45 PM → ✅ ATTENDED
User B: Checked in at 7:15 PM → ✅ ATTENDED
User C: Never checked in → ❌ NO_SHOW (marked at 7:35 PM)
```

### Why 30 Minutes?

- Gives users grace period for late arrival
- Balances between being lenient and holding users accountable
- Aligns with check-in window (30 min after start)
- Can be configured via `thresholdMinutes` parameter

## Trust System

### Trust Event Weights

| Event Type | Weight | Description |
|------------|--------|-------------|
| NO_SHOW | -10 | User didn't show up to confirmed seat |
| LATE_CANCELLATION | -5 | Cancelled within policy cutoff |
| CONFIRMED_ATTENDANCE | +5 | Checked in and attended |
| POSITIVE_REVIEW | +3 | Left positive review |
| NEGATIVE_REVIEW | -3 | Received negative review |

### Trust Score Calculation

```typescript
// Get user's trust score
const score = await trustEventRepository.calculateTrustScore(userId);

// Example:
// - 5 attendances: +25
// - 2 no-shows: -20
// - 1 positive review: +3
// Total: +8
```

### Trust Statistics

```typescript
const stats = await trustEventRepository.getUserTrustStats(userId);

// Result:
{
  totalScore: 8,
  noShowCount: 2,
  attendanceCount: 5,
  eventCount: 8
}
```

### Future Penalties

Based on trust score, implement:

1. **Warning (score < 0)**
   - Email notification
   - Display warning on profile

2. **Deposit Required (score < -20)**
   - Require refundable deposit for bookings
   - Released after successful attendance

3. **Booking Restriction (score < -30)**
   - Limit to 1 booking at a time
   - Cannot book premium dinners

4. **Account Suspension (score < -50)**
   - Temporary booking ban
   - Must contact support to restore

## Cron Setup

### Schedule Recommendation

**Every 10 minutes:** `*/10 * * * *`

Why 10 minutes?
- Frequent enough to catch no-shows quickly
- Not too frequent to overload database
- Balances timeliness with resource usage

### GitHub Actions (Free)

Create `.github/workflows/mark-no-shows.yml`:

```yaml
name: Mark No-Shows

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  mark-no-shows:
    runs-on: ubuntu-latest
    steps:
      - name: Mark no-shows
        run: |
          curl -f "${{ secrets.APP_URL }}/api/cron/mark-no-shows?token=${{ secrets.CRON_SECRET }}" || exit 1
```

**Setup:**
1. Add secrets to GitHub:
   - `APP_URL`: Your deployed URL
   - `CRON_SECRET`: Your cron secret token
2. Commit and push workflow file
3. Verify in Actions tab

### Vercel Cron (Pro Plan - $20/month)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-holds?token=$CRON_SECRET",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/mark-no-shows?token=$CRON_SECRET",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### Manual Testing

```bash
# Development
curl "http://localhost:3001/api/cron/mark-no-shows?token=dev-secret-token-change-in-production"

# Production
curl "https://your-app.vercel.app/api/cron/mark-no-shows?token=YOUR_SECRET"
```

## API Usage Examples

### Call Endpoint

```typescript
const response = await fetch(
  "/api/cron/mark-no-shows?token=YOUR_SECRET"
);

const data = await response.json();

if (data.success) {
  console.log("Marked:", data.data.markedCount);
  console.log("Trust events:", data.data.trustEventsCreated);
  
  data.data.seats.forEach(seat => {
    console.log(`- ${seat.dinnerTheme}: ${seat.userId}`);
  });
}
```

### Check User Trust Score

```typescript
import { trustEventRepository } from "@dinewithme/db";

// Get trust score
const score = await trustEventRepository.calculateTrustScore(userId);
console.log("Trust score:", score);

// Get detailed stats
const stats = await trustEventRepository.getUserTrustStats(userId);
console.log("No-shows:", stats.noShowCount);
console.log("Attendances:", stats.attendanceCount);
console.log("Total score:", stats.totalScore);
```

### Get User's Trust Events

```typescript
const events = await trustEventRepository.findByUser(userId);

events.forEach(event => {
  console.log(`${event.type}: ${event.weight} points`);
  console.log(`  Created: ${event.createdAt}`);
  console.log(`  Metadata:`, event.metadata);
});
```

## Database Queries

### Find No-Shows

```sql
-- Get all no-shows
SELECT 
  s.id AS seat_id,
  u.email AS user_email,
  d.theme AS dinner_theme,
  d."startsAt" AS dinner_start,
  s."updatedAt" AS marked_at
FROM seats s
JOIN users u ON s."confirmedByUserId" = u.id
JOIN dinners d ON s."dinnerId" = d.id
WHERE s.status = 'NO_SHOW'
ORDER BY s."updatedAt" DESC
LIMIT 20;
```

### Trust Events by User

```sql
-- Get user's trust events
SELECT 
  type,
  weight,
  metadata,
  "createdAt"
FROM trust_events
WHERE "userId" = 'YOUR_USER_ID'
ORDER BY "createdAt" DESC;
```

### Trust Leaderboard

```sql
-- Top users by trust score
SELECT 
  u.email,
  u."firstName",
  u."lastName",
  SUM(te.weight) AS trust_score,
  COUNT(CASE WHEN te.type = 'NO_SHOW' THEN 1 END) AS no_shows,
  COUNT(CASE WHEN te.type = 'CONFIRMED_ATTENDANCE' THEN 1 END) AS attendances
FROM users u
LEFT JOIN trust_events te ON u.id = te."userId"
GROUP BY u.id, u.email, u."firstName", u."lastName"
ORDER BY trust_score DESC
LIMIT 10;
```

### Users with Low Trust

```sql
-- Users with negative trust scores
SELECT 
  u.email,
  SUM(te.weight) AS trust_score,
  COUNT(CASE WHEN te.type = 'NO_SHOW' THEN 1 END) AS no_shows
FROM users u
LEFT JOIN trust_events te ON u.id = te."userId"
GROUP BY u.id, u.email
HAVING SUM(te.weight) < 0
ORDER BY trust_score ASC;
```

## Testing

### Test Results

```
✅ Test 1: Mark no-show for past dinner
✅ Test 2: Don't mark if checked in
✅ Test 3: Don't mark if too recent (< 30 min)
✅ Test 4: API endpoint and trust events (requires dev server)
```

### Manual Testing Steps

1. **Create test dinner:**
   ```sql
   -- Create dinner that started 45 minutes ago
   INSERT INTO dinners (id, "restaurantId", theme, description, "startsAt", "endsAt", "seatCount", status)
   VALUES (
     'test_dinner_id',
     'YOUR_RESTAURANT_ID',
     'Test Dinner',
     'For testing no-shows',
     NOW() - INTERVAL '45 minutes',
     NOW() + INTERVAL '1 hour 15 minutes',
     5,
     'LIVE'
   );
   ```

2. **Create confirmed seat:**
   ```sql
   INSERT INTO seats (id, "dinnerId", status, "confirmedByUserId")
   VALUES (
     'test_seat_id',
     'test_dinner_id',
     'CONFIRMED',
     'YOUR_USER_ID'
   );
   ```

3. **Call cron endpoint:**
   ```bash
   curl "http://localhost:3001/api/cron/mark-no-shows?token=YOUR_SECRET"
   ```

4. **Verify:**
   ```sql
   -- Check seat status
   SELECT status FROM seats WHERE id = 'test_seat_id';
   -- Should be: NO_SHOW
   
   -- Check trust event
   SELECT * FROM trust_events 
   WHERE "userId" = 'YOUR_USER_ID' 
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   -- Should have: type = NO_SHOW, weight = -10
   ```

## Monitoring

### Key Metrics

1. **No-Show Rate**
   - `SEAT_NO_SHOW_MARKED` / `SEAT_CONFIRMED`
   - Should be <10% for healthy system

2. **Average Trust Score**
   - Track across all users
   - Declining scores indicate issues

3. **Job Performance**
   - Execution time
   - Number of seats marked per run

### Analytics Queries

```typescript
// Get no-show rate
const confirmed = await track.count(AnalyticsEvents.SEAT_CONFIRMED);
const noShows = await track.count(AnalyticsEvents.SEAT_NO_SHOW_MARKED);
const noShowRate = (noShows / confirmed) * 100;

console.log(`No-show rate: ${noShowRate.toFixed(2)}%`);

// Get no-shows by dinner
const noShowEvents = await track.query(AnalyticsEvents.SEAT_NO_SHOW_MARKED);
const byDinner = noShowEvents.reduce((acc, event) => {
  acc[event.dinnerTheme] = (acc[event.dinnerTheme] || 0) + 1;
  return acc;
}, {});

console.log("No-shows by dinner:", byDinner);
```

## Security

### Token Protection

```bash
# Generate secure token
openssl rand -base64 32

# Add to .env
CRON_SECRET=your-generated-token-here
```

### Best Practices

1. ✅ Use strong random token
2. ✅ Rotate token every 90 days
3. ✅ Never commit to version control
4. ✅ Use environment variables only
5. ✅ Monitor for unauthorized access

## Files Changed

### New Files:
- `packages/db/src/repositories/trust-event.repository.ts` - Trust event repository
- `apps/web/src/app/api/cron/mark-no-shows/route.ts` - Cron endpoint
- `test-mark-no-shows.ts` - Test script
- `EPIC_3.7_COMPLETE.md` - This document

### Modified Files:
- `prisma/schema.prisma` - Added TrustEvent model and enum
- `packages/db/src/repositories/index.ts` - Export TrustEventRepository
- `packages/db/src/repositories/seat.repository.ts` - Added markNoShows method
- `packages/analytics/src/events.ts` - Added SEAT_NO_SHOW_MARKED event
- `docs/jobs.md` - Added no-show marking documentation

## Success Criteria ✅

- ✅ TrustEvent model created
- ✅ TrustEventRepository implemented
- ✅ markNoShows() method in SeatRepository
- ✅ GET/POST /api/cron/mark-no-shows endpoint
- ✅ Token-based authentication
- ✅ 30-minute threshold after dinner start
- ✅ Creates negative trust events (-10 weight)
- ✅ Emits analytics events
- ✅ Test script created and passing
- ✅ Documentation complete
- ✅ Database schema migrated

## Status: ✅ COMPLETE & TESTED

The no-show marking job is complete and tested. All validation logic works correctly.

### Test Results

```
✅ Test 1: Mark no-show for past dinner (45 min ago)
✅ Test 2: Don't mark if checked in
✅ Test 3: Don't mark if too recent (< 30 min)
✅ Test 4: API endpoint and trust events
```

All criteria working correctly:
- ✅ Only marks CONFIRMED seats
- ✅ Only if no check-in recorded
- ✅ Only if dinner started > 30 min ago
- ✅ Only for SCHEDULED or LIVE dinners
- ✅ Creates trust events with -10 weight
- ✅ Emits analytics events

## Quick Test

```powershell
# Run test script
npx tsx test-mark-no-shows.ts

# Test API endpoint (requires dev server)
curl "http://localhost:3001/api/cron/mark-no-shows?token=dev-secret-token-change-in-production"

# Check trust events in database
psql -U postgres -d dinewithme -c "SELECT * FROM trust_events ORDER BY created_at DESC LIMIT 5;"
```

## Next Steps

- EPIC 3.8: Check-out endpoint
- EPIC 3.9: Trust score display in UI
- EPIC 3.10: Penalty system based on trust score
- EPIC 3.11: Email notifications for no-shows
- EPIC 3.12: Deposit requirement for low trust users
