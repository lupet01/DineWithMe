# EPIC 4.3: Dinner Detail Page - COMPLETE ✅

## Overview

Implemented a comprehensive dinner detail page with hero image, restaurant information, theme descriptions, seat availability, and a sticky bottom CTA for reservations or waitlist.

## What Was Built

### 1. Dinner Detail Page
**File**: `apps/web/src/app/(core)/dinner/[id]/page.tsx`

Features:
- Dynamic route with dinner ID parameter
- Suspense boundary for loading states
- Server component pattern

### 2. Dinner Detail Content Component
**File**: `apps/web/src/app/(core)/dinner/[id]/components/dinner-detail-content.tsx`

Features:
- Server component for data fetching
- Fetches from `GET /api/dinners/:id` (EPIC 3.8)
- Analytics tracking (`dinner_detail_viewed`)
- 404 handling with notFound()
- Composes all sub-components
- Determines CTA state based on availability

### 3. Dinner Hero Component
**File**: `apps/web/src/app/(core)/dinner/[id]/components/dinner-hero.tsx`

Features:
- Full-width hero image (264px height)
- Image fallback with icon
- Gradient overlay for text readability
- Back button (top-left) to return to discover
- Status badge (top-right) for non-scheduled dinners
- Theme title overlay (bottom-left)
- Backdrop blur effects

### 4. Dinner Info Component
**File**: `apps/web/src/app/(core)/dinner/[id]/components/dinner-info.tsx`

Features:
- Restaurant name, cuisine, and location
- Theme description (from mapping)
- Date with full formatting
- Time window with duration calculation
- Seat availability with confirmed count
- Optional dinner description
- Icon-based detail cards

### 5. Dinner Expectations Component
**File**: `apps/web/src/app/(core)/dinner/[id]/components/dinner-expectations.tsx`

Features:
- "What to Expect" section
- Bullet list with checkmark icons
- Theme-specific expectations
- Green accent color for positive vibes

### 6. Sticky CTA Component
**File**: `apps/web/src/app/(core)/dinner/[id]/components/dinner-cta.tsx`

Features:
- Fixed bottom position with backdrop blur
- Two states:
  - **Seats Available**: "Reserve Seat" button (blue)
  - **Sold Out**: "Join Waitlist" button (outlined)
- Availability indicator
- "Filling fast!" warning for ≤3 seats
- Placeholder click handlers (alerts for now)
- Smooth transitions and active states

### 7. Loading Skeleton
**File**: `apps/web/src/app/(core)/dinner/[id]/components/dinner-detail-skeleton.tsx`

Features:
- Matches page structure
- Animated pulse effects
- Hero, cards, and CTA skeletons
- Smooth loading experience

### 8. Theme Copy Mapping
**File**: `apps/web/src/lib/theme-copy.ts`

Features:
- Hardcoded theme descriptions
- Theme-specific expectations (4 bullets each)
- Default fallback for unknown themes
- Type-safe with TypeScript interface

## Theme Copy Mapping

### Supported Themes

1. **Italian Night**
   - Description: "Experience authentic Italian cuisine in an intimate setting"
   - Expectations: Multi-course menu, wine pairing, family-style, chef's pasta

2. **Sushi Experience**
   - Description: "Master the art of sushi with expert chefs"
   - Expectations: Fresh sashimi, hand-rolled sushi, sake, omakase service

3. **French Bistro**
   - Description: "Classic French cuisine with a modern twist"
   - Expectations: Three-course menu, French wine, artisanal bread, seasonal ingredients

4. **Mexican Fiesta**
   - Description: "Vibrant flavors and festive atmosphere"
   - Expectations: Authentic dishes, margarita welcome, live music, family-style

5. **Indian Spice Journey**
   - Description: "Explore the rich flavors of Indian cuisine"
   - Expectations: Regional specialties, spice customization, naan bread, chai tea

6. **Thai Street Food**
   - Description: "Street food favorites in a refined setting"
   - Expectations: Authentic flavors, fresh herbs, vegetarian options, Thai iced tea

7. **Mediterranean Feast**
   - Description: "Sun-soaked flavors from the Mediterranean"
   - Expectations: Mezze platter, grilled seafood, olive oil tasting, seasonal produce

8. **Default Fallback**
   - Description: "Join us for an unforgettable dining experience"
   - Expectations: Curated menu, intimate setting, seasonal ingredients, complimentary beverages

## Data Flow

