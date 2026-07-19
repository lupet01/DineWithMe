# EPIC 6: Theme Engine Implementation

## Strategic Context

Themes are not categories — they are **psychological safety contexts** that:
- Reduce conversion friction (people say "yes" easily)
- Set clear expectations (aligned mental models)
- Enable marketplace liquidity (tables fill predictably)
- Protect brand positioning (connection-first, not dating)
- Create measurement infrastructure (optimize over time)

## Design Principles

1. **Platform-Controlled**: DineWithMe owns the theme taxonomy
2. **Restaurant-Selected**: Restaurants choose from enabled themes
3. **Measurement-Ready**: Every theme generates performance data
4. **Future-Proof**: Architecture supports optimization without rewrites
5. **Safety-First**: Themes prevent mismatches and reduce risk

## MVP Theme Set (Rubric-Validated)

### 1. Social Table
- **Promise**: "Easy conversation, good energy, no pressure"
- **Psychology**: Default safe room, lowest friction, universal norms
- **Rubric**: Conversion 5, Clarity 5, Safety 5, Script 4, Repeatability 4
- **Business**: Highest addressable audience, best for early liquidity

### 2. New in Town
- **Promise**: "For newcomers building their circle"
- **Psychology**: Shared outsider status, instant bonding mechanism
- **Rubric**: Conversion 5, Clarity 5, Safety 5, Script 5, Repeatability 5
- **Business**: Highly motivated users, strong retention, referral effect

### 3. Professional Conversation
- **Promise**: "Curiosity-led career conversations — no pitching"
- **Psychology**: Reframes "networking" into safe human context
- **Rubric**: Conversion 4, Clarity 4, Safety 4, Script 5, Repeatability 5
- **Business**: Higher willingness to pay, corporate partnership potential

### 4. Women's Table
- **Promise**: "A space for women to connect comfortably"
- **Psychology**: Protective context design, reduces social risk
- **Rubric**: Conversion 5, Clarity 5, Safety 5, Script 4, Repeatability 5
- **Business**: Trust differentiator, strong retention, organizer effect

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     THEME ENGINE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────────┐               │
│  │   Theme      │──────│ Restaurant       │               │
│  │   (Platform) │      │ EnabledTheme     │               │
│  └──────────────┘      └──────────────────┘               │
│         │                       │                          │
│         │                       │                          │
│         └───────────┬───────────┘                          │
│                     │                                      │
│              ┌──────▼──────┐                               │
│              │   Dinner    │                               │
│              │  .themeId   │                               │
│              └─────────────┘                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Schema (Already Implemented)

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

  dinners              Dinner[]
  restaurantThemes     RestaurantEnabledTheme[]
}

model RestaurantEnabledTheme {
  id           String   @id @default(cuid())
  restaurantId String
  themeId      String
  createdAt    DateTime @default(now())

  restaurant Restaurant @relation(...)
  theme      Theme      @relation(...)

  @@unique([restaurantId, themeId])
}

model Dinner {
  id           String       @id @default(cuid())
  restaurantId String
  themeId      String       // Required relation
  // ... other fields

  theme        Theme        @relation(...)
}
```

## Implementation Tasks

### ✅ COMPLETED (During Theme Migration)

1. Schema updated with Theme and RestaurantEnabledTheme models
2. Dinner.theme string replaced with Dinner.themeId relation
3. Database migration applied
4. Prisma client regenerated
5. ThemeRepository created with full CRUD operations
6. DinnerRepository updated to include theme in queries
7. Initial themes seeded (5 themes)

### 🎯 REMAINING TASKS

#### Task 1: Seed Strategic Themes
**File**: `seed-strategic-themes.ts` (already created)

Run to replace initial themes with strategic MVP set:
```bash
npx tsx seed-strategic-themes.ts
```

This will:
- Deactivate old themes (tech-innovators, creative-minds, entrepreneurs, wellness-lifestyle)
- Create/update strategic themes (social, new-in-town, professional-conversation, womens-table)
- Maintain data integrity (existing dinners keep their theme references)

#### Task 2: Restaurant Theme Enablement UI
**Location**: `apps/web/src/app/admin/restaurant/components/theme-selector.tsx`

Create component for restaurant onboarding:
- Display all active themes with full descriptions
- Allow multi-select (checkboxes)
- Show "What to Expect" and "Boundaries" for each theme
- Save to RestaurantEnabledTheme table
- Default: enable all themes for new restaurants

**Integration Point**: Add to restaurant setup flow in `apps/web/src/app/admin/restaurant/page.tsx`

#### Task 3: Dinner Creation Theme Selection
**Location**: `apps/web/src/app/admin/dinners/components/dinner-form.tsx`

Update dinner creation form:
- Fetch restaurant's enabled themes
- Display as radio buttons or dropdown
- Show theme description on hover/expand
- Pre-select recommended theme based on:
  - Day of week (Tue/Wed → professional-conversation)
  - Time of day (evening → social, lunch → new-in-town)
  - Restaurant type (from restaurant.cuisine or custom field)

#### Task 4: Theme Display in User-Facing UI

**Discover Page** (`apps/web/src/app/(core)/discover/components/dinner-card.tsx`):
- Show theme.title and theme.shortDescription
- Add theme icon/badge
- Make theme filterable

**Dinner Detail** (`apps/web/src/app/(core)/dinner/[id]/components/dinner-info.tsx`):
- Display full theme information:
  - Title
  - Short description
  - What to Expect
  - Boundaries
  - Conversation Starters (expandable)

**My Dinners** (`apps/web/src/app/(core)/my-dinners/components/user-dinner-card.tsx`):
- Show theme badge/label

#### Task 5: Theme Filtering
**Location**: `apps/web/src/app/(core)/discover/components/dinner-filters.tsx`

Add theme filter:
- Fetch active themes
- Display as chips/buttons
- Allow multi-select
- Update URL params
- Filter dinners by themeId

#### Task 6: API Updates

**GET /api/dinners** (`apps/web/src/app/api/dinners/route.ts`):
- Add theme filter support
- Include theme in response (already done via DinnerRepository)

**POST /api/dinners** (`apps/web/src/app/api/dinners/route.ts`):
- Validate themeId exists
- Validate theme is enabled for restaurant
- Create dinner with themeId

**GET /api/restaurants/[id]/themes** (new endpoint):
- Return enabled themes for restaurant
- Used by dinner creation form

#### Task 7: Analytics Integration

Add theme tracking to existing events:
- `dinner_viewed`: include themeKey
- `seat_held`: include themeKey
- `seat_confirmed`: include themeKey
- `feedback_submitted`: include themeKey

New events:
- `theme_selected` (restaurant creates dinner)
- `theme_filtered` (user filters by theme)

#### Task 8: Theme Performance Dashboard (Admin)
**Location**: `apps/web/src/app/admin/analytics/themes/page.tsx` (new)

Display per theme:
- Total dinners created
- Average fill rate
- Average comfort score (from feedback)
- Attendance rate
- Repeat booking rate
- Reports/flags count

This enables data-driven theme optimization.

#### Task 9: Shared Types
**Location**: `packages/shared/src/types/theme.ts` (new)

```typescript
export interface ThemeDetail {
  id: string;
  key: string;
  title: string;
  shortDescription: string;
  whatToExpect: string;
  boundaries: string;
  conversationStarters: string[];
}

