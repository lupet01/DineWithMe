# SECTION 14: Navigation & Routing - System Review Report

**Review Date**: March 5, 2026  
**Reviewer**: Kiro AI  
**Status**: ✅ COMPLETE  
**Overall Grade**: B+

---

## Executive Summary

The navigation and routing system is well-structured with proper authentication guards and role-based access control. The app uses Next.js App Router with route groups for organization. Navigation components are clean and functional, but there are some issues with duplicate routes and missing 404 handling.

### Key Strengths:
- ✅ Proper authentication guards on all protected routes
- ✅ Role-based access control (RBAC) implemented correctly
- ✅ Clean navigation components (BottomNav, AdminSidebar)
- ✅ Consistent redirect patterns
- ✅ Route groups for organization
- ✅ Proper use of Next.js App Router
- ✅ Unauthorized page with helpful messaging

### Issues Found:
- 🟡 MEDIUM: Duplicate route structure (/app vs /(core))
- 🟡 MEDIUM: Missing custom 404 (not-found.tsx) page
- 🟡 MEDIUM: Inconsistent use of Link vs <a> tags
- 🟢 LOW: Dashboard page seems redundant with /app
- 🟢 LOW: Empty /dinner/[dinnerId] folder (duplicate of /dinner/[id])

---

## 1. Route Structure Analysis

### Route Groups


**Implemented Route Groups**:

1. **(auth)** - Authentication pages
   - `/sign-in/[[...sign-in]]` - Clerk sign-in
   - `/sign-up/[[...sign-up]]` - Clerk sign-up
   - Layout: Centered auth layout

2. **(core)** - Main diner application
   - `/discover` - Dinner discovery
   - `/my-dinners` - User's bookings
   - `/profile` - User profile
   - `/dinner/[id]` - Dinner details
   - `/dinner/[id]/confirm` - Booking confirmation
   - `/dinner/[id]/post-dinner` - Post-dinner feedback
   - Layout: Bottom navigation

3. **admin** - Restaurant admin area
   - `/admin` - Dashboard
   - `/admin/restaurant` - Restaurant profile
   - `/admin/dinners` - Dinner management
   - `/admin/dinners/new` - Create dinner
   - `/admin/ops` - Platform operations (PLATFORM_ADMIN only)
   - `/admin/ops/restaurants` - Restaurant approvals
   - Layout: Sidebar navigation + header

4. **app** - Legacy/alternative app structure
   - `/app` - App home
   - `/app/profile` - Profile page
   - `/app/unauthorized` - Unauthorized access
   - Layout: None (standalone pages)

5. **Special Routes**:
   - `/` - Landing page (redirects to /discover if authenticated)
   - `/sync` - User sync page
   - `/dashboard` - Dashboard page
   - `/dinner/[id]/check-in` - QR check-in
   - `/offline` - Offline page

### Issue: Duplicate Route Structure 🟡 MEDIUM

**Problem**: There are two profile routes and two app structures:
- `/(core)/profile` - Main profile page with bottom nav
- `/app/profile` - Alternative profile page without nav
- `/app` - Alternative app home
- `/(core)/discover` - Main app home (via redirect)

**Impact**: Confusing for developers and users. Links point to different profile pages.

**Recommendation**: Consolidate to single structure:
- Keep `/(core)/profile` as the main profile
- Remove `/app/profile` or redirect it
- Remove `/app` page or make it redirect to `/discover`
- Update all links to use consistent paths


---

## 2. Navigation Components

### Bottom Navigation (Diner App)

**File**: `apps/web/src/app/(core)/components/bottom-nav.tsx`

**Routes**:
```typescript
const navItems = [
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "My Dinners", href: "/my-dinners", icon: Calendar },
  { label: "Profile", href: "/profile", icon: User },
];
```

**Strengths**:
- ✅ Clean, mobile-first design
- ✅ Active state highlighting
- ✅ Proper use of Next.js Link
- ✅ usePathname for active detection
- ✅ Accessible with proper labels
- ✅ Fixed positioning at bottom
- ✅ Backdrop blur for modern look