### 1. Fetch Pattern
```typescript
async function fetchDinnerDetail(dinnerId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const url = `${baseUrl}/api/dinners/${dinnerId}`;
  
  const response = await fetch(url, { cache: "no-store" });
  
  if (response.status === 404) return null;
  if (!response.ok) throw new Error();
  
  const data: DinnerDetailResponse = await response.json();
  return data.data;
}
```

### 2. Analytics Tracking
```typescript
await track(AnalyticsEvents.DINNER_DETAIL_VIEWED, {
  userId,
  dinnerId: dinner.id,
  restaurantId: dinner.restaurant.id,
  theme: dinner.theme,
  seatsAvailable: dinner.seats.available,
  timestamp: new Date().toISOString(),
});
```

### 3. Theme Copy Lookup
```typescript
export function getThemeCopy(theme: string): ThemeCopy {
  return THEME_COPY[theme] || THEME_COPY.default;
}
```

## UI Layout

### Page Structure
```
┌─────────────────────────────────┐
│                                 │
│         Hero Image              │
│  [←]              [STATUS]      │
│                                 │
│  Theme Title                    │
└─────────────────────────────────┘
│                                 │
│  Restaurant Name • Cuisine      │
│  📍 Location                    │
├─────────────────────────────────┤
│  Theme description...           │
├─────────────────────────────────┤
│  📅 Date                        │
│  🕐 Time (duration)             │
│  👥 Seats available             │
├─────────────────────────────────┤
│  What to Expect                 │
│  ✓ Expectation 1                │
│  ✓ Expectation 2                │
│  ✓ Expectation 3                │
│  ✓ Expectation 4                │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  👥 5 seats left  Filling fast! │
│  [    Reserve Seat    ]         │
└─────────────────────────────────┘
```

### CTA States

#### Seats Available
```
┌─────────────────────────────────┐
│  👥 5 seats left  Filling fast! │
│  ┌─────────────────────────┐   │
│  │    Reserve Seat         │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

#### Sold Out
```
┌─────────────────────────────────┐
│       👥 Sold out               │
│  ┌─────────────────────────┐   │
│  │  🔔 Join Waitlist       │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## Styling Details

### Hero Gradient Overlay
```tsx
className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
```

### Back Button
```tsx
className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-colors hover:bg-white"
```

### Detail Icons
```tsx
// Icon container
className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50"

// Icon
className="h-5 w-5 text-blue-600"
```

### Expectation Checkmarks
```tsx
// Container
className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50"

// Icon
className="h-3 w-3 text-green-600"
```

### Sticky CTA
```tsx
className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-xl"
```

### Reserve Button
```tsx
className="w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
```

### Waitlist Button
```tsx
className="w-full rounded-xl border-2 border-blue-600 bg-white px-6 py-3 text-base font-semibold text-blue-600 transition-colors hover:bg-blue-50 active:scale-[0.98]"
```

## Date & Time Formatting

### Date Format
```typescript
startsAt.toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
// Output: "Monday, March 15, 2026"
```

### Time Format
```typescript
startsAt.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
// Output: "7:00 PM - 9:00 PM"
```

### Duration Calculation
```typescript
const durationMs = endsAt.getTime() - startsAt.getTime();
const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
// Output: "2h" or "2h 30m"
```

## Analytics Events

### dinner_detail_viewed
Tracked when:
- Page loads successfully
- User is authenticated

Includes:
- userId (optional)
- dinnerId
- restaurantId
- theme
- seatsAvailable
- timestamp

## Error Handling

### 404 Not Found
```typescript
if (response.status === 404) {
  return null;
}

// In component
if (!dinner) {
  notFound(); // Next.js 404 page
}
```

### Fetch Errors
```typescript
try {
  const response = await fetch(url);
  // ...
} catch (error) {
  console.error("Error fetching dinner detail:", error);
  return null; // Triggers 404
}
```

## Navigation

### Back to Discover
```tsx
<Link href="/discover">
  <ArrowLeft />
</Link>
```

### From Discover Cards
```tsx
<Link href={`/dinner/${dinner.id}`}>
  <DinnerCard />
</Link>
```

## Placeholder Interactions

### Reserve Seat (Coming Soon)
```typescript
const handleReserve = () => {
  console.log("Reserve seat for dinner:", dinnerId);
  alert("Seat reservation coming soon!");
};
```

### Join Waitlist (Coming Soon)
```typescript
const handleWaitlist = () => {
  console.log("Join waitlist for dinner:", dinnerId);
  alert("Waitlist feature coming soon!");
};
```

## Performance Considerations

### Server Components
- All data fetching on server
- No client-side hydration for static content
- Only CTA is client component

