# EPIC 4.1: Styling Guide

## Apple-Native Design Principles

This guide documents the styling approach used in the user app shell.

## Core Principles

### 1. Subtle Borders
- Use `border-gray-200` for card borders
- Use `border-gray-100` for internal dividers
- Keep borders minimal and unobtrusive

### 2. Rounded Corners
```tsx
// Cards and containers
className="rounded-2xl"  // 16px

// Buttons and tabs
className="rounded-xl"   // 12px

// Avatars and icons
className="rounded-full"

// Images
className="rounded-xl"
```

### 3. Backdrop Blur
```tsx
// Headers and navigation
className="bg-white/80 backdrop-blur-xl"

// Creates depth without heavy shadows
```

### 4. Spacing System
```tsx
// Padding
p-1   // 4px  - Tight spacing
p-2   // 8px  - Small spacing
p-3   // 12px - Compact spacing
p-4   // 16px - Default spacing
p-6   // 24px - Comfortable spacing
p-12  // 48px - Spacious layout

// Gap
gap-1  // 4px
gap-2  // 8px
gap-3  // 12px
gap-4  // 16px
gap-6  // 24px
```

### 5. Typography
```tsx
// Page titles
className="text-2xl font-bold tracking-tight text-gray-900"

// Section headings
className="text-lg font-semibold text-gray-900"

// Body text
className="text-sm text-gray-600"

// Labels
className="text-xs font-semibold uppercase tracking-wide text-gray-500"

// Captions
className="text-xs text-gray-500"
```

### 6. Color Palette
```tsx
// Primary (Blue)
text-blue-600    // Primary actions
bg-blue-50       // Light backgrounds

// Success (Green)
text-green-700   // Success states
bg-green-50      // Success backgrounds

// Warning (Yellow)
text-yellow-700  // Warning states
bg-yellow-50     // Warning backgrounds

// Danger (Red)
text-red-600     // Destructive actions
bg-red-50        // Error backgrounds

// Neutral (Gray)
text-gray-900    // Primary text
text-gray-600    // Secondary text
text-gray-500    // Tertiary text
bg-gray-50       // Page background
bg-gray-100      // Subtle backgrounds
border-gray-200  // Borders
border-gray-100  // Light dividers
```

### 7. Shadows
```tsx
// Subtle shadow for cards
className="shadow-sm"

// No heavy shadows - keep it minimal
```

### 8. Transitions
```tsx
// All properties
className="transition-all"

// Colors only (more performant)
className="transition-colors"

// Always smooth and subtle
```

## Component Patterns

### Card Component
```tsx
<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
  {/* Content */}
</div>
```

### Button (Primary)
```tsx
<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
  Action
</button>
```

### Button (Secondary)
```tsx
<button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50">
  Action
</button>
```

### Button (Ghost)
```tsx
<button className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
  Action
</button>
```

### Status Badge
```tsx
// Success
<span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
  Confirmed
</span>

// Warning
<span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
  Held
</span>

// Info
<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
  Active
</span>
```

### Tab Switcher
```tsx
<div className="flex gap-2 rounded-xl bg-gray-100 p-1">
  <button className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm">
    Active Tab
  </button>
  <button className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600">
    Inactive Tab
  </button>
</div>
```

### List Item (Settings)
```tsx
<button className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50">
  <Icon className="h-5 w-5 text-gray-600" />
  <span className="flex-1 text-sm font-medium text-gray-900">
    Label
  </span>
  <ChevronRight className="h-5 w-5 text-gray-400" />
</button>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
  <div className="mb-4 rounded-full bg-blue-50 p-4">
    <Icon className="h-8 w-8 text-blue-600" />
  </div>
  <h2 className="mb-2 text-lg font-semibold text-gray-900">
    Title
  </h2>
  <p className="text-center text-sm text-gray-600">
    Description
  </p>
</div>
```

### Sticky Header
```tsx
<header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
  <div className="mx-auto max-w-lg px-4 py-4">
    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
      Title
    </h1>
  </div>
</header>
```

### Bottom Navigation
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/80 backdrop-blur-xl">
  <div className="mx-auto flex h-20 max-w-lg items-center justify-around px-4">
    {/* Nav items */}
  </div>
