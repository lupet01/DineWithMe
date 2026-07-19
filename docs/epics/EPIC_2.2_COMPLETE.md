# EPIC 2.2: Admin Portal Shell - COMPLETE

## Overview
Implemented a clean, Apple-native UI admin portal shell with role-based access control, navigation structure, and placeholder pages for restaurant management.

## What Was Implemented

### 1. Admin Layout (`/admin`)

Created a protected admin layout with:
- Role-based access control (RESTAURANT_ADMIN or PLATFORM_ADMIN required)
- Automatic redirect to `/app/unauthorized` for unauthorized users
- Sticky header with restaurant switcher placeholder
- Left sidebar navigation
- Clean, spacious content area

**File**: `apps/web/src/app/admin/layout.tsx`

### 2. Admin Header Component

Top navigation bar featuring:
- DineWithMe logo with "Admin" badge
- Restaurant switcher placeholder (dropdown button)
- User role indicator
- Sticky positioning for always-visible navigation
- Clean white background with subtle border

**File**: `apps/web/src/app/admin/components/admin-header.tsx`

### 3. Admin Sidebar Component

Left navigation sidebar with:
- Three main sections:
  - Dashboard (LayoutDashboard icon)
  - Restaurant Profile (Store icon)
  - Dinners (Calendar icon)
- Active state highlighting (black background for active route)
- Hover states for better UX
- Icons from lucide-react
- Client-side navigation with Next.js Link

**File**: `apps/web/src/app/admin/components/admin-sidebar.tsx`

### 4. Dashboard Page (`/admin`)

Main dashboard featuring:
- Welcome message with user's name
- Stats grid showing:
  - Total Dinners
  - Active Seats
  - Total Guests
- Quick Actions section with:
  - Create Dinner button
  - Update Restaurant button
- Recent Activity placeholder
- All showing empty states (no data yet)

**File**: `apps/web/src/app/admin/page.tsx`

### 5. Restaurant Profile Page (`/admin/restaurant`)

Restaurant management page with:
- Basic Information section:
  - Hero image upload placeholder
  - Restaurant name, cuisine, city, phone fields
  - Description and address fields
  - Edit Profile button
- Location section with map placeholder
- Contact Information section (website, phone)
- All fields showing "Not set" empty states

**File**: `apps/web/src/app/admin/restaurant/page.tsx`

### 6. Dinners Page (`/admin/dinners`)

Dinners management page featuring:
- Page header with "Create Dinner" button
- Search and filter controls (disabled placeholders)
- Empty state with call-to-action
- Stats cards showing:
  - Upcoming dinners
  - Total guests
  - Completed dinners
- All showing zero states

**File**: `apps/web/src/app/admin/dinners/page.tsx`

### 7. Utility Functions

Created `cn()` utility for className merging:
- Uses clsx for conditional classes
- Uses tailwind-merge for Tailwind conflict resolution
- Essential for component styling

**File**: `apps/web/src/lib/utils.ts`

## Design System

### Color Palette (Apple-native inspired)
- Background: `slate-50` (light gray)
- Cards: `white` with `slate-200` borders
- Text: `slate-900` (primary), `slate-600` (secondary), `slate-500` (tertiary)
- Active state: `slate-900` (black)
- Hover states: `slate-50`, `slate-800`

### Typography
- Page titles: `text-3xl font-semibold`
- Section titles: `text-lg font-semibold`
- Body text: `text-sm` or `text-base`
- Labels: `text-sm font-medium`

### Spacing
- Page padding: `p-8`
- Card padding: `p-6`
- Section gaps: `space-y-8`
- Grid gaps: `gap-6`

### Components
- Rounded corners: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons
- Borders: `border border-slate-200`
- Shadows: Minimal, only on hover states
- Transitions: `transition-colors` for smooth interactions

## Route Protection

### Implementation
Uses `requireRole()` from `@/lib/auth-helpers`:
```typescript
await requireRole(["RESTAURANT_ADMIN", "PLATFORM_ADMIN"]);
```

