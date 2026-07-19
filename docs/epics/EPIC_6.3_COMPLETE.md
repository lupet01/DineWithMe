# EPIC 6.3: Integrate Themes into Dinner Creation - COMPLETE ✅

## Status: COMPLETED

All requirements for EPIC 6.3 have been implemented.

## ✅ Completed Requirements

### 1. Dinner Creation Form with Theme Selection

**File**: `apps/web/src/app/admin/dinners/components/dinner-form.tsx`

Features:
- Theme dropdown shows only enabled themes for the restaurant
- Theme selection is required
- Expandable theme details (shows short description)
- Warning message if no themes are enabled (with link to restaurant settings)
- Date picker (minimum: tomorrow)
- Time range inputs (start and end time)
- Seat count input (2-20 seats)
- Optional description field
- Form validation
- Loading states
- Error handling

**File**: `apps/web/src/app/admin/dinners/new/page.tsx`

- Server component that fetches restaurant and enabled themes
- Redirects to restaurant setup if no restaurant exists
- Passes enabled themes to form component
- Clean, centered layout

### 2. Backend Validation

**File**: `apps/web/src/app/admin/dinners/create-actions.ts`

#### `createDinner(input)` - Already implemented in EPIC 6.2
- Validates all required fields
- Checks user is restaurant owner
- Verifies theme exists and is active
- **CRITICAL**: Validates theme is enabled for restaurant
- Returns clear error message if theme is disabled
- Creates dinner with themeId
- Creates seats automatically
- Emits analytics event
- Logs audit trail

Validation checks:
- Required fields present
- Seat count between 2-20
- Valid date format
- End time after start time
- Start time in future
- User is restaurant owner
- Theme exists and is active
- **Theme is enabled for restaurant**

Error message when theme is disabled:
```
The "[Theme Title]" theme is not enabled for your restaurant. 
Please enable it in your restaurant settings first.
```

### 3. Theme Storage

**Schema**: Already implemented in EPIC 6.1
- `Dinner.themeId` (required string field)
- Foreign key relation to `Theme` table
- Indexed for performance

**Repository**: `packages/db/src/repositories/dinner.repository.ts`
- All dinner queries include theme relation
- Theme information returned in:
  - `findByIdWithRestaurant()`
  - `findPublicDinners()`
  - `findByIdWithDetails()`

### 4. Existing Dinners Unaffected

