# EPIC 3.3: Hold Expiry Mechanism - COMPLETE ✅

## What Was Built

### 1. Enhanced Repository Method
**File:** `packages/db/src/repositories/seat.repository.ts`

#### Updated Method: `expireHolds()`
```typescript
async expireHolds(): Promise<{
  count: number;
  expiredSeats: Array<{
    id: string;
    dinnerId: string;
    heldByUserId: string | null;
  }>;
}>
```

**Changes from EPIC 3.1:**
- ✅ Returns detailed information about expired seats
- ✅ Sets status to `AVAILABLE` (not `EXPIRED`) for immediate reuse
- ✅ Clears `heldByUserId` and `holdExpiresAt`
- ✅ Returns array of expired seats for analytics

**Logic:**
1. Find all seats with `status = HELD` and `holdExpiresAt <= now`
2. Update them to `AVAILABLE` status
3. Clear hold-related fields
4. Return count and details

### 2. Cron Endpoint
**File:** `apps/web/src/app/api/cron/expire-holds/route.ts`

#### GET/POST /api/cron/expire-holds?token=SECRET

**Features:**
- ✅ Token-based authentication
- ✅ Supports both GET and POST methods
- ✅ Emits analytics events for each expired seat
- ✅ Returns detailed execution report
- ✅ Logs execution time and results
- ✅ Proper error handling

**Security:**
- Requires `CRON_SECRET` environment variable
- Returns 401 if token is invalid or missing
- Returns 500 if CRON_SECRET not configured

**Response (Success):**
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

**Response (Unauthorized):**
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```

### 3. Vercel Cron Configuration
**File:** `vercel.json`

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

**Schedule:** Every minute (`* * * * *`)

**Note:** Vercel Cron requires Pro plan or higher. For free tier, use external cron service.

### 4. Environment Configuration
**Files:** `.env`, `.env.example`

#### New Environment Variable:
```env
CRON_SECRET=your-secret-token-here
```

**Production Setup:**
```bash
# Generate secure token
openssl rand -base64 32

# Add to Vercel environment variables
# Vercel Dashboard → Project → Settings → Environment Variables
```

### 5. Analytics Event
**File:** `packages/analytics/src/events.ts`

#### New Event: `SEAT_HOLD_EXPIRED`
```typescript
export interface SeatHoldExpiredEvent {
  seatId: string;
  dinnerId: string;
  userId: string | null;
  expiredAt: string;
  timestamp: string;
}
```

**Emitted when:**
- Cron job expires a held seat
- One event per expired seat

### 6. Comprehensive Documentation
**File:** `docs/jobs.md`

**Covers:**
- ✅ Job overview and purpose
- ✅ Endpoint documentation
- ✅ Security configuration
- ✅ Deployment instructions (Vercel, external services)
- ✅ Local development and testing
- ✅ Monitoring and analytics
- ✅ Troubleshooting guide
- ✅ Future enhancements

## How It Works

### Expiration Flow

```
1. Cron triggers every minute
   ↓
2. Validates CRON_SECRET token
   ↓
3. Calls seatRepository.expireHolds()
   ↓
4. Finds seats with:
   - status = HELD
   - holdExpiresAt <= now
   ↓
5. Updates seats to:
   - status = AVAILABLE
   - heldByUserId = null
   - holdExpiresAt = null
   ↓
6. Emits analytics event for each seat
   ↓