### Behavior
- Checks if user is authenticated
- Verifies user has RESTAURANT_ADMIN or PLATFORM_ADMIN role
- Redirects to `/app/unauthorized` if unauthorized
- Runs on server-side (layout component)

### Protected Routes
- `/admin` - Dashboard
- `/admin/restaurant` - Restaurant Profile
- `/admin/dinners` - Dinners Management

## Navigation Structure

```
/admin (Layout)
├── Header (Restaurant Switcher)
├── Sidebar
│   ├── Dashboard → /admin
│   ├── Restaurant Profile → /admin/restaurant
│   └── Dinners → /admin/dinners
└── Content Area
```

## Files Created

### Components
- `apps/web/src/app/admin/layout.tsx`
- `apps/web/src/app/admin/components/admin-header.tsx`
- `apps/web/src/app/admin/components/admin-sidebar.tsx`

### Pages
- `apps/web/src/app/admin/page.tsx` (updated)
- `apps/web/src/app/admin/restaurant/page.tsx`
- `apps/web/src/app/admin/dinners/page.tsx`

### Utilities
- `apps/web/src/lib/utils.ts`

### Documentation
- `EPIC_2.2_COMPLETE.md`

## Dependencies Used

All dependencies were already installed:
- `lucide-react` - Icons (LayoutDashboard, Store, Calendar, ChevronDown)
- `clsx` - Conditional className utility
- `tailwind-merge` - Tailwind class conflict resolution
- `next/navigation` - Client-side routing (usePathname, redirect)
- `next/link` - Navigation links

## Non-Goals (As Specified)

- ❌ No forms implemented yet
- ❌ No API calls yet
- ❌ No actual restaurant data loading
- ❌ No dinner creation functionality
- ❌ Restaurant switcher is placeholder only

## Testing the Implementation

### 1. Access Control Test

```typescript
// As DINER (should be denied)
// Visit /admin → redirected to /app/unauthorized

// As RESTAURANT_ADMIN or PLATFORM_ADMIN (should work)
// Visit /admin → see dashboard
```

### 2. Navigation Test

```typescript
// Click sidebar items
// - Dashboard → /admin
// - Restaurant Profile → /admin/restaurant
// - Dinners → /admin/dinners

// Active state should highlight current page
```

### 3. Visual Test

- Clean, minimal Apple-native aesthetic
- Smooth hover transitions
- Proper spacing and typography
- Responsive grid layouts
- Empty states with clear messaging

## Next Steps

To continue building the admin portal:

1. **EPIC 2.3**: Implement restaurant profile form
   - Add form fields with validation
   - Connect to restaurant repository
   - Handle image uploads

2. **EPIC 2.4**: Implement restaurant switcher
   - Load user's restaurants
   - Dropdown menu with selection
   - Store selected restaurant in context/state

3. **EPIC 2.5**: Implement dinner creation
   - Create dinner form
   - Date/time picker
   - Seat management
   - Connect to dinners API

## Usage Examples

### Accessing the Admin Portal

```typescript
// User must have RESTAURANT_ADMIN or PLATFORM_ADMIN role
// Navigate to: http://localhost:3001/admin
```

### Customizing Navigation

Edit `apps/web/src/app/admin/components/admin-sidebar.tsx`:

```typescript
const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  // Add more items here
];
```

### Adding New Admin Pages

1. Create page in `/admin/[page-name]/page.tsx`
2. Add route to sidebar navigation
3. Page automatically inherits layout and protection

## Design Principles

1. **Minimalism**: Clean, uncluttered interface
2. **Consistency**: Uniform spacing, colors, and typography
3. **Clarity**: Clear labels and empty states
4. **Accessibility**: Semantic HTML and proper contrast
5. **Responsiveness**: Mobile-friendly grid layouts
6. **Performance**: Server-side rendering, client-side navigation

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design for mobile/tablet/desktop