export interface ThemeCard {
  id: string;
  key: string;
  title: string;
  shortDescription: string;
}

export interface ThemePerformance {
  themeId: string;
  themeKey: string;
  themeTitle: string;
  totalDinners: number;
  avgFillRate: number;
  avgComfortScore: number;
  attendanceRate: number;
  repeatRate: number;
  flagCount: number;
}
```

#### Task 10: Migration for Existing Data

If there are existing dinners with old theme references:
```bash
npx tsx migrate-theme-data.ts
```

This script (already created) will:
- Map old theme strings to new theme IDs
- Update all dinners
- Enable themes for all restaurants

## Testing Checklist

### Data Layer
- [ ] ThemeRepository CRUD operations work
- [ ] RestaurantEnabledTheme creation/deletion works
- [ ] Dinner creation with themeId works
- [ ] Theme filtering in dinner queries works

### Restaurant Admin
- [ ] Restaurant can enable/disable themes
- [ ] Dinner creation shows only enabled themes
- [ ] Theme recommendation logic works
- [ ] Cannot create dinner with disabled theme

### User Experience
- [ ] Themes display correctly on discover page
- [ ] Theme filtering works
- [ ] Dinner detail shows full theme information
- [ ] Theme information is clear and inviting
- [ ] Conversation starters are visible

### Analytics
- [ ] Theme events are tracked
- [ ] Theme performance metrics calculate correctly
- [ ] Admin dashboard shows theme data

### Edge Cases
- [ ] What if restaurant has no enabled themes?
- [ ] What if theme is deactivated after dinners created?
- [ ] What if user filters by inactive theme?
- [ ] Migration handles all existing dinners

## Success Metrics (2-Week Test)

Track per theme:
1. **Conversion**: Detail view → seat hold rate ≥ 30%
2. **Completion**: Hold → confirm rate ≥ 60%
3. **Attendance**: Confirm → attended rate ≥ 80%
4. **Comfort**: Average comfort score ≥ 4/5
5. **Retention**: Repeat booking within 30 days ≥ 25%
6. **Safety**: Reports ≤ 2-3% of dinners

A theme is MVP-worthy if it meets 5/6 criteria.

## Phase 2 Enhancements (Future)

### Theme Optimization
- System-recommended themes based on performance
- A/B testing theme copy
- Dynamic theme creation based on demand

### Advanced Matching
- Soft preference signals (talkative vs quiet)
- Industry-themed variations (FinTech Night)
- Trust-weighted seat assignment within themes

### Theme Expansion
- Deep Talk (high trust required)
- Faith-based (carefully moderated)
- Industry-specific (after liquidity proven)

## Rollback Plan

If themes cause issues:
1. Revert to general-conversation theme for all dinners
2. Hide theme filtering from UI
3. Keep data model intact for future retry

## Documentation

- User-facing: Theme descriptions in app
- Restaurant-facing: Theme selection guide
- Admin-facing: Theme performance interpretation
- Developer-facing: This document

## Notes

- Themes are immutable per dinner once created (no retroactive changes)
- Theme deactivation doesn't affect existing dinners
- Restaurant enablement is flexible (can change anytime)
- Theme copy can be updated without schema changes
- All theme text is stored in database (not hardcoded)

---

**Status**: Schema complete, repositories ready, strategic themes defined
**Next Step**: Run `npx tsx seed-strategic-themes.ts` then build UI components
**Risk Level**: Low (backwards compatible, data preserved)
**Estimated Time**: 6-8 hours for full UI implementation
