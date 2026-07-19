# UI Polish Plan - Match Figma Designs

## Summary of Changes Completed

✅ Fixed React theme object error
✅ Fixed back button functionality  
✅ Hidden bottom nav on dinner detail pages
✅ Made CTA button non-sticky
✅ Improved error messages for bookings
✅ Created cleanup script for expired holds

## Remaining UI Polish Tasks

### 1. Color Scheme Update
- Primary color: `#FF6B4A` (coral/orange)
- Background: `#FAF9F7` (warm cream)
- Cards: Pure white with soft shadows
- Text: Warmer grays

### 2. Discovery Page ("Browse Tables")
**Current vs Target:**
- ✅ Cards already have images
- ❌ Need rounded corners (20px instead of 12px)
- ❌ Add attendee avatars at bottom
- ❌ Simplify info display
- ❌ Add distance indicator

**Changes:**
```tsx
// dinner-card.tsx
- rounded-xl → rounded-2xl
- Add circular orange avatars for attendees
- Show: spots left, theme, time, attendees
- Remove: full date/time range, description
```

### 3. Dinner Detail Page
**Current vs Target:**
- ✅ Hero image with gradient
- ✅ Back button works
- ❌ Need "Table Details" card with icon badges
- ❌ Need "Who's Coming" section with avatars
- ❌ Need "Dietary Notes" textarea
- ❌ CTA should be inline (done ✅)

**Changes:**
```tsx
// dinner-info.tsx
- Add circular icon badges (coral background)
- Group into "Table Details" card
- Add "Who's Coming" section
- Add dietary preferences textarea
```

### 4. Confirmation Page ("You're In!")
**Current vs Target:**
- ❌ Need large checkmark icon
- ❌ Need countdown timer card
- ❌ Need "What's Next?" section
- ❌ Need "Preview Icebreaker Questions" button

**Changes:**
```tsx
// confirmation-success.tsx
- Add large coral checkmark circle
- Add countdown timer
- Add numbered "What's Next" steps
- Add icebreaker preview button
```

### 5. My Reservations Page
**Current vs Target:**
- ❌ Need "Upcoming" and "Past Meals" sections
- ❌ Need countdown badge on upcoming
- ❌ Need smaller cards for past meals

**Changes:**
```tsx
// my-dinners-content.tsx
- Separate upcoming/past sections
- Add countdown badge
- Different card styles for past
```

### 6. Global Styling
- Update Tailwind config with new colors
- Add custom rounded-2xl class
- Update shadow utilities
- Add icon badge component

## Implementation Priority

1. **High Priority** (Blocks $15K milestone):
   - Dietary preferences field
   - Confirmation page improvements
   - My Reservations layout

2. **Medium Priority** (Polish):
   - Color scheme update
   - Discovery card improvements
   - Icon badges

3. **Low Priority** (Nice-to-have):
   - Attendee avatars
   - Countdown timers
   - Icebreaker preview

## Estimated Time

- High Priority: 4-6 hours
- Medium Priority: 3-4 hours
- Low Priority: 2-3 hours

**Total: 9-13 hours of work**

## Next Steps

1. Update Tailwind config with new colors
2. Create IconBadge component
3. Update dinner-card.tsx
4. Update dinner-info.tsx with dietary field
5. Rebuild confirmation page
6. Update my-dinners layout

Would you like me to proceed with these changes?
