# Background Jobs Documentation

## Overview

This document describes the background jobs and cron tasks used in the DineWithMe application.

## Jobs

### 1. Expire Seat Holds

**Purpose:** Automatically release seats that have been held past their expiration time.

**Endpoint:** `GET /api/cron/expire-holds?token=YOUR_CRON_SECRET`

**Schedule:** Every minute (`* * * * *`)

**What it does:**
1. Finds all seats with status `HELD` and `holdExpiresAt < now`
2. Updates them to status `AVAILABLE`
3. Clears `heldByUserId` and `holdExpiresAt`
4. Emits analytics event `seat_hold_expired` for each expired seat
5. Returns count of expired seats

**Response:**
```json
{
  "success": true,
  "data": {
    "expiredCount": 3,
    "duration": "45ms",
    "timestamp": "2026-03-01T15:30:00.000Z",
    "expiredSeats": [
      {
        "seatId": "cmm7xxx...",
        "dinnerId": "cmm7xxx...",
        "userId": "cmm7xxx..."
      }
    ]
  }
}
```

**Security:**
- Requires `CRON_SECRET` environment variable
- Token must be passed as query parameter
- Returns 401 if token is invalid or missing

**Configuration:**
```env
CRON_SECRET=your-secret-token-here
```

**Manual Trigger (Development):**
```bash
curl "http://localhost:3001/api/cron/expire-holds?token=dev-secret-token-change-in-production"
```

**Vercel Cron (Production):**
Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-holds?token=$CRON_SECRET",
      "schedule": "* * * * *"
    }
  ]
}
```

## Deployment

### Free Option: GitHub Actions (Recommended) ⭐

GitHub Actions is completely free and provides 2,000 minutes/month for private repos (unlimited for public).

**Setup (5 minutes):**

1. **Workflow file already created:** `.github/workflows/expire-holds.yml`

2. **Add secrets to GitHub:**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add `APP_URL`: Your deployed URL (e.g., `https://your-app.vercel.app`)
   - Add `CRON_SECRET`: Your cron secret token

3. **Commit and push:**
   ```bash
   git add .github/workflows/expire-holds.yml
   git commit -m "Add GitHub Actions cron"
   git push origin main
   ```

4. **Verify:** Repository → Actions → Expire Seat Holds

**Pros:**
- ✅ Completely free ($0/month vs Vercel's $20/month)
- ✅ No external dependencies
- ✅ Easy to monitor (Actions tab)
- ✅ Manual trigger available
- ✅ Reliable (GitHub infrastructure)

**See `FREE_CRON_SETUP.md` for more free alternatives (Cron-job.org, EasyCron, etc.)**

---

### Vercel Cron (Requires Pro Plan - $20/month)

1. **Set Environment Variable:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add `CRON_SECRET` with a secure random value
   - Example: `openssl rand -base64 32`

2. **Deploy:**
   - Vercel automatically reads `vercel.json`
   - Cron jobs are enabled on Pro plan and above
   - Free tier: Use external cron service

3. **Monitor:**
   - View cron logs in Vercel Dashboard → Deployments → Functions
   - Check analytics for `seat_hold_expired` events

### External Cron Services

If not using Vercel Cron, you can use:

#### 1. Cron-job.org
- Free service for HTTP cron jobs
- Set URL: `https://your-domain.com/api/cron/expire-holds?token=YOUR_SECRET`
- Schedule: Every 1 minute
- Method: GET

#### 2. EasyCron
- Similar to cron-job.org
- Supports more advanced scheduling

#### 3. GitHub Actions
```yaml
name: Expire Seat Holds
on:
  schedule:
    - cron: '* * * * *'  # Every minute
jobs:
  expire-holds:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron endpoint
        run: |
          curl "${{ secrets.APP_URL }}/api/cron/expire-holds?token=${{ secrets.CRON_SECRET }}"
```

#### 4. AWS EventBridge
- Create scheduled rule
- Target: HTTP endpoint
- Add authorization header with token

## Development

### Local Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Trigger manually:**
   ```bash
   curl "http://localhost:3001/api/cron/expire-holds?token=dev-secret-token-change-in-production"
   ```

3. **Create test holds:**
   ```typescript
   // In browser console or test script
   await fetch("/api/seats/hold", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       dinnerId: "YOUR_DINNER_ID",
       holdDurationMinutes: 1  // Expires in 1 minute
     })
   });
   
   // Wait 1 minute, then trigger cron
   await fetch("/api/cron/expire-holds?token=dev-secret-token-change-in-production");
   ```

4. **Check database:**
   ```sql
   SELECT id, status, "heldByUserId", "holdExpiresAt" 
   FROM seats 
   WHERE status = 'HELD' 
   ORDER BY "holdExpiresAt" ASC;
   ```

### Testing Script

Create `test-expire-holds.ts`:
```typescript
import { config } from "dotenv";
config();

async function testExpireHolds() {
  const token = process.env.CRON_SECRET;
  const url = `http://localhost:3001/api/cron/expire-holds?token=${token}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log("Result:", data);
}