7. Returns count and details
```

### Seat Status Transition

```
HELD (expired) → AVAILABLE
```

**Why AVAILABLE instead of EXPIRED?**
- Seats become immediately available for new holds
- No need for cleanup job to convert EXPIRED → AVAILABLE
- Simpler state machine
- Better user experience (no "sold out" when seats are actually available)

## Deployment

### Free Option: GitHub Actions (Recommended) ⭐

**Cost: $0/month (saves $240/year vs Vercel Pro)**

GitHub Actions is completely free and perfect for running cron jobs.

**Quick Setup:**
1. Add secrets to GitHub (APP_URL, CRON_SECRET)
2. Commit `.github/workflows/expire-holds.yml`
3. Push to GitHub
4. Done! Runs every minute automatically

**See `GITHUB_ACTIONS_SETUP.md` for detailed instructions.**

**Other free alternatives:** See `FREE_CRON_SETUP.md` for Cron-job.org, EasyCron, UptimeRobot, etc.

---

### Vercel Cron (Requires Pro Plan - $20/month)

1. **Set Environment Variable:**
   ```bash
   # Generate secure token
   openssl rand -base64 32
   
   # Add to Vercel
   # Dashboard → Project → Settings → Environment Variables
   # Name: CRON_SECRET
   # Value: <generated-token>
   ```

2. **Deploy:**
   ```bash
   git push origin main
   # Vercel auto-deploys and enables cron
   ```

3. **Verify:**
   - Check Vercel Dashboard → Deployments → Functions
   - Look for cron execution logs
   - Should run every minute

### External Cron Services (Free Tier)

If using Vercel free tier, use external service:

#### Option 1: Cron-job.org
1. Sign up at https://cron-job.org
2. Create new cron job:
   - URL: `https://your-domain.com/api/cron/expire-holds?token=YOUR_SECRET`
   - Schedule: Every 1 minute
   - Method: GET

#### Option 2: GitHub Actions
Create `.github/workflows/expire-holds.yml`:
```yaml
name: Expire Seat Holds
on:
  schedule:
    - cron: '* * * * *'
jobs:
  expire:
    runs-on: ubuntu-latest
    steps:
      - run: curl "${{ secrets.APP_URL }}/api/cron/expire-holds?token=${{ secrets.CRON_SECRET }}"
```

## Testing

### Manual Trigger (Development)

```bash
# Using curl
curl "http://localhost:3001/api/cron/expire-holds?token=dev-secret-token-change-in-production"

# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/cron/expire-holds?token=dev-secret-token-change-in-production"
```

### Create Test Holds

```typescript
// 1. Hold a seat with 1-minute expiration
await fetch("/api/seats/hold", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    dinnerId: "YOUR_DINNER_ID",
    holdDurationMinutes: 1
  })
});

// 2. Wait 1 minute

// 3. Trigger cron
await fetch("/api/cron/expire-holds?token=dev-secret-token-change-in-production");

// 4. Check result
// Should show 1 expired seat
```

### Verify in Database

```sql
-- Before expiration
SELECT id, status, "holdExpiresAt" 
FROM seats 
WHERE status = 'HELD';

-- After expiration (should be empty)
SELECT id, status, "holdExpiresAt" 
FROM seats 
WHERE status = 'HELD';

-- Check available seats (should include expired ones)
SELECT COUNT(*) 
FROM seats 
WHERE status = 'AVAILABLE';
```

### Test Script

Create `test-expire-holds.ts`:
```typescript
import { config } from "dotenv";
config();

async function test() {
  const token = process.env.CRON_SECRET;
  const url = `http://localhost:3001/api/cron/expire-holds?token=${token}`;
  
  console.log("Triggering cron job...");
  const response = await fetch(url);
  const data = await response.json();
  
  console.log("Status:", response.status);
  console.log("Result:", JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log(`✅ Expired ${data.data.expiredCount} seats`);
  } else {
    console.log(`❌ Error: ${data.error.message}`);
  }
}

test();
```

Run:
```bash
npx tsx test-expire-holds.ts
```

## Monitoring

### Key Metrics

1. **Expiration Rate**
   - `seat_hold_expired` / `seat_held_success`
   - High rate (>50%) indicates holds are too short

2. **Job Duration**
   - Should be < 100ms for normal load
   - > 1s indicates performance issues

3. **Expired Seats per Run**
   - Average should be low (< 10)
   - Spikes indicate system issues

### Analytics Queries

```typescript
// Get expiration rate
const expired = await track.count(AnalyticsEvents.SEAT_HOLD_EXPIRED);
const held = await track.count(AnalyticsEvents.SEAT_HELD_SUCCESS);
const expirationRate = (expired / held) * 100;

console.log(`Expiration rate: ${expirationRate.toFixed(2)}%`);
```

### Database Queries

```sql
-- Seats about to expire (next 5 minutes)
SELECT 
  s.id,
  d.theme AS dinner_theme,
  s."holdExpiresAt",
  EXTRACT(EPOCH FROM (s."holdExpiresAt" - NOW())) / 60 AS minutes_remaining
FROM seats s
JOIN dinners d ON s."dinnerId" = d.id
WHERE s.status = 'HELD'
  AND s."holdExpiresAt" <= NOW() + INTERVAL '5 minutes'