- Schema migration already applied (EPIC 6.1)
- All existing dinners have themeId
- No breaking changes to existing functionality
- Theme information is additive (doesn't remove any fields)

### 5. Analytics Event

**Event**: `dinner_created_with_theme`

**File**: `packages/analytics/src/events.ts`

Payload:
```typescript
{
  dinnerId: string;
  restaurantId: string;
  restaurantName: string;
  themeId: string;
  themeKey: string;
  themeTitle: string;
  seatCount: number;
  startsAt: string; // ISO timestamp
  userId: string;
  timestamp: string;
}
```

Emitted in `createDinner()` action after successful dinner creation.

### 6. Navigation Updates

**File**: `apps/web/src/app/admin/dinners/page.tsx`

- Added "Create Dinner" button in page header
- Links to `/admin/dinners/new`
- Styled consistently with existing UI

## 📁 Files Created

1. `apps/web/src/app/admin/dinners/components/dinner-form.tsx` - Dinner creation form
2. `apps/web/src/app/admin/dinners/new/page.tsx` - New dinner page
3. `test-dinner-creation.ts` - Test script
4. `EPIC_6.3_COMPLETE.md` - This document

## 📝 Files Modified

1. `apps/web/src/app/admin/dinners/page.tsx` - Added "Create Dinner" button
2. `apps/web/src/app/admin/dinners/create-actions.ts` - Updated analytics event name
3. `packages/analytics/src/events.ts` - Added `dinner_created_with_theme` event

## 🎨 UI Design

### Dinner Creation Form

```
┌─────────────────────────────────────────────────────────┐
│ Create New Dinner                                       │
│ Schedule a new dining experience for your guests        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Creating dinner for: The Local                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Table Theme *                                           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Select a theme...                          ▼    │   │
│ └─────────────────────────────────────────────────┘   │
│ ▸ View theme details                                   │
│                                                         │
│ Date *                                                  │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 2026-03-10                                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Start Time *          End Time *                        │
│ ┌──────────────┐     ┌──────────────┐                 │
│ │ 19:00        │     │ 21:00        │                 │
│ └──────────────┘     └──────────────┘                 │
│                                                         │
│ Number of Seats *                                       │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 6                                               │   │
│ └─────────────────────────────────────────────────┘   │
│ Between 2 and 20 seats                                 │
│                                                         │
│ Description (Optional)                                  │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Add any special notes about this dinner...      │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│ [Cancel]  [Create Dinner]                              │
└─────────────────────────────────────────────────────────┘
```

### Theme Dropdown (Expanded)

```
┌─────────────────────────────────────────────────────────┐
│ Table Theme *                                           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Social Table                               ▼    │   │
│ ├─────────────────────────────────────────────────┤   │
│ │ Social Table                                    │   │
│ │ New in Town                                     │   │
│ │ Professional Conversation                       │   │
│ │ Women's Table                                   │   │
│ └─────────────────────────────────────────────────┘   │
│ ▾ View theme details                                   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Easy conversation, good energy, no pressure     │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### No Themes Enabled Warning

```
┌─────────────────────────────────────────────────────────┐
│ Table Theme *                                           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ⚠️ No themes are enabled for your restaurant.   │   │
│ │ Please enable at least one theme in your        │   │
│ │ restaurant settings.                            │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🔄 User Flow

### Complete Dinner Creation Flow

1. **Navigate to Dinners**
   - User clicks "Dinners" in admin sidebar
   - Sees list of existing dinners
   - Clicks "Create Dinner" button

2. **Create Dinner Form**
   - Form loads with restaurant info
   - Theme dropdown shows only enabled themes
   - User selects theme (can view details)
   - User selects date (tomorrow or later)
   - User sets start and end times
   - User sets seat count (2-20)
   - User optionally adds description
   - User clicks "Create Dinner"

3. **Backend Validation**
   - Validates all fields
   - Checks user permissions
   - Verifies theme is enabled
   - Creates dinner with seats
   - Emits analytics event
   - Logs audit trail

4. **Success**
   - User redirected to dinners list
   - New dinner appears in table
   - Success feedback (via page refresh)

5. **Error Handling**
   - Clear error message displayed
   - Form remains filled (no data loss)
   - User can correct and resubmit

## 🧪 Testing

### Manual Testing

```bash
# 1. Run test script
npx tsx test-dinner-creation.ts

# Expected output:
# ✓ Restaurant has enabled themes
# ✓ Successfully created dinner with theme
# ✓ Dinner includes theme information
# ✓ Backend validation works
```

### UI Testing

1. **Navigate to dinner creation**:
   ```
   http://localhost:3001/admin/dinners
   Click "Create Dinner" button
   ```

2. **Test theme dropdown**:
   - Verify only enabled themes appear
   - Select different themes
   - Expand theme details
   - Verify description shows

3. **Test form validation**:
   - Try submitting without theme (should fail)
   - Try submitting with past date (should fail)
   - Try submitting with end time before start time (should fail)
   - Try submitting with seat count < 2 or > 20 (should fail)

4. **Test successful creation**:
   - Fill all required fields
   - Submit form
   - Verify redirect to dinners list
   - Check database: `SELECT * FROM dinners ORDER BY "createdAt" DESC LIMIT 1;`
   - Verify theme information included

5. **Test theme validation**:
   - Disable all themes for restaurant
   - Try to create dinner
   - Verify warning message appears
   - Verify "Create Dinner" button is disabled

### Integration Testing

```typescript
// Test dinner creation with enabled theme
const result = await createDinner({
  restaurantId: "...",
  themeId: "...", // Enabled theme
  startsAt: "2026-03-10T19:00:00Z",
  endsAt: "2026-03-10T21:00:00Z",
  seatCount: 6,
});

// Expected:
// result.success === true
// result.data.dinnerId exists

// Test dinner creation with disabled theme
const result2 = await createDinner({
  restaurantId: "...",
  themeId: "...", // Disabled theme
  startsAt: "2026-03-10T19:00:00Z",
  endsAt: "2026-03-10T21:00:00Z",
  seatCount: 6,
});

// Expected:
// result2.success === false
// result2.error === 'The "..." theme is not enabled...'
```

## 📊 Analytics Event Example

```typescript
{
  event: "dinner_created_with_theme",
  dinnerId: "cm...",
  restaurantId: "cm...",
  restaurantName: "The Local",
  themeId: "cm...",
  themeKey: "social",
  themeTitle: "Social Table",
  seatCount: 6,
  startsAt: "2026-03-10T19:00:00Z",
  userId: "cm...",
  timestamp: "2026-03-02T14:30:00Z"
}
```

## 🔒 Security & Validation

### Authorization
- User must be authenticated
- User must be restaurant owner
- User must own the restaurant for which dinner is being created

### Validation Rules
- Theme ID required
- Theme must exist
- Theme must be active
- **Theme must be enabled for restaurant**
- Date must be in future
- End time must be after start time
- Seat count must be 2-20
- All required fields must be present

### Error Messages
- Clear, actionable messages
- No technical jargon
- Directs user to solution

## 📈 Success Metrics

Track these metrics:

1. **Dinner Creation Rate**: # dinners created per restaurant per week
2. **Theme Distribution**: Which themes are most popular
3. **Form Completion Rate**: % of users who complete the form
4. **Validation Errors**: Most common validation failures
5. **Theme Enablement Impact**: Correlation between # enabled themes and dinner creation rate

Expected outcomes:
- 80%+ form completion rate
- <5% validation errors (theme not enabled)
- Social Table: 40-50% of dinners
- Professional Conversation: 25-30% of dinners
- New in Town: 15-20% of dinners
- Women's Table: 10-15% of dinners

## 🚀 Next Steps (EPIC 6.4)

With dinner creation complete, next phase is user-facing theme display:

1. **Discover Page** - Display theme information on dinner cards
2. **Dinner Detail** - Show full theme content
3. **Theme Filtering** - Allow users to filter by theme
4. **Theme Badges** - Visual theme indicators

See `THEME_IMPLEMENTATION_STATUS.md` for detailed roadmap.

## 📚 Related Documentation

- `EPIC_6.1_COMPLETE.md` - Theme schema implementation
- `EPIC_6.2_COMPLETE.md` - Restaurant theme enablement
- `EPIC_6_THEME_ENGINE.md` - Full theme engine strategy
- `THEME_IMPLEMENTATION_STATUS.md` - Overall status and roadmap

## 🎯 Requirements Checklist

- [x] Theme dropdown shows only enabled themes for restaurant
- [x] Backend validates themeId is enabled for restaurant
- [x] Dinner stores themeId
- [x] Existing dinners unaffected
- [x] Analytics event `dinner_created_with_theme` emitted
- [x] Clear error messages
- [x] Form validation
- [x] Loading states
- [x] Navigation integration

---

**EPIC 6.3 Status**: ✅ COMPLETE
**Date Completed**: March 2, 2026
**UI Implemented**: Yes (Dinner creation form with theme selection)
**Validation Implemented**: Yes (Theme enablement check)
**Analytics Implemented**: Yes (`dinner_created_with_theme` event)
**Testing**: Manual test script provided
