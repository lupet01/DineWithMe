# EPIC 1.6: Styling Notes - Apple-Native Design

## 🎨 Quick Reference

### Color Palette

```css
/* Backgrounds */
bg-gradient-to-br from-slate-50 to-slate-100  /* Page background */
bg-white                                       /* Card background */
bg-slate-100                                   /* Subtle sections */

/* Text */
text-slate-900  /* Primary - headings, important text */
text-slate-600  /* Secondary - descriptions, labels */
text-slate-500  /* Tertiary - meta info, timestamps */

/* Borders */
border-slate-200  /* Subtle dividers */
border-slate-300  /* Emphasized borders */

/* Role Badge Colors */
bg-purple-100 text-purple-800 border-purple-200  /* Platform Admin */
bg-blue-100 text-blue-800 border-blue-200        /* Restaurant Admin */
bg-slate-100 text-slate-800 border-slate-200     /* Diner */
```

---

## 📐 Spacing Scale

```css
/* Padding */
p-4   /* 16px - Compact */
p-6   /* 24px - Standard */
p-8   /* 32px - Generous */
p-12  /* 48px - Extra generous */

/* Gaps */
gap-2   /* 8px - Tight */
gap-3   /* 12px - Comfortable */
gap-4   /* 16px - Standard */
gap-6   /* 24px - Spacious */

/* Space Between */
space-y-3  /* 12px - Tight vertical */
space-y-4  /* 16px - Standard vertical */
space-y-6  /* 24px - Generous vertical */
```

---

## 🔲 Border Radius

```css
rounded-full  /* 9999px - Circles (avatar, badges) */
rounded-2xl   /* 16px - Cards */
rounded-xl    /* 12px - Buttons */
rounded-lg    /* 8px - Small elements */
```

---

## 🌑 Shadows

```css
/* Cards */
shadow-xl shadow-slate-200/50
/* Extra large shadow, 50% opacity, slate color */

/* Avatar */
shadow-lg shadow-slate-200/50
/* Large shadow, 50% opacity, slate color */

/* Buttons (on hover) */
hover:shadow-md
/* Medium shadow on interaction */
```

---

## 📝 Typography

```css
/* Sizes */
text-3xl  /* 30px - Page titles */
text-2xl  /* 24px - Section titles */
text-xl   /* 20px - Subsection titles */
text-lg   /* 18px - Emphasized text */
text-base /* 16px - Body text */
text-sm   /* 14px - Small text */
text-xs   /* 12px - Meta info */

/* Weights */
font-semibold  /* 600 - Headings */
font-medium    /* 500 - Emphasis */
font-normal    /* 400 - Body */

/* Line Heights */
leading-tight   /* Headings */
leading-normal  /* Body text */
leading-relaxed /* Comfortable reading */
```

---

## 🎭 Interactive States

```css
/* Buttons */
bg-slate-900 hover:bg-slate-800
transition-colors
focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2

/* Links */
text-slate-600 hover:text-slate-900
transition-colors

/* Cards (if interactive) */
hover:shadow-2xl
transition-shadow
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
px-4 py-6                    /* Base (mobile) */
sm:px-6 sm:py-8             /* Small (640px+) */
lg:px-8 lg:py-8             /* Large (1024px+) */

/* Container Widths */
max-w-3xl                    /* Profile page (768px) */
max-w-4xl                    /* Dashboard (896px) */
max-w-6xl                    /* Admin (1152px) */
```

---

## 🎯 Component Patterns

### Card Pattern
```tsx
<div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
  {/* Content */}
</div>
```

### Button Pattern (Primary)
```tsx
<button className="w-full bg-slate-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
  Button Text
</button>
```

### Button Pattern (Secondary)
```tsx
<button className="w-full border border-slate-300 text-slate-900 rounded-xl px-6 py-3 font-medium hover:bg-slate-50 transition-colors">
  Button Text
</button>
```

### Link Pattern
```tsx
<a href="/path" className="text-slate-600 hover:text-slate-900 transition-colors">
  Link Text
</a>
```

### Badge Pattern
```tsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-slate-100 text-slate-800 border-slate-200">
  <span>Icon</span>
  <span className="text-sm font-medium">Label</span>
</div>
```

### Avatar Pattern (with image)
```tsx
<img
  src={avatarUrl}
  alt="User name"
  className="w-24 h-24 rounded-full object-cover shadow-lg shadow-slate-200/50"
/>
```

### Avatar Pattern (initials)
```tsx
<div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-lg shadow-slate-200/50">
  <span className="text-3xl font-semibold text-slate-700">
    A
  </span>
</div>
```

### Section Divider
```tsx
<div className="border-t border-slate-200 pt-6">
  {/* Content */}
</div>
```

### Info Row
```tsx
<div className="flex items-center justify-between py-3 border-b border-slate-100">
  <dt className="text-sm font-medium text-slate-600">Label</dt>
  <dd className="text-sm text-slate-900">Value</dd>
</div>
```

---

## 🎨 Gradient Patterns

