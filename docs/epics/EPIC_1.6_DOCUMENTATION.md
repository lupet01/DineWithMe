# EPIC 1.6: Minimal Profile/Settings UI

## Overview

Implements a clean, Apple-native styled profile page that displays user information with role badges and sign-out functionality.

## Implementation

### Profile Page (`/app/profile`)

**Location:** `apps/web/src/app/app/profile/page.tsx`

**Features:**
- User avatar display (with fallback to initials)
- Full name and email
- Role badge with icon
- Account information section
- Sign out button
- Navigation links
- Analytics tracking

**Layout:**
```
┌─────────────────────────────────────┐
│         Profile Header              │
├─────────────────────────────────────┤
│                                     │
│         [Avatar/Initial]            │
│         Full Name                   │
│         email@example.com           │
│         [Role Badge]                │
│                                     │
├─────────────────────────────────────┤
│   Account Information               │
│   ├─ Full Name: ...                │
│   ├─ Email: ...                    │
│   ├─ Role: ...                     │
│   └─ Account ID: ...               │
├─────────────────────────────────────┤
│   [Sign Out Button]                │
└─────────────────────────────────────┘
```

---

## Components

### 1. Profile Page (Server Component)

**File:** `apps/web/src/app/app/profile/page.tsx`

**Responsibilities:**
- Fetch authenticated user
- Emit `profile_viewed` analytics event
- Render profile information
- Server-side rendering for SEO and performance

**Code Structure:**
```typescript
export default async function ProfilePage() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Emit analytics
  await track(AnalyticsEvents.PROFILE_VIEWED, {
    userId: user.id,
    email: user.email,
    role: user.role,
    timestamp: new Date().toISOString(),
  });

  return (
    // Profile UI
  );
}
```

### 2. Sign Out Button (Client Component)

**File:** `apps/web/src/app/app/profile/sign-out-button.tsx`

**Responsibilities:**
- Handle sign-out action
- Redirect to home page after sign-out
- Client-side interactivity

**Features:**
- Uses Clerk's `signOut()` method
- Smooth transition with loading state
- Redirects to home page

**Code:**
```typescript
"use client";

export function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <button onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
```

### 3. Role Badge (Client Component)

**File:** `apps/web/src/app/app/profile/role-badge.tsx`

**Responsibilities:**
- Display role with appropriate styling
- Show role-specific icon
- Visual hierarchy

**Role Styles:**

| Role | Icon | Color | Background |
|------|------|-------|------------|
| PLATFORM_ADMIN | 👑 | Purple | Purple-100 |
| RESTAURANT_ADMIN | 🍽️ | Blue | Blue-100 |
| DINER | 🍴 | Slate | Slate-100 |

**Code:**
```typescript
"use client";

export function RoleBadge({ role }: { role: Role }) {
  const styles = getRoleStyles();
  
  return (
    <div className={`${styles.bg} ${styles.text}`}>
      <span>{styles.icon}</span>
      <span>{styles.label}</span>
    </div>
  );
}
```

---

## Styling

### Apple-Native Design System

**Color Palette:**
- Background: `bg-gradient-to-br from-slate-50 to-slate-100`
- Cards: `bg-white` with `shadow-xl shadow-slate-200/50`
- Text: `text-slate-900` (primary), `text-slate-600` (secondary)
- Borders: `border-slate-200`

**Spacing:**
- Container: `max-w-3xl mx-auto px-4 py-8`
- Card padding: `px-8 py-6`
- Section gaps: `space-y-6`
- Element gaps: `gap-4`

**Border Radius:**
- Cards: `rounded-2xl`
- Buttons: `rounded-xl`
- Avatar: `rounded-full`
- Badges: `rounded-full`

**Shadows:**
- Cards: `shadow-xl shadow-slate-200/50`
- Avatar: `shadow-lg shadow-slate-200/50`
- Subtle depth without harsh edges

**Typography:**
- Headings: `font-semibold`
- Body: `font-medium` for emphasis, regular for content
- Sizes: `text-3xl` (h1), `text-2xl` (h2), `text-lg` (h3), `text-sm` (body)

**Transitions:**
- All interactive elements: `transition-colors`
- Hover states: Darker shade of base color
- Focus states: `focus:ring-2 focus:ring-offset-2`

---

## Analytics

### Event: `profile_viewed`

**Emitted when:** User visits their profile page

**Payload:**
```typescript
{
  userId: string;
  email: string;
  role: string;
  timestamp: string;
}
```

**Example:**
```json
{
  "userId": "clxxx",
  "email": "user@example.com",
  "role": "DINER",
  "timestamp": "2026-02-27T10:30:00.000Z"
}
```

**Use Cases:**
- Track profile engagement
- Monitor user activity
- Identify power users
- Measure feature adoption

---

## Navigation

### Profile Access Points