testExpireHolds();
```

Run:
```bash
npx tsx test-expire-holds.ts
```

## Monitoring

### Key Metrics

1. **Expiration Rate**
   - Track `seat_hold_expired` events
   - High rate may indicate holds are too short

2. **Job Duration**
   - Should be < 1 second for normal load
   - Slow jobs indicate database performance issues

3. **Job Failures**
   - Monitor error logs
   - Set up alerts for repeated failures

### Analytics Queries

```typescript
// Get expiration rate
const expired = await track.count(AnalyticsEvents.SEAT_HOLD_EXPIRED);
const held = await track.count(AnalyticsEvents.SEAT_HELD_SUCCESS);
const expirationRate = (expired / held) * 100;

// Get average hold duration before expiration
// (requires custom analytics implementation)
```

### Database Queries

```sql
-- Check for seats about to expire
SELECT 
  s.id,
  s."dinnerId",
  s."heldByUserId",
  s."holdExpiresAt",
  EXTRACT(EPOCH FROM (s."holdExpiresAt" - NOW())) / 60 AS minutes_remaining
FROM seats s
WHERE s.status = 'HELD'
  AND s."holdExpiresAt" IS NOT NULL
ORDER BY s."holdExpiresAt" ASC
LIMIT 10;

-- Check expiration history (from audit logs)
SELECT 
  "createdAt",
  "entityId" AS seat_id,
  metadata->>'dinnerId' AS dinner_id,
  metadata->>'userId' AS user_id
FROM audit_logs
WHERE "actionType" = 'seat_hold_expired'
ORDER BY "createdAt" DESC
LIMIT 20;
```

## Troubleshooting

### Issue: Cron not running

**Symptoms:**
- Seats remain HELD past expiration
- No `seat_hold_expired` events

**Solutions:**
1. Check Vercel Cron is enabled (Pro plan required)
2. Verify `CRON_SECRET` is set in environment
3. Check cron logs in Vercel Dashboard
4. Test endpoint manually with curl

### Issue: 401 Unauthorized

**Symptoms:**
- Cron returns 401 error
- Logs show "Invalid or missing token"

**Solutions:**
1. Verify `CRON_SECRET` matches in:
   - Environment variables
   - `vercel.json` configuration
   - External cron service
2. Check for trailing spaces in token
3. Regenerate token if compromised

### Issue: Slow performance

**Symptoms:**
- Job takes > 1 second
- Database timeouts

**Solutions:**
1. Check database indexes:
   ```sql
   -- Should exist:
   CREATE INDEX IF NOT EXISTS "seats_status_holdExpiresAt_idx" 
   ON seats (status, "holdExpiresAt");
   ```
2. Optimize query (already optimized in repository)
3. Consider batching if > 1000 seats expire at once

### Issue: Seats not expiring

**Symptoms:**
- Cron runs successfully
- But seats remain HELD

**Solutions:**
1. Check system time is correct
2. Verify `holdExpiresAt` is in the past:
   ```sql
   SELECT NOW(), "holdExpiresAt" 
   FROM seats 
   WHERE status = 'HELD' 
   LIMIT 5;
   ```
3. Check for database transaction issues
4. Review repository method logic

## Security

### Best Practices

1. **Strong Secret:**
   ```bash
   # Generate secure token
   openssl rand -base64 32
   ```

2. **Rotate Regularly:**
   - Change `CRON_SECRET` every 90 days
   - Update in all environments

3. **Restrict Access:**
   - Don't expose token in logs
   - Don't commit to version control
   - Use environment variables only

4. **Monitor:**
   - Alert on repeated 401 errors
   - Track unusual expiration patterns
   - Log all cron executions

### Rate Limiting

Consider adding rate limiting to prevent abuse:

```typescript
// In route.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "1 m"),
});