### Background Gradient
```css
bg-gradient-to-br from-slate-50 to-slate-100
```
- Bottom-right direction
- Subtle transition
- Light, airy feel

### Avatar Gradient (fallback)
```css
bg-gradient-to-br from-slate-200 to-slate-300
```
- Slightly darker than background
- Visible contrast
- Consistent direction

### Accent Gradient (future)
```css
bg-gradient-to-r from-blue-500 to-purple-600
```
- Left-to-right
- Vibrant colors
- Call-to-action elements

---

## 🔍 Focus States

### Keyboard Focus
```css
focus:outline-none
focus:ring-2
focus:ring-slate-900
focus:ring-offset-2
```
- Remove default outline
- Add custom ring
- Match brand color
- Offset for visibility

### Focus Visible (future)
```css
focus-visible:ring-2
focus-visible:ring-slate-900
```
- Only show on keyboard focus
- Not on mouse click
- Better UX

---

## ♿ Accessibility Colors

### Contrast Ratios (WCAG AA)

| Combination | Ratio | Pass |
|-------------|-------|------|
| slate-900 on white | 15.5:1 | ✅ AAA |
| slate-600 on white | 5.7:1 | ✅ AA |
| slate-500 on white | 4.6:1 | ✅ AA |
| purple-800 on purple-100 | 7.2:1 | ✅ AAA |
| blue-800 on blue-100 | 6.8:1 | ✅ AAA |
| slate-800 on slate-100 | 8.1:1 | ✅ AAA |

---

## 🎬 Animation Timing

```css
/* Standard Transitions */
transition-colors    /* 150ms - Color changes */
transition-shadow    /* 150ms - Shadow changes */
transition-transform /* 150ms - Movement */
transition-all       /* 150ms - Multiple properties */

/* Custom Durations */
duration-75   /* 75ms - Very fast */
duration-150  /* 150ms - Fast (default) */
duration-300  /* 300ms - Medium */
duration-500  /* 500ms - Slow */

/* Easing */
ease-in-out  /* Default - Smooth start and end */
ease-in      /* Accelerate */
ease-out     /* Decelerate */
```

---

## 📦 Layout Patterns

### Page Container
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</div>
```

### Card Container
```tsx
<div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
  <div className="px-8 py-6 space-y-6">
    {/* Content */}
  </div>
</div>
```

### Two-Column Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Items */}
</div>
```

### Flex Row
```tsx
<div className="flex items-center justify-between gap-4">
  {/* Items */}
</div>
```

---

## 🎯 Best Practices

### Do's ✅
- Use slate colors for neutral elements
- Apply generous spacing (8-unit grid)
- Use rounded-2xl for cards
- Add subtle shadows
- Smooth transitions on all interactions
- Maintain consistent border radius
- Use semantic HTML
- Test keyboard navigation

### Don'ts ❌
- Don't use harsh shadows
- Don't use bright, saturated colors
- Don't use small border radius (< 8px)
- Don't forget hover states
- Don't skip focus indicators
- Don't use inconsistent spacing
- Don't rely on color alone
- Don't forget mobile responsiveness

---

## 🔧 Utility Combinations

### Premium Card
```css
bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8
```

### Primary Button
```css
bg-slate-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-slate-800 transition-colors
```

### Secondary Button
```css
border border-slate-300 text-slate-900 rounded-xl px-6 py-3 font-medium hover:bg-slate-50 transition-colors
```

### Text Link
```css
text-slate-600 hover:text-slate-900 transition-colors underline-offset-4 hover:underline
```

### Badge
```css
inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium
```

---

## 📱 Mobile-First Examples

### Responsive Padding
```css
px-4 py-6 sm:px-6 sm:py-8 lg:px-8
```

### Responsive Text
```css
text-2xl sm:text-3xl lg:text-4xl
```

### Responsive Grid
```css
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

### Responsive Flex
```css
flex-col sm:flex-row
```

---

## 🎨 Color Psychology

### Slate (Neutral)
- **Feeling:** Calm, professional, premium
- **Use:** Default state, backgrounds, text
- **Example:** DINER role badge

### Purple (Authority)
- **Feeling:** Premium, powerful, exclusive
- **Use:** Admin features, premium content
- **Example:** PLATFORM_ADMIN badge

### Blue (Trust)
- **Feeling:** Professional, reliable, trustworthy
- **Use:** Business features, admin tools
- **Example:** RESTAURANT_ADMIN badge

---

## ✨ Polish Details

### Micro-interactions
- Smooth color transitions (150ms)
- Subtle shadow changes on hover
- Focus rings on keyboard navigation
- Loading states (future)

### Visual Hierarchy
1. Avatar (largest, centered)
2. Name (prominent, bold)
3. Email (secondary, lighter)
4. Badge (colorful, attention)
5. Details (organized, subtle)

### Consistency
- Same border radius throughout
- Consistent spacing scale
- Unified color palette
- Matching shadow styles
- Coherent typography

---

This styling guide ensures consistency across the entire application while maintaining the premium Apple-native feel.