</nav>
```

## Layout Patterns

### Page Container
```tsx
<div className="min-h-screen bg-gray-50">
  <PageHeader title="Page Title" />
  
  <div className="mx-auto max-w-lg px-4 py-6">
    {/* Content */}
  </div>
</div>
```

### Content Spacing
```tsx
// Between sections
<div className="space-y-6">
  <Section1 />
  <Section2 />
</div>

// Between cards
<div className="space-y-4">
  <Card />
  <Card />
</div>

// Between list items
<div className="space-y-2">
  <ListItem />
  <ListItem />
</div>
```

## Icon Guidelines

### Icon Sizes
```tsx
// Small (list items, inline)
<Icon className="h-4 w-4" />

// Medium (buttons, cards)
<Icon className="h-5 w-5" />

// Large (headers, empty states)
<Icon className="h-6 w-6" />

// Extra large (feature icons)
<Icon className="h-8 w-8" />
```

### Icon Colors
```tsx
// Primary
<Icon className="text-blue-600" />

// Secondary
<Icon className="text-gray-600" />

// Tertiary
<Icon className="text-gray-400" />

// Danger
<Icon className="text-red-600" />
```

### Icon Stroke Width
```tsx
// Normal
<Icon className="stroke-[2]" />

// Active/emphasized
<Icon className="stroke-[2.5]" />
```

## Responsive Considerations

### Max Width Container
```tsx
// Centered on large screens, full width on mobile
<div className="mx-auto max-w-lg px-4">
  {/* Content */}
</div>
```

### Touch Targets
- Minimum 44x44px for all interactive elements
- Use `py-3` (12px) for comfortable tap targets
- Add padding around icons in buttons

### Bottom Navigation Spacing
```tsx
// Account for bottom nav (80px height)
<main className="flex-1 pb-20">
  {/* Content */}
</main>
```

## Animation Guidelines

### Hover States
```tsx
// Background change
hover:bg-gray-50
hover:bg-gray-100

// Color change
hover:text-blue-600

// Scale (subtle)
hover:scale-105

// Always with transition
transition-colors
transition-all
```

### Active States
```tsx
// Slightly darker
active:bg-gray-100

// Scale down
active:scale-95
```

### Focus States
```tsx
// Use default browser focus or custom
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

## Accessibility

### Color Contrast
- Text on white: Use gray-900, gray-600, gray-500
- Text on colored backgrounds: Ensure 4.5:1 contrast ratio
- Icons: Use same colors as text

### Focus Indicators
- Always visible
- High contrast
- Clear boundary

### Touch Targets
- Minimum 44x44px
- Adequate spacing between targets
- Clear hover/active states

## Common Mistakes to Avoid

❌ **Don't use heavy shadows**
```tsx
// Bad
className="shadow-lg shadow-xl"

// Good
className="shadow-sm"
```

❌ **Don't use sharp corners**
```tsx
// Bad
className="rounded"

// Good
className="rounded-xl rounded-2xl"
```

❌ **Don't use bold borders**
```tsx
// Bad
className="border-2 border-gray-400"

// Good
className="border border-gray-200"
```

❌ **Don't use bright colors**
```tsx
// Bad
className="bg-blue-500 text-blue-900"

// Good
className="bg-blue-50 text-blue-600"
```

❌ **Don't forget transitions**
```tsx
// Bad
<button className="hover:bg-gray-100">

// Good
<button className="transition-colors hover:bg-gray-100">
```

## Quick Reference

### Most Used Classes
```tsx
// Cards
"rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"

// Buttons
"rounded-xl px-4 py-2 text-sm font-medium transition-colors"

// Headers
"text-2xl font-bold tracking-tight text-gray-900"

// Body text
"text-sm text-gray-600"

// Containers
"mx-auto max-w-lg px-4 py-6"

// Backdrop blur
"bg-white/80 backdrop-blur-xl"

// Spacing
"space-y-4 space-y-6"

// Flex layouts
"flex items-center gap-3"
```

---

This styling guide ensures consistency across the user app and maintains the Apple-native design language throughout the application.
