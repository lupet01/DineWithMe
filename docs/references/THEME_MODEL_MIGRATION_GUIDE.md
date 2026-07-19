# Theme Model Migration Guide

## Overview

This migration replaces the simple `Dinner.theme` string field with a proper Theme model and relations. This enables:
- Structured theme data with descriptions and conversation starters
- Restaurant-specific theme enablement
- Consistent theme management across the platform

## Schema Changes

### New Models

#### Theme
```prisma
model Theme {
  id                   String   @id @default(cuid())
  key                  String   @unique
  title                String
  shortDescription     String
  whatToExpect         String   @db.Text
  boundaries           String   @db.Text
  conversationStarters Json
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

#### RestaurantEnabledTheme
```prisma
model RestaurantEnabledTheme {
  id           String   @id @default(cuid())
  restaurantId String
  themeId      String
  
  @@unique([restaurantId, themeId])
}
```

### Modified Models

#### Dinner
- **Removed**: `theme String?`
- **Added**: `themeId String` (required)
- **Added**: `theme Theme @relation(...)`

#### Restaurant
- **Added**: `enabledThemes RestaurantEnabledTheme[]`

## Migration Steps

### ⚠️ CRITICAL: This is a Breaking Change

**WARNING**: This migration will:
1. Remove the existing `theme` column from `dinners` table
2. Add a required `themeId` column
3. Require data migration for existing dinners

### Step 1: Backup Database

```bash
pg_dump -U postgres dinewithme > backup_before_theme_migration.sql
```

### Step 2: Create Seed Themes

Create initial theme data before migration:

```sql
-- Insert default themes
INSERT INTO themes (id, key, title, "shortDescription", "whatToExpect", boundaries, "conversationStarters", "isActive", "createdAt", "updatedAt")
VALUES 
  (
    'theme_default',
    'general-conversation',
    'General Conversation',
    'Open discussion on various topics',
    'A relaxed dinner where you can discuss anything from current events to personal interests. Perfect for meeting new people and having engaging conversations.',
    'Please be respectful of different viewpoints. Avoid overly controversial topics that might make others uncomfortable.',
    '["What brought you to this dinner?", "What''s been the highlight of your week?", "Any interesting projects you''re working on?"]',
    true,
    NOW(),
    NOW()
  );
```

### Step 3: Stop Application

```bash
# Stop all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 4: Data Migration Script

Create a migration script to convert existing theme strings to theme IDs:

```sql
-- Create a mapping of old theme strings to new theme IDs
-- This assumes you've created themes for each unique theme string

-- Example: Update dinners with theme "Tech Talk" to use tech-talk theme
UPDATE dinners 
SET "themeId" = (SELECT id FROM themes WHERE key = 'tech-talk')
WHERE theme = 'Tech Talk';

-- For dinners with NULL theme, use default
UPDATE dinners 
SET "themeId" = (SELECT id FROM themes WHERE key = 'general-conversation')
WHERE theme IS NULL;
```

### Step 5: Generate Prisma Client

```bash
cd apps/web
npx prisma generate --schema=../../prisma/schema.prisma
```

### Step 6: Apply Migration

**Option A: Using Prisma Migrate (Recommended for Production)**
```bash
npx prisma migrate dev --name add-theme-model --schema=../../prisma/schema.prisma
```

**Option B: Using db push (Development Only)**
```bash
npx prisma db push --schema=../../prisma/schema.prisma
```

### Step 7: Verify Migration

```sql
-- Check themes table
SELECT * FROM themes;

-- Check dinners have themeId
SELECT id, "themeId", "startsAt" FROM dinners LIMIT 10;

-- Check restaurant enabled themes
SELECT * FROM restaurant_enabled_themes;
```

### Step 8: Enable Themes for Restaurants