**From Dashboard:**
```
Dashboard → "View Profile" button → /app/profile
```

**From App:**
```
App → "Profile" link → /app/profile
```

**Direct URL:**
```
/app/profile
```

### Exit Points

**From Profile:**
- "Back to Dashboard" → `/dashboard`
- "Go to App" → `/app`
- "Sign Out" → `/` (home page)

---

## User Experience

### Avatar Display Logic

1. **If user has avatar URL:**
   - Display avatar image
   - Rounded full circle
   - 24x24 (96px) size

2. **If no avatar URL:**
   - Show initials in colored circle
   - First letter of first name OR first letter of email
   - Gradient background (slate-200 to slate-300)
   - Large, bold letter

### Information Display

**Account Information Section:**
- Full Name: Display name or "Not set"
- Email: Always shown
- Role: Human-readable format (spaces instead of underscores)
- Account ID: Monospace font, small text

**Visual Hierarchy:**
1. Avatar (largest, centered)
2. Name (prominent)
3. Email (secondary)
4. Role badge (colorful, attention-grabbing)
5. Details (organized list)

---

## Responsive Design

### Mobile (< 640px)
- Single column layout
- Full-width buttons
- Reduced padding: `px-4 py-6`
- Smaller avatar: `w-20 h-20`

### Tablet (640px - 1024px)
- Comfortable spacing
- Standard padding: `px-6 py-8`
- Standard avatar: `w-24 h-24`

### Desktop (> 1024px)
- Max width container: `max-w-3xl`
- Generous padding: `px-8 py-8`
- Optimal reading width

---

## Accessibility

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- Description lists (`<dl>`, `<dt>`, `<dd>`) for key-value pairs
- Meaningful link text

### Keyboard Navigation
- All interactive elements focusable
- Visible focus indicators
- Logical tab order

### Screen Readers
- Alt text for avatar images
- Descriptive button labels
- ARIA labels where needed

### Color Contrast
- All text meets WCAG AA standards
- Sufficient contrast ratios
- Not relying on color alone

---

## Files Created/Modified

### Created (4 files)
1. `apps/web/src/app/app/profile/page.tsx` - Profile page
2. `apps/web/src/app/app/profile/sign-out-button.tsx` - Sign out button
3. `apps/web/src/app/app/profile/role-badge.tsx` - Role badge component
4. `EPIC_1.6_DOCUMENTATION.md` - This file

### Modified (3 files)
1. `packages/analytics/src/events.ts` - Added `PROFILE_VIEWED` event
2. `apps/web/src/app/dashboard/page.tsx` - Added profile link
3. `apps/web/src/app/app/page.tsx` - Added profile link

---

## Testing

### Manual Testing

**Test 1: Profile Display**
1. Sign in as any user
2. Navigate to `/app/profile`
3. Verify all information displays correctly
4. Check avatar/initials display
5. Verify role badge shows correct role

**Test 2: Sign Out**
1. Click "Sign Out" button
2. Verify redirect to home page
3. Verify session is cleared
4. Try accessing `/app/profile` → should redirect to sign-in

**Test 3: Navigation**
1. From profile, click "Back to Dashboard"
2. Verify redirect to `/dashboard`
3. From profile, click "Go to App"
4. Verify redirect to `/app`

**Test 4: Role Badges**
1. Sign in as DINER → verify 🍴 badge
2. Sign in as RESTAURANT_ADMIN → verify 🍽️ badge
3. Sign in as PLATFORM_ADMIN → verify 👑 badge

**Test 5: Analytics**
1. Visit profile page
2. Check analytics dashboard
3. Verify `profile_viewed` event was emitted
4. Verify event contains correct user data

---

## Non-Goals (As Specified)

These were explicitly excluded from EPIC 1.6:

- ❌ Profile editing - Display only
- ❌ Preferences/settings - Coming in future epic
- ❌ Dinner history - Coming in future epic
- ❌ Reservations - Coming in future epic
- ❌ Password change - Handled by Clerk
- ❌ Email change - Handled by Clerk
- ❌ Avatar upload - Handled by Clerk

---

## Future Enhancements

### EPIC 1.7: Profile Editing
- Edit name
- Update preferences
- Manage notifications

### EPIC 1.8: Activity History
- View dinner history
- See reservations
- Track interactions

### EPIC 1.9: Settings
- Privacy settings
- Notification preferences
- Account management

---

## ✅ EPIC 1.6 Complete

All requirements met:
- ✅ Profile page created at `/app/profile`
- ✅ Shows user name, email, avatar
- ✅ Role badge with icon
- ✅ Sign out button
- ✅ Apple-native styling with premium spacing
- ✅ Display-only (no editing)
- ✅ Analytics event `profile_viewed` emitted
- ✅ Navigation links added
- ✅ Responsive design
- ✅ Accessible markup
- ✅ Documentation complete
