# EPIC 5.6: Trust Pattern Detection - COMPLETE ✅

## Summary

Successfully implemented trust pattern detection to identify users with repeated negative signals. The system automatically flags users who have 3+ negative feedback or reported events across 3+ separate dinners, and provides an admin endpoint to recalculate all trust profiles.

## What Was Completed

### 1. Extended TrustProfile Model ✅

Added new fields to track user behavior patterns:

```prisma
model TrustProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  trustScore      Float    @default(0.5)      // Bounded 0-1
  attendanceRate  Float    @default(1.0)      // Percentage attended (0-1)
  flagged         Boolean  @default(false)    // Pattern detected
  lastEvaluatedAt DateTime @default(now()) @updatedAt
  createdAt       DateTime @default(now())
}
```

#### New Fields
- `attendanceRate` - Percentage of confirmed dinners actually attended (0-1)
- `flagged` - Boolean flag for users with repeated negative signals
- `lastEvaluatedAt` - Timestamp of last evaluation (renamed from lastUpdated)

#### Indexes
- `flagged` - For querying flagged users
- `trustScore` - For sorting by trust
- `userId` - For lookups

### 2. Pattern Detection Logic ✅

#### Flagging Criteria
User is flagged if ALL conditions are met:
1. ✅ 3 or more NEGATIVE_FEEDBACK or REPORTED trust events
2. ✅ Events span across 3 or more separate dinners
3. ✅ Events are linked to specific dinners (sourceDinnerId not null)

#### Detection Algorithm
```typescript
async detectNegativePattern(userId: string) {
  // 1. Get all NEGATIVE_FEEDBACK and REPORTED events
  const negativeEvents = await findEvents({
    userId,
    type: ["NEGATIVE_FEEDBACK", "REPORTED"]
  });

  // 2. Count unique dinners
  const uniqueDinners = new Set(
    negativeEvents
      .filter(e => e.sourceDinnerId !== null)
      .map(e => e.sourceDinnerId)
  );

  // 3. Check criteria
  const shouldFlag = 
    negativeEvents.length >= 3 && 
    uniqueDinners.size >= 3;

  return { shouldFlag, negativeEventCount, uniqueDinnerCount };
}
```

### 3. Attendance Rate Calculation ✅

Tracks how reliably users attend confirmed dinners:

```typescript
attendanceRate = (ATTENDED + COMPLETED) / (CONFIRMED + ATTENDED + COMPLETED + NO_SHOW)
```

- Includes only seats where user confirmed
- Defaults to 1.0 (perfect) if no history
- Updated during trust profile evaluation

### 4. Trust Profile Repository Methods ✅

#### Pattern Detection
- `detectNegativePattern(userId)` - Check if user meets flagging criteria
- `calculateAttendanceRate(userId)` - Calculate attendance percentage
- `evaluateUser(userId)` - Full evaluation (attendance + pattern detection)
- `recalculateAll()` - Evaluate all users (admin function)

#### User Management
- `getFlaggedUsers()` - Get all flagged users
- `unflagUser(userId)` - Remove flag (admin action)

#### Evaluation Results
```typescript
{
  profile: TrustProfile;
  attendanceRate: number;
  patternDetection: {
    shouldFlag: boolean;
    negativeEventCount: number;
    uniqueDinnerCount: number;
  };
}
```

### 5. Admin API Endpoint ✅

Created `POST /api/trust/recalculate` (admin only)

#### Authentication
- Requires PLATFORM_ADMIN role
- Returns 403 for non-admin users

#### Response Format
```typescript
{
  success: true,
  data: {
    totalEvaluated: number;
    flaggedCount: number;
    flaggedUsers: [
      {
        userId: string;
        email: string;
        trustScore: number;
        attendanceRate: number;
        negativeEventCount: number;
        uniqueDinnerCount: number;
      }
    ]
  }
}
```

#### What It Does
1. Evaluates all users in the system
2. Recalculates attendance rates
3. Detects negative patterns
4. Updates flagged status
5. Returns list of flagged users
6. Tracks analytics event

### 6. Analytics Event ✅

#### trust_recalculated
Emitted when admin runs recalculation:
```typescript
{
  adminUserId: string;
  adminEmail: string;
  totalEvaluated: number;
  flaggedCount: number;
  timestamp: string;
}
```

## Files Created/Modified

### Created
- `apps/web/src/app/api/trust/recalculate/route.ts` - Admin recalculation endpoint
- `EPIC_5.6_COMPLETE.md` - This file

