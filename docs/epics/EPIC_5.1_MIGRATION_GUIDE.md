# EPIC 5.1: Post-Dinner Feedback Schema - Migration Guide

## Overview

This guide walks you through applying the database schema changes for post-dinner feedback, trust events, and mutual interests.

## Schema Changes

### New Models

1. **Feedback** - Post-dinner feedback from users
2. **MutualInterest** - Track mutual interest between users at dinners

### Updated Models

1. **TrustEvent** - Extended with new event types and sourceDinnerId field
2. **User** - Added relations for feedback and mutual interests
3. **Dinner** - Added relations for feedback and mutual interests

### New Enums

1. **FeedbackSentiment** - GREAT, GOOD, NEUTRAL, UNCOMFORTABLE
2. **ComfortLevel** - FULL, MOSTLY, LOW

### Updated Enums

1. **TrustEventType** - Added: ATTENDED, LEFT_EARLY, POSITIVE_FEEDBACK, NEGATIVE_FEEDBACK, REPORTED

## Migration Steps

### Step 1: Stop the Dev Server

```bash
# Press Ctrl+C to stop the running server
```

### Step 2: Generate Prisma Client

```bash
cd apps/web
npx prisma generate --schema=../../prisma/schema.prisma
```

### Step 3: Push Schema to Database

```bash
npx prisma db push --schema=../../prisma/schema.prisma
```

This will:
- Create the `feedback` table
- Create the `mutual_interests` table
- Add `sourceDinnerId` column to `trust_events` table
- Update enum types
- Create necessary indexes

### Step 4: Verify Migration

```bash
# Check the database
npx prisma studio --schema=../../prisma/schema.prisma
```

Verify:
- `feedback` table exists
- `mutual_interests` table exists
- `trust_events` has `sourceDinnerId` column
- Enums are updated

### Step 5: Restart Dev Server

```bash
npm run dev
```

## Troubleshooting

### Issue: Prisma Generate Fails

**Solution**: Stop the dev server first
```bash
# Stop server (Ctrl+C)
.\fix-prisma-generate.ps1
```

### Issue: Database Connection Error

**Solution**: Check PostgreSQL is running
```bash
psql -U postgres -d dinewithme
```

### Issue: Enum Migration Fails

**Solution**: The enums are extended, not replaced. Existing values remain valid.

### Issue: Foreign Key Constraints

**Solution**: The schema uses `onDelete: Cascade` for cleanup. No manual intervention needed.

## Schema Details

### Feedback Table

```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  dinner_id TEXT NOT NULL REFERENCES dinners(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  overall_sentiment TEXT NOT NULL, -- GREAT, GOOD, NEUTRAL, UNCOMFORTABLE
  comfort_level TEXT NOT NULL, -- FULL, MOSTLY, LOW
  would_dine_again BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_dinner_id ON feedback(dinner_id);
CREATE INDEX idx_feedback_author_id ON feedback(author_id);
CREATE INDEX idx_feedback_target_user_id ON feedback(target_user_id);
CREATE INDEX idx_feedback_dinner_author ON feedback(dinner_id, author_id);
```

### Mutual Interests Table

```sql
CREATE TABLE mutual_interests (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dinner_id TEXT NOT NULL REFERENCES dinners(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id, dinner_id)
);

CREATE INDEX idx_mutual_interests_user_a ON mutual_interests(user_a_id);
CREATE INDEX idx_mutual_interests_user_b ON mutual_interests(user_b_id);
CREATE INDEX idx_mutual_interests_dinner ON mutual_interests(dinner_id);
```

### Trust Events Update

```sql
ALTER TABLE trust_events 
  ADD COLUMN source_dinner_id TEXT REFERENCES dinners(id);

ALTER TABLE trust_events
  ALTER COLUMN weight TYPE FLOAT;

CREATE INDEX idx_trust_events_source_dinner ON trust_events(source_dinner_id);
```

## Data Migration

### No Data Migration Needed

This is a new feature, so no existing data needs to be migrated. The changes are:
- New tables (empty)
- New columns (nullable)
- Extended enums (backward compatible)

### Optional: Backfill Trust Events

If you want to backfill trust events with dinner references:

```sql
-- This is optional and can be done later
UPDATE trust_events
SET source_dinner_id = (metadata->>'dinnerId')::TEXT
WHERE metadata->>'dinnerId' IS NOT NULL;
```

## Testing the Migration

### Test 1: Create Feedback

```typescript
const feedback = await feedbackRepository.create({
  dinner: { connect: { id: dinnerId } },
  author: { connect: { id: authorId } },
  overallSentiment: "GREAT",
  comfortLevel: "FULL",
  wouldDineAgain: true,
  notes: "Amazing experience!",
});
```

### Test 2: Create Mutual Interest

```typescript
const mutualInterest = await mutualInterestRepository.create(
  userAId,
  userBId,
  dinnerId
);
```

### Test 3: Create Trust Event with Dinner

```typescript
const trustEvent = await trustEventRepository.createPositiveFeedbackEvent(
  userId,
  feedbackId,
  dinnerId,
  3
);
```

## Rollback (If Needed)

If you need to rollback:

```bash
# Drop new tables
psql -U postgres -d dinewithme

DROP TABLE IF EXISTS mutual_interests CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;

# Remove column from trust_events
ALTER TABLE trust_events DROP COLUMN IF EXISTS source_dinner_id;

# Revert enums (complex, better to keep them)
```

## Next Steps

After migration:
1. ✅ Schema updated
2. ✅ Repositories created
3. ✅ Zod schemas created
4. ⏳ API endpoints (EPIC 5.2)
5. ⏳ UI components (EPIC 5.3)

---

**Status**: Ready for migration  
**Estimated Time**: 2-3 minutes  
**Risk Level**: Low (new tables, backward compatible)
