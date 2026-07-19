# EPIC 2.2: Quick Reference

## Routes

- `/admin` - Dashboard (protected)
- `/admin/restaurant` - Restaurant Profile (protected)
- `/admin/dinners` - Dinners Management (protected)

## Access Control

Only users with these roles can access:
- `RESTAURANT_ADMIN`
- `PLATFORM_ADMIN`

Others are redirected to `/app/unauthorized`

## Key Components

### Admin Layout
```typescript
// apps/web/src/app/admin/layout.tsx
// Wraps all admin pages with header + sidebar
```

### Admin Header
```typescript
// apps/web/src/app/admin/components/admin-header.tsx
// Top navigation with restaurant switcher placeholder
```

### Admin Sidebar
```typescript
// apps/web/src/app/admin/components/admin-sidebar.tsx
// Left navigation with Dashboard, Restaurant, Dinners
```

## Navigation Items

```typescript
const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Restaurant Profile", href: "/admin/restaurant", icon: Store },
  { name: "Dinners", href: "/admin/dinners", icon: Calendar },
];
```

## Styling

### Colors
- Background: `bg-slate-50`
- Cards: `bg-white border-slate-200`
- Text: `text-slate-900` (primary), `text-slate-600` (secondary)
- Active: `bg-slate-900 text-white`

### Components
- Cards: `rounded-xl border border-slate-200 p-6`
- Buttons: `rounded-lg px-4 py-2`
- Spacing: `space-y-8` for sections, `gap-6` for grids

## Utility Function

```typescript
import { cn } from "@/lib/utils";

// Merge classNames with Tailwind conflict resolution
<div className={cn("base-class", condition && "conditional-class")} />
```

## Testing Access

1. Sign in as RESTAURANT_ADMIN or PLATFORM_ADMIN
2. Visit http://localhost:3001/admin
3. Navigate between pages using sidebar
4. Verify active state highlighting

## Empty States

All pages show placeholder content:
- Dashboard: Stats showing 0
- Restaurant: "Not set" for all fields
- Dinners: "No dinners yet" message

## Next Steps

- Add restaurant profile form (EPIC 2.3)
- Implement restaurant switcher (EPIC 2.4)
- Add dinner creation (EPIC 2.5)