ORDER BY s."holdExpiresAt" ASC;

-- Expiration history (last 24 hours)
SELECT 
  DATE_TRUNC('hour', "createdAt") AS hour,
  COUNT(*) AS expired_count
FROM audit_logs
WHERE "actionType" = 'seat_hold_expired'
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

## Security

### Token Generation

```bash
# Generate secure random token
openssl rand -base64 32

# Example output:
# 8xK9mP2nQ5vR7wT4yU6zA3bC1dE0fG8hI9jK2lM5nO7pQ
```

### Best Practices

1. **Never commit token to git**
   - Use environment variables only
   - Add to `.gitignore` if in file

2. **Rotate regularly**
   - Change every 90 days
   - Update in all environments

3. **Monitor for abuse**
   - Alert on repeated 401 errors
   - Track unusual patterns

4. **Use HTTPS only**
   - Never send token over HTTP
   - Vercel enforces HTTPS automatically

## Troubleshooting

### Issue: Seats not expiring

**Check:**
1. Is cron running?
   ```bash
   curl "http://localhost:3001/api/cron/expire-holds?token=YOUR_TOKEN"
   ```

2. Are there expired holds?
   ```sql
   SELECT COUNT(*) FROM seats 
   WHERE status = 'HELD' AND "holdExpiresAt" <= NOW();
   ```

3. Check logs for errors

**Solution:**
- Verify CRON_SECRET is set
- Check Vercel Cron is enabled (Pro plan)
- Test endpoint manually

### Issue: 401 Unauthorized

**Cause:** Token mismatch

**Solution:**
1. Check token in environment matches request
2. Regenerate token if needed
3. Update in all locations (Vercel, cron service, etc.)

### Issue: Slow performance

**Cause:** Too many expired seats

**Solution:**
1. Check database indexes exist
2. Consider batching (process 100 at a time)
3. Increase cron frequency during peak hours

## Future Enhancements

### 1. User Notifications
- Email when hold expires
- SMS reminder 2 minutes before expiration
- Push notification option

### 2. Hold Extension
- Allow one-time extension (5 minutes)
- Charge small fee for extension
- Limit to prevent abuse

### 3. Smart Expiration
- Adjust hold duration based on demand
- Longer holds during off-peak
- Shorter holds when dinner is filling up

### 4. Graceful Degradation
- If cron fails, expire on next seat hold attempt
- Background cleanup job as backup
- Alert on repeated failures

### 5. Analytics Dashboard
- Real-time expiration monitoring
- Hold duration distribution
- Conversion funnel (hold → confirm)

## Files Changed

### New Files:
- `apps/web/src/app/api/cron/expire-holds/route.ts` - Cron endpoint
- `vercel.json` - Vercel Cron configuration
- `docs/jobs.md` - Comprehensive documentation
- `EPIC_3.3_COMPLETE.md` - This document

### Modified Files:
- `packages/db/src/repositories/seat.repository.ts` - Enhanced expireHolds()
- `packages/analytics/src/events.ts` - Added SEAT_HOLD_EXPIRED event
- `.env` - Added CRON_SECRET
- `.env.example` - Added CRON_SECRET template

## Success Criteria ✅

- ✅ Cron endpoint implemented with token auth
- ✅ Repository method returns detailed results
- ✅ Vercel Cron configuration created
- ✅ Environment variables configured
- ✅ Analytics event emitted
- ✅ Comprehensive documentation
- ✅ Manual testing instructions
- ✅ Security best practices documented
- ✅ Troubleshooting guide included

## Status: READY FOR DEPLOYMENT

The hold expiry mechanism is complete and ready for deployment. Configure CRON_SECRET in your environment and deploy to enable automatic seat expiration.

## Quick Start

1. **Generate token:**
   ```bash
   openssl rand -base64 32
   ```

2. **Add to .env:**
   ```env
   CRON_SECRET=<generated-token>
   ```

3. **Test locally:**
   ```bash
   curl "http://localhost:3001/api/cron/expire-holds?token=<your-token>"
   ```

4. **Deploy to Vercel:**
   - Add CRON_SECRET to environment variables
   - Push to main branch
   - Cron runs automatically every minute

5. **Monitor:**
   - Check Vercel logs
   - Track `seat_hold_expired` analytics events
   - Query database for expired seats