```sql
-- Enable all themes for all restaurants (initial setup)
INSERT INTO restaurant_enabled_themes ("id", "restaurantId", "themeId", "createdAt")
SELECT 
  gen_random_uuid(),
  r.id,
  t.id,
  NOW()
FROM restaurants r
CROSS JOIN themes t
WHERE t."isActive" = true;
```

## Code Changes Required

### 1. Dinner Repository

Update queries to include theme relation:

```typescript
// Before
const dinner = await prisma.dinner.findUnique({
  where: { id },
  include: { restaurant: true }
});

// After
const dinner = await prisma.dinner.findUnique({
  where: { id },
  include: { 
    restaurant: true,
    theme: true 
  }
});
```

### 2. Dinner Creation

Update to use themeId:

```typescript
// Before
await prisma.dinner.create({
  data: {
    restaurantId,
    theme: "Tech Talk",
    startsAt,
    endsAt,
    seatCount
  }
});

// After
await prisma.dinner.create({
  data: {
    restaurantId,
    themeId: selectedThemeId,
    startsAt,
    endsAt,
    seatCount
  }
});
```

### 3. API Responses

Update type definitions:

```typescript
// Before
interface DinnerDetail {
  id: string;
  theme: string | null;
  // ...
}

// After
interface DinnerDetail {
  id: string;
  theme: {
    id: string;
    key: string;
    title: string;
    shortDescription: string;
  };
  // ...
}
```

### 4. UI Components

Update to use theme object:

```typescript
// Before
<h2>{dinner.theme}</h2>

// After
<h2>{dinner.theme.title}</h2>
<p>{dinner.theme.shortDescription}</p>
```

## Rollback Plan

If migration fails:

```bash
# Restore from backup
psql -U postgres dinewithme < backup_before_theme_migration.sql

# Revert schema changes
git checkout HEAD -- prisma/schema.prisma

# Regenerate Prisma client
npx prisma generate --schema=../../prisma/schema.prisma
```

## Testing Checklist

- [ ] All existing dinners have valid themeId
- [ ] Dinner creation works with theme selection
- [ ] Dinner detail pages display theme information
- [ ] Restaurant theme enablement works
- [ ] Theme filtering works in discover page
- [ ] Analytics still track theme data
- [ ] Feedback references theme correctly

## Default Themes to Create

```typescript
const defaultThemes = [
  {
    key: 'general-conversation',
    title: 'General Conversation',
    shortDescription: 'Open discussion on various topics',
    whatToExpect: 'A relaxed dinner where you can discuss anything...',
    boundaries: 'Be respectful of different viewpoints...',
    conversationStarters: [
      'What brought you to this dinner?',
      'What\'s been the highlight of your week?',
      'Any interesting projects you\'re working on?'
    ]
  },
  {
    key: 'tech-innovators',
    title: 'Tech Innovators',
    shortDescription: 'Technology, startups, and innovation',
    whatToExpect: 'Discuss the latest in tech, share startup ideas...',
    boundaries: 'Keep discussions constructive and inclusive...',
    conversationStarters: [
      'What tech trend excites you most?',
      'Working on any interesting projects?',
      'Thoughts on AI and its impact?'
    ]
  },
  {
    key: 'creative-minds',
    title: 'Creative Minds',
    shortDescription: 'Art, design, and creative pursuits',
    whatToExpect: 'Share creative projects, discuss art and design...',
    boundaries: 'Respect all forms of creative expression...',
    conversationStarters: [
      'What creative projects are you working on?',
      'Favorite artists or designers?',
      'How do you find creative inspiration?'
    ]
  }
];
```

## Post-Migration Tasks

1. Create Theme repository
2. Create RestaurantEnabledTheme repository
3. Update Dinner repository methods
4. Update API endpoints
5. Update UI components
6. Update seed scripts
7. Update documentation

---

**Status**: Ready for implementation  
**Risk Level**: High (breaking change)  
**Estimated Time**: 2-3 hours  
**Rollback Time**: 15 minutes