### Modified
- `prisma/schema.prisma` - Extended TrustProfile model
- `packages/db/src/repositories/trust-profile.repository.ts` - Added pattern detection methods
- `packages/analytics/src/events.ts` - Added trust_recalculated event

## Pattern Detection Examples

### Example 1: User Gets Flagged

**Scenario:**
- User attends 5 dinners
- Receives negative feedback at 3 different dinners
- Gets reported at 1 dinner

**Events:**
```
Dinner A: NEGATIVE_FEEDBACK (weight: -0.1)
Dinner B: NEGATIVE_FEEDBACK (weight: -0.1)
Dinner C: NEGATIVE_FEEDBACK (weight: -0.1)
Dinner D: REPORTED (weight: -0.2)
```

**Result:**
- Total negative events: 4
- Unique dinners: 4
- Criteria met: ✅ (4 >= 3 events, 4 >= 3 dinners)
- **User is flagged**

### Example 2: User Not Flagged (Same Dinner)

**Scenario:**
- User attends 3 dinners
- Receives 3 negative feedbacks all from Dinner A

**Events:**
```
Dinner A: NEGATIVE_FEEDBACK (from User 1)
Dinner A: NEGATIVE_FEEDBACK (from User 2)
Dinner A: NEGATIVE_FEEDBACK (from User 3)
```

**Result:**
- Total negative events: 3
- Unique dinners: 1
- Criteria met: ❌ (3 >= 3 events, but 1 < 3 dinners)
- **User is NOT flagged**

### Example 3: User Not Flagged (Insufficient Events)

**Scenario:**
- User attends 5 dinners
- Receives negative feedback at 2 dinners

**Events:**
```
Dinner A: NEGATIVE_FEEDBACK
Dinner B: NEGATIVE_FEEDBACK
```

**Result:**
- Total negative events: 2
- Unique dinners: 2
- Criteria met: ❌ (2 < 3 events)
- **User is NOT flagged**

### Example 4: User Unflagged After Review

**Scenario:**
- User was flagged
- Admin reviews and determines false positive
- Admin calls unflag endpoint

**Action:**
```typescript
await trustProfileRepository.unflagUser(userId);
```

**Result:**
- `flagged` set to false
- `lastEvaluatedAt` updated
- User can continue using platform normally

## Attendance Rate Examples

### Example 1: Perfect Attendance
```
Confirmed: 5 dinners
Attended: 5 dinners
No-shows: 0

attendanceRate = 5 / 5 = 1.0 (100%)
```

### Example 2: One No-Show
```
Confirmed: 5 dinners
Attended: 4 dinners
No-shows: 1

attendanceRate = 4 / 5 = 0.8 (80%)
```

### Example 3: Multiple No-Shows
```
Confirmed: 10 dinners
Attended: 7 dinners
No-shows: 3

attendanceRate = 7 / 10 = 0.7 (70%)
```

### Example 4: New User
```
Confirmed: 0 dinners
Attended: 0 dinners

attendanceRate = 1.0 (default, benefit of doubt)
```

## Admin Usage

### Run Recalculation

```bash
# As admin user
curl -X POST http://localhost:3001/api/trust/recalculate \
  -H "Cookie: <admin-session-cookie>"
```

### Response Example
```json
{
  "success": true,
  "data": {
    "totalEvaluated": 150,
    "flaggedCount": 3,
    "flaggedUsers": [
      {
        "userId": "user123",
        "email": "problem@example.com",
        "trustScore": 0.25,
        "attendanceRate": 0.6,
        "negativeEventCount": 5,
        "uniqueDinnerCount": 4
      },
      {
        "userId": "user456",
        "email": "another@example.com",
        "trustScore": 0.3,
        "attendanceRate": 0.8,
        "negativeEventCount": 3,
        "uniqueDinnerCount": 3
      }
    ]
  }
}
```

### When to Run
- After major feedback submissions
- Weekly/monthly maintenance
- After policy changes
- When investigating user reports
- Before generating trust reports

## Database Queries

### Get Flagged Users
```sql
SELECT 
  u.email,
  tp."trustScore",
  tp."attendanceRate",
  tp.flagged,
  tp."lastEvaluatedAt"
FROM trust_profiles tp
JOIN users u ON u.id = tp."userId"
WHERE tp.flagged = true
ORDER BY tp."trustScore" ASC;
```

### Get User's Negative Events
```sql
SELECT 
  te.type,
  te.weight,
  te."sourceDinnerId",
  d.theme as dinner_theme,
  te."createdAt",
  te.metadata
FROM trust_events te
LEFT JOIN dinners d ON d.id = te."sourceDinnerId"
WHERE te."userId" = $1
  AND te.type IN ('NEGATIVE_FEEDBACK', 'REPORTED')
ORDER BY te."createdAt" DESC;
```