**Code Quality**:
```typescript
const isActive = pathname === item.href;

<Link
  key={item.href}
  href={item.href}
  className={cn(
    "flex flex-col items-center justify-center gap-1 rounded-xl px-6 py-2 transition-all",
    "hover:bg-gray-100",
    isActive && "text-blue-600"
  )}
>
  <Icon className={cn("h-6 w-6 transition-all", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
  <span className={cn("text-xs font-medium transition-all", isActive ? "font-semibold" : "text-gray-600")}>
    {item.label}
  </span>
</Link>
```

**No Issues Found** ✅

---

### Admin Sidebar

**File**: `apps/web/src/app/admin/components/admin-sidebar.tsx`

**Routes**:
```typescript
const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: [RESTAURANT_ADMIN, PLATFORM_ADMIN] },
  { name: "Restaurant Profile", href: "/admin/restaurant", icon: Store, roles: [RESTAURANT_ADMIN, PLATFORM_ADMIN] },
  { name: "Dinners", href: "/admin/dinners", icon: Calendar, roles: [RESTAURANT_ADMIN, PLATFORM_ADMIN] },
  { name: "Platform Ops", href: "/admin/ops", icon: Shield, roles: [PLATFORM_ADMIN] },
];
```

**Strengths**:
- ✅ Role-based navigation filtering
- ✅ Active state with startsWith for nested routes
- ✅ Clean sidebar design
- ✅ Proper icon usage
- ✅ Clerk integration for user role

**Code Quality**:
```typescript
const { user } = useUser();
const userRole = user?.publicMetadata?.role as Role | undefined;

// Filter by role
if (!userRole || !item.roles.includes(userRole)) {
  return null;
}

// Active detection for nested routes
const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
```

**No Issues Found** ✅

---

### Admin Header

**File**: `apps/web/src/app/admin/components/admin-header.tsx`

**Features**:
- Logo and "Admin" badge
- Restaurant switcher placeholder
- User menu placeholder

**Issues**:
- 🟢 LOW: Restaurant switcher is non-functional (placeholder)
- 🟢 LOW: User menu is placeholder text only

**Recommendation**: Implement restaurant switcher and user menu dropdown in future.


---

## 3. Layout & Authentication Guards

### Core Layout (Diner App)

**File**: `apps/web/src/app/(core)/layout.tsx`

**Authentication**:
```typescript
const { userId } = await auth();

if (!userId) {
  redirect("/sign-in");
}
```

**Strengths**:
- ✅ Server-side authentication check
- ✅ Redirects to sign-in if not authenticated
- ✅ Includes BottomNav for all core routes
- ✅ Proper padding for bottom nav (pb-20)

**No Issues Found** ✅

---

### Admin Layout

**File**: `apps/web/src/app/admin/layout.tsx`

**Authentication & Authorization**:
```typescript
const { userId } = await auth();

if (!userId) {
  redirect("/sign-in");
}

// Get user from database
let dbUser;
try {
  dbUser = await userRepository.findByAuthProviderId(userId);
} catch (error) {
  console.error("Error fetching user from database:", error);
  redirect("/sync");
}

if (!dbUser) {
  redirect("/sync");
}

// Check role
const allowedRoles = [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN];
if (!allowedRoles.includes(dbUser.role as Role)) {
  redirect("/app/unauthorized");
}
```

**Strengths**:
- ✅ Multi-layer authentication
- ✅ Database user verification
- ✅ Role-based access control
- ✅ Proper error handling
- ✅ Redirects to sync if user not in DB
- ✅ Redirects to unauthorized if wrong role
- ✅ Includes AdminHeader and AdminSidebar

**No Issues Found** ✅

---

### Ops Layout (Platform Admin Only)

**File**: `apps/web/src/app/admin/ops/layout.tsx`

**Authorization**:
```typescript
const { userId } = await auth();

if (!userId) {
  redirect("/sign-in");
}

let dbUser;
try {
  dbUser = await userRepository.findByAuthProviderId(userId);
} catch (error) {
  console.error("Error fetching user from database:", error);
  redirect("/sync");
}

if (!dbUser) {
  redirect("/sync");
}

// Check if user is PLATFORM_ADMIN
if (dbUser.role !== Role.PLATFORM_ADMIN) {
  redirect("/app/unauthorized");
}
```

**Strengths**:
- ✅ Stricter role check (PLATFORM_ADMIN only)
- ✅ Nested layout with custom header
- ✅ Clear "PLATFORM ADMIN" badge
- ✅ Proper error handling

**No Issues Found** ✅

---