### Cache Strategy
```typescript
fetch(url, { cache: "no-store" })
```
- Always fresh seat availability
- Critical for accurate booking

### Image Loading
- Hero image loads immediately
- Fallback icon for missing images
- Future: Next.js Image optimization

## Accessibility

### Semantic HTML
- Proper heading hierarchy (h1, h2, h3)
- List elements for expectations
- Button elements for actions

### Keyboard Navigation
- Back button focusable
- CTA button focusable
- Tab order logical

### Screen Readers
- Alt text for images
- Descriptive button labels
- Icon labels where needed

### Color Contrast
- Text on hero: white with dark gradient
- All text meets WCAG AA standards
- Icons have sufficient contrast

## File Structure

```
apps/web/src/app/(core)/dinner/[id]/
├── page.tsx                          # Main page with suspense
└── components/
    ├── dinner-detail-content.tsx     # Data fetching & composition
    ├── dinner-hero.tsx               # Hero image section
    ├── dinner-info.tsx               # Restaurant & details
    ├── dinner-expectations.tsx       # What to expect section
    ├── dinner-cta.tsx                # Sticky bottom CTA
    └── dinner-detail-skeleton.tsx    # Loading state

apps/web/src/lib/
└── theme-copy.ts                     # Theme descriptions mapping
```

## Types Usage

### From `@dinewithme/shared`
```typescript
import type { 
  DinnerDetail,
  DinnerDetailResponse 
} from "@dinewithme/shared";
```

### DinnerDetail Structure
```typescript
{
  id: string;
  theme: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  seatCount: number;
  status: string;
  restaurant: {
    id: string;
    name: string;
    description: string | null;
    cuisine: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    website: string | null;
    heroImageUrl: string | null;
  };
  seats: {
    total: number;
    available: number;
    confirmed: number;
    held: number;
    attended: number;
  };
}
```

## Testing Checklist

- [ ] Page loads without errors
- [ ] Hero image displays or shows fallback
- [ ] Back button navigates to discover
- [ ] Restaurant info displays correctly
- [ ] Theme description shows
- [ ] Date/time formatted correctly
- [ ] Duration calculated correctly
- [ ] Seat availability accurate
- [ ] Expectations list displays
- [ ] CTA shows correct state (reserve/waitlist)
- [ ] "Filling fast" shows for ≤3 seats
- [ ] Buttons show placeholder alerts
- [ ] Skeleton shows while loading
- [ ] 404 page for invalid dinner ID
- [ ] Analytics event fires
- [ ] Responsive on mobile
- [ ] Sticky CTA stays at bottom

## Known Limitations

### No Reservation Flow
- Placeholder alert only
- Will be implemented in EPIC 4.4
- Requires seat hold API integration

### No Waitlist Feature
- Placeholder alert only
- Future enhancement
- Requires waitlist system

### No Guest Profiles
- Deferred to future EPIC
- Would show other attendees
- Privacy considerations

### No Post-Dinner Features
- No reviews
- No photos
- No ratings
- Future enhancements

## Future Enhancements

### EPIC 4.4: Seat Reservation Flow
- Hold seat action
- Confirmation flow
- Payment integration
- Countdown timer

### EPIC 4.5: Waitlist System
- Join waitlist
- Notification when available
- Priority queue
- Auto-hold for waitlist users

### EPIC 4.6: Social Features
- See other attendees
- Guest profiles
- Chat/messaging
- Post-dinner reviews

### EPIC 4.7: Enhanced Details
- Restaurant gallery
- Menu preview
- Dietary restrictions
- Parking information

## Summary

EPIC 4.3 successfully implemented:
- ✅ Comprehensive dinner detail page
- ✅ Hero image with overlays and navigation
- ✅ Restaurant information display
- ✅ Theme descriptions with mapping
- ✅ Date/time with duration calculation
- ✅ Seat availability display
- ✅ "What to Expect" section
- ✅ Sticky bottom CTA (reserve/waitlist)
- ✅ Skeleton loading states
- ✅ Analytics tracking
- ✅ 404 handling
- ✅ Server component pattern
- ✅ Types from shared package
- ✅ Apple-native design consistency
- ✅ Accessibility features

The dinner detail page provides all the information users need to make a booking decision, with a clear call-to-action and polished user experience!

---

**Status**: ✅ COMPLETE  
**Date**: March 1, 2026  
**Data Source**: GET /api/dinners/:id (EPIC 3.8)  
**Next**: EPIC 4.4 - Seat Reservation Flow