// In GET handler
const { success } = await ratelimit.limit("cron:expire-holds");
if (!success) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
}
```

## Future Enhancements

### 1. Notification System
- Email users when their hold expires
- SMS reminders before expiration
- Push notifications

### 2. Graceful Expiration
- Warn users 2 minutes before expiration
- Allow hold extension (one-time)
- Auto-retry payment if failed

### 3. Analytics Dashboard
- Real-time expiration monitoring
- Hold duration distribution
- Conversion rate (hold → confirmed)

### 4. Smart Scheduling
- Adjust cron frequency based on load
- Run more frequently during peak hours
- Batch processing for off-peak

### 5. Distributed Locking
- Prevent duplicate cron executions
- Use Redis or database locks
- Handle multi-region deployments

## Related Documentation

- [Seat Lifecycle Reference](../SEAT_LIFECYCLE_REFERENCE.md)
- [EPIC 3.2: Seat Hold](../EPIC_3.2_COMPLETE.md)
- [EPIC 3.3: Hold Expiry](../EPIC_3.3_COMPLETE.md)
- [Analytics Events](../packages/analytics/src/events.ts)


---

### 2. Mark No-Shows

**Purpose:** Automatically mark users as NO_SHOW when they don't check in to confirmed seats.

**Endpoint:** `GET /api/cron/mark-no-shows?token=YOUR_CRON_SECRET`

**Schedule:** Every 5-10 minutes (`*/5 * * * *` or `*/10 * * * *`)

**What it does:**
1. Finds all seats with status `CONFIRMED` where:
   - Dinner started more than 30 minutes ago
   - No `checkedInAt` timestamp
   - Dinner status is `SCHEDULED` or `LIVE`
2. Updates them to status `NO_SHOW`
3. Creates negative trust event (weight: -10) for each user
4. Emits analytics event `seat_no_show_marked` for each no-show
5. Returns count of marked seats

**Response:**
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

**Security:**
- Requires `CRON_SECRET` environment variable
- Token must be passed as query parameter
- Returns 401 if token is invalid or missing

**Manual Trigger (Development):**
```bash
curl "http://localhost:3001/api/cron/mark-no-shows?token=dev-secret-token-change-in-production"
```

**GitHub Actions Setup:**

Add to `.github/workflows/mark-no-shows.yml`:
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

**Vercel Cron (Production):**

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

**Trust System:**

Each no-show creates a trust event:
- Type: `NO_SHOW`
- Weight: `-10` (negative impact)
- Metadata: `{ seatId, dinnerId, markedAt }`

Users can view their trust score:
```typescript
const stats = await trustEventRepository.getUserTrustStats(userId);
// {
//   totalScore: -20,
//   noShowCount: 2,
//   attendanceCount: 5,
//   eventCount: 7
// }
```

**Future Penalties:**
- Block booking after 3 no-shows
- Require deposit for users with low trust score
- Send warning emails after first no-show
- Escalating penalties (1st: warning, 2nd: deposit, 3rd: block)