### Auth Layout

**File**: `apps/web/src/app/(auth)/layout.tsx`

**Simple centered layout for sign-in/sign-up**:
```typescript
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
  <div className="w-full max-w-md px-6">{children}</div>
</div>
```

**No Issues Found** ✅


---

## 4. Redirect Patterns

### Landing Page Redirect

**File**: `apps/web/src/app/page.tsx`

```typescript
const { userId } = await auth();

if (userId) {
  redirect("/discover");
}

// Show landing page with sign-in/sign-up buttons
```

**Strengths**:
- ✅ Redirects authenticated users to main app
- ✅ Shows landing page for unauthenticated users
- ✅ Clear CTAs for sign-in and sign-up

---

### Ops Page Redirect

**File**: `apps/web/src/app/admin/ops/page.tsx`

```typescript
export default function OpsPage() {
  redirect("/admin/ops/restaurants");
}
```

**Strengths**:
- ✅ Redirects to default ops page (restaurants)
- ✅ Prevents empty ops page

---

### Dinner Creation Redirect

**File**: `apps/web/src/app/admin/dinners/new/page.tsx`

```typescript
if (!user) {
  redirect("/sign-in");
}

const restaurant = await getRestaurantForUser(user.id);

if (!restaurant) {
  redirect("/admin/restaurant");
}
```

**Strengths**:
- ✅ Requires restaurant profile before creating dinners
- ✅ Helpful redirect to restaurant setup

---

### All Redirect Patterns

**Consistent redirect destinations**:
- Unauthenticated → `/sign-in`
- User not synced → `/sync`
- Unauthorized role → `/app/unauthorized`
- No restaurant → `/admin/restaurant`
- Authenticated landing → `/discover`

**No Issues Found** ✅


---

## 5. Link Usage Analysis

### Issue: Inconsistent Link vs <a> Tag Usage 🟡 MEDIUM

**Problem**: Some components use Next.js `Link` while others use `<a>` tags.

**Using Link (Correct)**:
```typescript
// bottom-nav.tsx
<Link href="/discover">Discover</Link>

// admin-sidebar.tsx
<Link href="/admin">Dashboard</Link>

// dinner-hero.tsx
<Link href="/discover">Back</Link>
```

**Using <a> tags (Should be Link)**:
```typescript
// sync/page.tsx
<a href="/discover">Continue to App</a>

// dashboard/page.tsx
<a href="/app/profile">View Profile</a>
<a href="/app">Go to App</a>
<a href="/admin">Try Admin Portal</a>

// app/profile/page.tsx
<a href="/dashboard">Back to Dashboard</a>
<a href="/app">Go to App</a>

// dinner-form.tsx
<a href="/admin/restaurant">restaurant profile</a>
```

**Impact**:
- ❌ Full page reloads instead of client-side navigation
- ❌ Slower navigation experience
- ❌ Loss of scroll position
- ❌ No prefetching

**Fix**: Replace all `<a href="/...">` with `<Link href="/...">`

**Example**:
```typescript
// Before
<a href="/discover" className="...">Continue to App</a>

// After
<Link href="/discover" className="...">Continue to App</Link>
```

---

## 6. 404 Handling

### Issue: Missing Custom 404 Page 🟡 MEDIUM

**Problem**: No custom `not-found.tsx` file in app directory.

**Current Behavior**: Next.js shows default 404 page.

**Recommendation**: Create `apps/web/src/app/not-found.tsx`

```typescript
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Page Not Found
        </h2>
        <p className="text-slate-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-3 pt-4">
          <Link
            href="/discover"
            className="block w-full bg-slate-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-slate-800 transition-colors"
          >
            Go to Discover
          </Link>
          <Link
            href="/"
            className="block w-full text-slate-600 hover:text-slate-900 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```


---

## 7. Special Pages

### Unauthorized Page

**File**: `apps/web/src/app/app/unauthorized/page.tsx`

**Strengths**:
- ✅ Clear messaging
- ✅ Query params for reason and role
- ✅ Helpful CTAs (Dashboard, Home)
- ✅ Support email link
- ✅ Good UX with emoji and clear text