### Count Negative Events by Dinner
```sql
SELECT 
  te."sourceDinnerId",
  d.theme,
  COUNT(*) as negative_count
FROM trust_events te
LEFT JOIN dinners d ON d.id = te."sourceDinnerId"
WHERE te."userId" = $1
  AND te.type IN ('NEGATIVE_FEEDBACK', 'REPORTED')
  AND te."sourceDinnerId" IS NOT NULL
GROUP BY te."sourceDinnerId", d.theme
ORDER BY negative_count DESC;
```

### Trust Profile Statistics
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE flagged = true) as flagged_users,
  AVG("trustScore") as avg_trust_score,
  AVG("attendanceRate") as avg_attendance_rate,
  MIN("trustScore") as min_trust_score,
  MAX("trustScore") as max_trust_score
FROM trust_profiles;
```

## Security & Privacy

### What Admins Can See
- Flagged user list
- Trust scores
- Attendance rates
- Negative event counts
- Event details (type, dinner, date)

### What Admins Cannot See
- Specific feedback content
- Who gave the feedback
- Private notes from safety flags

### No Automatic Bans
- Per requirements, flagging does NOT ban users
- Flagged status is for admin review only
- Admins must manually take action
- Users continue to have platform access

### Audit Trail
- All recalculations tracked in analytics
- Admin actions logged
- Timestamp of last evaluation
- Can review historical patterns

## Future Enhancements

### Automated Actions (Future)
- Email alerts to admins when user flagged
- Require additional verification for flagged users
- Limit booking frequency for flagged users
- Automatic review after X days

### Pattern Refinement (Future)
- Weight events by recency (recent events matter more)
- Consider event severity (REPORTED > NEGATIVE_FEEDBACK)
- Factor in positive feedback ratio
- Adjust thresholds based on platform data

### Admin Dashboard (Future)
- Visual trust score distributions
- Flagged user management interface
- Pattern detection trends
- Bulk unflag operations
- Export flagged user reports

### User Appeals (Future)
- Allow users to appeal flagged status
- Provide context for flagging
- Review process workflow
- Automatic unflag after improvement

## Testing

### Manual Testing

1. Create test user
2. Create 3 completed dinners with user
3. Submit negative feedback for user at each dinner
4. Run recalculation endpoint
5. Verify user is flagged
6. Check flagged users list
7. Unflag user
8. Verify flag removed

### Test Scenarios

- 3 negative events, 3 dinners → Flagged
- 3 negative events, 2 dinners → Not flagged
- 2 negative events, 3 dinners → Not flagged
- 5 negative events, 1 dinner → Not flagged
- Perfect attendance → attendanceRate = 1.0
- 50% attendance → attendanceRate = 0.5
- New user → attendanceRate = 1.0 (default)

### Edge Cases

- User with no events → Not flagged
- User with only positive events → Not flagged
- Events without sourceDinnerId → Not counted
- Deleted dinners → Events still counted
- Multiple evaluations → Last result wins

## Monitoring

### Key Metrics
```sql
-- Flagged user rate
SELECT 
  COUNT(*) FILTER (WHERE flagged = true)::float / COUNT(*) * 100 as flagged_rate_pct
FROM trust_profiles;

-- Average negative events per flagged user
SELECT AVG(negative_count) FROM (
  SELECT 
    te."userId",
    COUNT(*) as negative_count
  FROM trust_events te
  JOIN trust_profiles tp ON tp."userId" = te."userId"
  WHERE tp.flagged = true
    AND te.type IN ('NEGATIVE_FEEDBACK', 'REPORTED')
  GROUP BY te."userId"
) sub;

-- Attendance rate distribution
SELECT 
  CASE 
    WHEN "attendanceRate" >= 0.9 THEN 'Excellent (90-100%)'
    WHEN "attendanceRate" >= 0.7 THEN 'Good (70-90%)'
    WHEN "attendanceRate" >= 0.5 THEN 'Fair (50-70%)'
    ELSE 'Poor (<50%)'
  END as attendance_tier,
  COUNT(*) as user_count
FROM trust_profiles
GROUP BY attendance_tier
ORDER BY MIN("attendanceRate") DESC;
```

---

**Status**: ✅ Complete  
**Database**: ✅ Migrated  
**Pattern Detection**: ✅ Implemented  
**Admin Endpoint**: ✅ Working  
**No Automatic Bans**: ✅ Confirmed  
**Ready for**: Admin dashboard and monitoring

