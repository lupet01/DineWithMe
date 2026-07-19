# EPIC 4.1: User App Shell and Navigation - COMPLETE ✅

## Overview

Created a protected user app shell with bottom tab navigation following Apple's native design language. The app features clean spacing, subtle borders, rounded cards, and a mobile-first approach.

## What Was Built

### 1. Protected Route Group
**Directory**: `apps/web/src/app/(core)/`

Features:
- Auth-gated layout requiring sign-in
- Automatic redirect to `/sign-in` for unauthenticated users
- Bottom tab navigation
- Mobile-optimized max-width container (max-w-lg)
- Gray background with white cards

### 2. Bottom Tab Navigation
**File**: `apps/web/src/app/(core)/components/bottom-nav.tsx`

Features:
- Fixed bottom position with backdrop blur
- Three tabs: Discover, My Dinners, Profile
- Active state highlighting (blue color, bold text, thicker stroke)
- Smooth transitions
- Icons from lucide-react
- Apple-native styling:
  - Subtle border-top
  - White background with 80% opacity
  - Backdrop blur effect
  - Rounded hover states
  - Clean spacing

### 3. Placeholder Pages

#### Discover Page
**File**: `apps/web/src/app/(core)/discover/page.tsx`

- Empty state with Compass icon
- Example dinner cards showing:
  - Image placeholder
  - Dinner title
  - Restaurant name
  - Date/time
  - Seats available count

#### My Dinners Page
**File**: `apps/web/src/app/(core)/my-dinners/page.tsx`

- Empty state with Calendar icon
- Tab switcher (Upcoming/Past)
- Example reservation cards showing:
  - Dinner name and restaurant
  - Status badges (Confirmed, Held)
  - Date, time, seat count
  - Hold expiration timer

#### Profile Page
**File**: `apps/web/src/app/(core)/profile/page.tsx`

- User info card with avatar placeholder
- Settings sections:
  - Account (Notifications, Payment Methods)
  - Support (Help & Support)
  - Sign Out button
- App version footer

### 4. Reusable Components

#### PageHeader
**File**: `apps/web/src/app/(core)/components/page-header.tsx`

- Sticky header with backdrop blur
- Title and optional subtitle
- Consistent styling across pages

#### Card
**File**: `apps/web/src/app/(core)/components/card.tsx`

- Rounded corners (rounded-2xl)
- Subtle border and shadow
- Configurable padding (none, sm, md, lg)
- White background

#### EmptyState
**File**: `apps/web/src/app/(core)/components/empty-state.tsx`

- Icon with colored background circle
- Title and description
- Optional action button slot
- Centered layout

### 5. Utility Functions
**File**: `apps/web/src/lib/utils.ts`

- `cn()` function for className merging
- Uses clsx and tailwind-merge
- Type-safe className composition

## Design System

### Apple-Native Principles

1. **Subtle Borders**
   - `border-gray-200` for card borders
   - `border-gray-100` for internal dividers
   - Minimal visual weight

2. **Rounded Corners**
   - Cards: `rounded-2xl` (16px)
   - Buttons/tabs: `rounded-xl` (12px)
   - Avatars: `rounded-full`
   - Images: `rounded-xl`

3. **Clean Spacing**
   - Consistent padding: 4, 6, 12 (1rem, 1.5rem, 3rem)
   - Gap between elements: 2, 3, 4
   - Section spacing: 6 (1.5rem)

4. **Backdrop Blur**
   - Headers: `bg-white/80 backdrop-blur-xl`
   - Bottom nav: `bg-white/80 backdrop-blur-xl`
   - Creates depth and hierarchy

5. **Typography**
   - Headers: `text-2xl font-bold tracking-tight`
   - Body: `text-sm` or `text-base`
   - Labels: `text-xs font-semibold uppercase tracking-wide`
   - Colors: gray-900 (primary), gray-600 (secondary), gray-500 (tertiary)

6. **Colors**
   - Primary: Blue (blue-600, blue-50)
   - Success: Green (green-700, green-50)
   - Warning: Yellow (yellow-700, yellow-50)
   - Danger: Red (red-600, red-50)
   - Neutral: Gray scale

7. **Shadows**
   - Subtle: `shadow-sm`
   - No heavy shadows (Apple style)

8. **Transitions**
   - All interactive elements: `transition-all` or `transition-colors`
   - Smooth, subtle animations

## File Structure