**Code Quality**:
```typescript
const searchParams = useSearchParams();
const reason = searchParams.get("reason");
const role = searchParams.get("role");

const getMessage = () => {
  if (reason === "admin_access_required") {
    return {
      title: "Admin Access Required",
      description: "You need to be a Restaurant Admin or Platform Admin to access this area.",
      detail: role ? `Your current role: ${role}` : null,
    };
  }
  return {
    title: "Access Denied",
    description: "You don't have permission to access this page.",
    detail: null,
  };
};
```

**No Issues Found** ✅

---

### Sync Page

**File**: `apps/web/src/app/sync/page.tsx`

**Purpose**: Sync Clerk user to database

**Strengths**:
- ✅ Shows user information
- ✅ Includes SyncUser component
- ✅ Clear next steps
- ✅ Setup script instructions
- ✅ Continue to app button

**Minor Issue**:
- 🟢 LOW: Uses `<a>` instead of `Link` for "Continue to App"

---

### Dashboard Page

**File**: `apps/web/src/app/dashboard/page.tsx`

**Purpose**: User dashboard with profile info

**Issue**: 🟢 LOW - Seems redundant with `/app` page

**Recommendation**: Consider consolidating dashboard and /app pages, or clarify their different purposes.

---

### Offline Page

**File**: `apps/web/src/app/offline/page.tsx`

**Strengths**:
- ✅ Clear offline messaging
- ✅ Helpful tips
- ✅ Retry button
- ✅ Good UX with WifiOff icon

**No Issues Found** ✅

---

### Error Page

**File**: `apps/web/src/app/error.tsx`

**Strengths**:
- ✅ Client component for error boundary
- ✅ Shows error message
- ✅ Shows error digest
- ✅ Try again button
- ✅ Good error UX

**No Issues Found** ✅


---

## 8. Route Organization Issues

### Issue: Empty /dinner/[dinnerId] Folder 🟢 LOW

**Location**: `apps/web/src/app/(core)/dinner/[dinnerId]/`

**Problem**: Empty folder exists alongside `/dinner/[id]/`

**Impact**: Confusing for developers, potential routing conflicts

**Recommendation**: Delete the empty `[dinnerId]` folder

```bash
rm -rf apps/web/src/app/(core)/dinner/[dinnerId]
```

---

### Issue: Duplicate App Structure 🟡 MEDIUM

**Problem**: Two separate app structures:

1. **/(core)** - Main app with bottom nav
   - `/discover`
   - `/my-dinners`
   - `/profile`

2. **/app** - Alternative app without nav
   - `/app` - App home
   - `/app/profile` - Profile page

**Links pointing to different places**:
- Bottom nav → `/profile` (core)
- Dashboard → `/app/profile` (app)
- App page → `/app/profile` (app)

**Recommendation**: Consolidate to single structure

**Option 1: Keep /(core), redirect /app**
```typescript
// apps/web/src/app/app/page.tsx
export default function AppPage() {
  redirect("/discover");
}

// apps/web/src/app/app/profile/page.tsx
export default function AppProfilePage() {
  redirect("/profile");
}
```

**Option 2: Keep both, but clarify purpose**
- `/(core)` - Main diner app
- `/app` - Developer/testing area
- Update all production links to use `/(core)` routes


---

## 9. Navigation Flow Testing

### User Journey: Unauthenticated User

1. Visit `/` → Landing page ✅
2. Click "Sign In" → `/sign-in` ✅
3. Sign in → Redirect to `/discover` ✅
4. Bottom nav works → `/discover`, `/my-dinners`, `/profile` ✅

**No Issues** ✅

---

### User Journey: Diner

1. Visit `/discover` → See dinners ✅
2. Click dinner → `/dinner/[id]` ✅
3. Book dinner → `/dinner/[id]/confirm` ✅
4. View bookings → `/my-dinners` ✅
5. View profile → `/profile` ✅

**No Issues** ✅

---

### User Journey: Restaurant Admin

1. Visit `/admin` → Dashboard ✅
2. Sidebar navigation:
   - Dashboard → `/admin` ✅
   - Restaurant Profile → `/admin/restaurant` ✅
   - Dinners → `/admin/dinners` ✅
   - Platform Ops → Hidden (not PLATFORM_ADMIN) ✅
3. Create dinner → `/admin/dinners/new` ✅
4. If no restaurant → Redirect to `/admin/restaurant` ✅

**No Issues** ✅

---

### User Journey: Platform Admin

1. Visit `/admin` → Dashboard ✅
2. Sidebar shows "Platform Ops" ✅
3. Click "Platform Ops" → `/admin/ops` → Redirect to `/admin/ops/restaurants` ✅
4. See restaurant approvals ✅
5. Nested layout with "PLATFORM ADMIN" badge ✅

**No Issues** ✅

---

### User Journey: Wrong Role

1. DINER visits `/admin` → Redirect to `/app/unauthorized` ✅
2. RESTAURANT_ADMIN visits `/admin/ops` → Redirect to `/app/unauthorized` ✅
3. Unauthorized page shows helpful message ✅

**No Issues** ✅

---

### User Journey: Not Synced

1. New user signs in → Clerk auth succeeds ✅
2. Visit `/admin` → User not in DB → Redirect to `/sync` ✅
3. Sync page shows user info and sync component ✅
4. After sync → Can access protected routes ✅

**No Issues** ✅


---

## 10. Issues & Recommendations

### 🟡 MEDIUM Priority Issues

#### Issue 1: Duplicate Route Structure (/app vs /(core))

**Problem**: Two separate app structures with overlapping functionality.

**Files Affected**:
- `apps/web/src/app/app/page.tsx`
- `apps/web/src/app/app/profile/page.tsx`
- `apps/web/src/app/(core)/profile/page.tsx`

**Impact**: 
- Confusing for developers
- Inconsistent user experience
- Links point to different pages

**Fix Option 1 - Redirect /app routes**:
```typescript
// apps/web/src/app/app/page.tsx
import { redirect } from "next/navigation";

export default function AppPage() {
  redirect("/discover");
}

// apps/web/src/app/app/profile/page.tsx
import { redirect } from "next/navigation";

export default function AppProfilePage() {
  redirect("/profile");
}
```

**Fix Option 2 - Update all links to use /(core)**:
```typescript
// Update dashboard/page.tsx
<Link href="/profile">View Profile</Link>  // Instead of /app/profile

// Update app/profile/page.tsx
<Link href="/discover">Go to App</Link>  // Instead of /app
```

---

#### Issue 2: Missing Custom 404 Page

**Problem**: No custom not-found.tsx file.

**Impact**: Users see default Next.js 404 page.

**Fix**: Create `apps/web/src/app/not-found.tsx`

```typescript
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Page Not Found
        </h2>
        <p className="text-slate-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-3 pt-4">
          <Link
            href="/discover"
            className="block w-full bg-slate-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-slate-800 transition-colors"
          >
            Go to Discover
          </Link>
          <Link
            href="/"
            className="block w-full text-slate-600 hover:text-slate-900 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```


---

#### Issue 3: Inconsistent Link vs <a> Tag Usage

**Problem**: Some components use `<a>` tags instead of Next.js `Link`.

**Files Affected**:
- `apps/web/src/app/sync/page.tsx` (line 70)
- `apps/web/src/app/dashboard/page.tsx` (lines 72, 78, 84)
- `apps/web/src/app/app/profile/page.tsx` (lines 112, 119)
- `apps/web/src/app/admin/dinners/components/dinner-form.tsx` (line 100)

**Impact**:
- Full page reloads
- Slower navigation
- No prefetching
- Loss of scroll position

**Fix**: Replace all internal `<a>` tags with `Link`

**Example fixes**:

```typescript
// sync/page.tsx - Before
<a href="/discover" className="...">Continue to App</a>

// sync/page.tsx - After
import Link from "next/link";
<Link href="/discover" className="...">Continue to App</Link>

// dashboard/page.tsx - Before
<a href="/app/profile" className="...">View Profile</a>

// dashboard/page.tsx - After
<Link href="/app/profile" className="...">View Profile</Link>

// dinner-form.tsx - Before
<a href="/admin/restaurant" className="underline">restaurant profile</a>

// dinner-form.tsx - After
<Link href="/admin/restaurant" className="underline">restaurant profile</Link>
```

---

### 🟢 LOW Priority Issues

#### Issue 4: Empty /dinner/[dinnerId] Folder

**Problem**: Empty folder exists alongside `/dinner/[id]/`.

**Location**: `apps/web/src/app/(core)/dinner/[dinnerId]/`

**Fix**: Delete the empty folder

```bash
rm -rf apps/web/src/app/(core)/dinner/[dinnerId]
```

---