```
apps/web/src/app/(core)/
├── layout.tsx                    # Protected layout with auth check
├── components/
│   ├── bottom-nav.tsx           # Bottom tab navigation
│   ├── page-header.tsx          # Reusable page header
│   ├── card.tsx                 # Card component
│   └── empty-state.tsx          # Empty state component
├── discover/
│   └── page.tsx                 # Discover dinners page
├── my-dinners/
│   └── page.tsx                 # User reservations page
└── profile/
    └── page.tsx                 # User profile page

apps/web/src/lib/
└── utils.ts                     # Utility functions (cn)
```

## Dependencies Installed

```json
{
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

## Authentication Flow

1. User navigates to any `/(core)` route
2. Layout checks for `userId` via Clerk
3. If not authenticated → redirect to `/sign-in`
4. If authenticated → render page with bottom nav

## Mobile-First Approach

- Max width container: `max-w-lg` (32rem / 512px)
- Centered on larger screens
- Full width on mobile
- Bottom navigation optimized for thumb reach
- Touch-friendly tap targets (min 44px)

## Visual Examples

### Bottom Navigation
```
┌─────────────────────────────────┐
│                                 │
│         Page Content            │
│                                 │
├─────────────────────────────────┤
│  🧭        📅        👤         │
│ Discover  My Dinners  Profile   │
└─────────────────────────────────┘
```

### Card Layout
```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    Image Placeholder    │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  Dinner Title                   │
│  Restaurant Name                │
│                                 │
│  Date & Time      5 seats left  │
└─────────────────────────────────┘
```

### Profile Settings
```
┌─────────────────────────────────┐
│  ACCOUNT                        │
│  ┌─────────────────────────┐   │
│  │ 🔔 Notifications      › │   │
│  ├─────────────────────────┤   │
│  │ 💳 Payment Methods    › │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## Testing Checklist

- [ ] Navigate to `/discover` - should redirect to sign-in if not authenticated
- [ ] Sign in and navigate to `/discover` - should show page
- [ ] Click bottom nav tabs - should navigate between pages
- [ ] Active tab should be highlighted
- [ ] Pages should scroll independently
- [ ] Bottom nav should stay fixed
- [ ] Header should be sticky on scroll
- [ ] Cards should have proper spacing and borders
- [ ] Hover states should work on interactive elements

## Next Steps (Future EPICs)

1. **EPIC 4.2**: Implement Discover page with real dinner data
   - Fetch dinners from API
   - Filter by city, date
   - Search functionality
   - Dinner detail view

2. **EPIC 4.3**: Implement My Dinners page
   - Fetch user's reservations
   - Show held, confirmed, attended seats
   - Countdown timers for holds
   - Cancel/confirm actions

3. **EPIC 4.4**: Implement Profile page
   - Show real user data from Clerk
   - Implement sign out
   - Add settings pages
   - Payment method management

4. **EPIC 4.5**: Add loading states
   - Skeleton screens
   - Loading spinners
   - Optimistic updates

5. **EPIC 4.6**: Add error handling
   - Error boundaries
   - Toast notifications
   - Retry mechanisms

## Design Tokens (for future reference)

```typescript
// Spacing
const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
};

// Border Radius
const borderRadius = {
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  full: '9999px',
};

// Colors
const colors = {
  primary: 'blue-600',
  primaryLight: 'blue-50',
  success: 'green-700',
  successLight: 'green-50',
  warning: 'yellow-700',
  warningLight: 'yellow-50',
  danger: 'red-600',
  dangerLight: 'red-50',
  text: {
    primary: 'gray-900',
    secondary: 'gray-600',
    tertiary: 'gray-500',
  },
  border: {
    default: 'gray-200',
    light: 'gray-100',
  },
  background: {
    page: 'gray-50',
    card: 'white',
  },
};
```

## Accessibility Notes

- All interactive elements have proper focus states
- Color contrast meets WCAG AA standards
- Touch targets are minimum 44x44px
- Semantic HTML used throughout
- Icons have descriptive labels

## Performance Considerations

- Client components only where needed (bottom-nav)
- Server components by default (pages, headers)
- No unnecessary re-renders
- Optimized imports from lucide-react

## Summary

EPIC 4.1 successfully created:
- ✅ Protected (core) route group with auth gating
- ✅ Bottom tab navigation with Apple-native design
- ✅ Three placeholder pages (Discover, My Dinners, Profile)
- ✅ Reusable components (Card, EmptyState, PageHeader)
- ✅ Utility functions for className merging
- ✅ Mobile-first, responsive layout
- ✅ Clean, minimal design following Apple's principles
- ✅ No TypeScript errors
- ✅ Ready for business logic implementation

The app shell provides a solid foundation for building out the user-facing features with a consistent, polished design.

---

**Status**: ✅ COMPLETE  
**Date**: March 1, 2026  
**Design System**: Apple-native  
**No Business Logic**: Placeholder content only