#### Issue 5: Dashboard Page Redundancy

**Problem**: `/dashboard` page seems redundant with `/app` page.

**Files**:
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/app/page.tsx`

**Recommendation**: 
- Clarify the purpose of each page
- Or consolidate into one page
- Or redirect one to the other

---

#### Issue 6: Admin Header Placeholders

**Problem**: Restaurant switcher and user menu are non-functional placeholders.

**File**: `apps/web/src/app/admin/components/admin-header.tsx`

**Recommendation**: Implement in future:
- Restaurant switcher dropdown
- User menu with profile/sign out
- Notifications icon


---

## 11. Summary

### Overall Assessment: Grade B+

The navigation and routing system is well-structured with proper authentication guards and role-based access control. Navigation components are clean and functional. The main issues are duplicate route structures and inconsistent use of Link components.

### Strengths Summary

1. **Authentication**: Proper guards on all protected routes
2. **Authorization**: Role-based access control working correctly
3. **Navigation Components**: Clean, functional, accessible
4. **Redirect Patterns**: Consistent and logical
5. **Route Groups**: Well-organized with clear separation
6. **Error Handling**: Good error and unauthorized pages
7. **User Experience**: Clear navigation paths
8. **Mobile-First**: Bottom nav works well on mobile
9. **Admin UX**: Sidebar navigation is intuitive
10. **Security**: Multi-layer auth checks

### Issues Summary

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 0 | None |
| 🟠 High | 0 | None |
| 🟡 Medium | 3 | Duplicate routes, missing 404, inconsistent Links |
| 🟢 Low | 3 | Empty folder, redundant pages, placeholders |
| ✅ Verified | 12 | Core navigation working correctly |

### Required Fixes

1. **Consolidate /app and /(core) routes** (🟡 MEDIUM)
2. **Create custom 404 page** (🟡 MEDIUM)
3. **Replace <a> tags with Link components** (🟡 MEDIUM)

### Optional Improvements

1. Delete empty /dinner/[dinnerId] folder (🟢 LOW)
2. Clarify dashboard vs /app page purpose (🟢 LOW)
3. Implement admin header features (🟢 LOW - Future)

### Verification Checklist

- ✅ Bottom navigation working
- ✅ Admin sidebar working
- ✅ Authentication guards in place
- ✅ Role-based access control working
- ✅ Redirect patterns consistent
- ✅ Unauthorized page helpful
- ✅ Error page functional
- ✅ Sync page working
- ✅ All user journeys tested
- ⚠️ Duplicate route structure exists
- ⚠️ Missing custom 404 page
- ⚠️ Some <a> tags instead of Link

---

## 12. Route Map

### Complete Route Structure

```
/                           → Landing (redirects to /discover if auth)
├── sign-in                 → Clerk sign-in
├── sign-up                 → Clerk sign-up
├── sync                    → User sync page
├── dashboard               → Dashboard (redundant?)
├── offline                 → Offline page
│
├── (core)/                 → Main diner app with bottom nav
│   ├── discover            → Dinner discovery
│   ├── my-dinners          → User bookings
│   ├── profile             → User profile
│   └── dinner/
│       └── [id]/
│           ├── page        → Dinner details
│           ├── confirm/    → Booking confirmation
│           └── post-dinner/→ Feedback flow
│
├── app/                    → Alternative app structure
│   ├── page                → App home (redundant?)
│   ├── profile/            → Profile (duplicate of /(core)/profile)
│   └── unauthorized/       → Unauthorized access
│
├── admin/                  → Restaurant admin with sidebar
│   ├── page                → Dashboard
│   ├── restaurant/         → Restaurant profile
│   ├── dinners/            → Dinner management
│   │   ├── page            → Dinners list
│   │   └── new/            → Create dinner
│   └── ops/                → Platform operations (PLATFORM_ADMIN only)
│       ├── page            → Redirects to /restaurants
│       └── restaurants/    → Restaurant approvals
│
└── dinner/
    └── [id]/
        └── check-in/       → QR check-in (outside (core) group)
```

---

## Next Steps

1. Fix the three medium-priority issues
2. Consider consolidating duplicate routes
3. Test all navigation flows after fixes
4. Plan admin header feature implementation
5. Document route structure for team

---

**Review Complete**: March 5, 2026  
**Next Section**: Section 15 - Error Handling & Validation

