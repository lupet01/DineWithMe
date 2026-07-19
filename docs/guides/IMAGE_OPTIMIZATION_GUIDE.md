# Image Optimization Guide - Next.js Image Component

## Overview

This guide shows how to replace `<img>` tags with Next.js `<Image>` component for automatic optimization.

## Benefits

- Automatic WebP/AVIF conversion
- Responsive images
- Lazy loading by default
- Prevents layout shift
- Optimized file sizes
- CDN delivery

## Basic Usage

### Before (Regular img tag)
```tsx
<img 
  src="/hero.jpg" 
  alt="Dinner experience"
  className="h-64 w-full object-cover"
/>
```

### After (Next.js Image)
```tsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Dinner experience"
  width={1200}
  height={800}
  className="h-64 w-full object-cover"
/>
```

## Common Patterns

### 1. Hero Images (Above the Fold)

Use `priority` to load immediately:

```tsx
<Image
  src={dinner.restaurant.heroImageUrl || "/placeholder.jpg"}
  alt={dinner.theme}
  width={1200}
  height={600}
  priority
  className="h-64 w-full object-cover"
/>
```

### 2. Card Images (Below the Fold)

Default lazy loading:

```tsx
<Image
  src={dinner.restaurant.heroImageUrl || "/placeholder.jpg"}
  alt={dinner.theme}
  width={800}
  height={600}
  className="h-48 w-full object-cover"
/>
```

### 3. Remote Images (R2 Storage)

Already configured in `next.config.js`:

```tsx
<Image
  src="https://pub-xxx.r2.dev/image.jpg"
  alt="Restaurant"
  width={1200}
  height={800}
  className="rounded-lg"
/>
```

### 4. Responsive Images

Use `sizes` prop for responsive loading:

```tsx
<Image
  src={imageUrl}
  alt="Dinner"
  width={1200}
  height={800}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="w-full"
/>
```

### 5. Fill Container

For unknown dimensions:

```tsx
<div className="relative h-64 w-full">
  <Image
    src={imageUrl}
    alt="Dinner"
    fill
    className="object-cover"
  />
</div>
```

### 6. Placeholder Blur

Show blur while loading:

```tsx
<Image
  src={imageUrl}
  alt="Dinner"
  width={1200}
  height={800}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  className="rounded-lg"
/>
```

## Files to Update

### 1. Dinner Card Component
**File**: `apps/web/src/app/(core)/discover/components/dinner-card.tsx`

```tsx
// Before
{heroImageUrl ? (
  <img src={heroImageUrl} alt={theme} className="..." />
) : (
  <div className="..."><Users /></div>
)}

// After
import Image from "next/image";

{heroImageUrl ? (
  <Image
    src={heroImageUrl}
    alt={theme}
    width={800}
    height={600}
    className="h-48 w-full object-cover"
  />
) : (
  <div className="..."><Users /></div>
)}
```

### 2. Dinner Hero Component
**File**: `apps/web/src/app/(core)/dinner/[id]/components/dinner-hero.tsx`

```tsx
// Before
{heroImageUrl ? (
  <img src={heroImageUrl} alt={theme} className="..." />
) : (
  <div className="..."><Users /></div>
)}

// After
import Image from "next/image";

{heroImageUrl ? (
  <Image
    src={heroImageUrl}
    alt={theme}
    width={1200}
    height={600}
    priority
    className="h-full w-full object-cover"
  />
) : (
  <div className="..."><Users /></div>
)}
```

### 3. Gallery Manager (Admin)
**File**: `apps/web/src/app/admin/restaurant/components/gallery-manager.tsx`

```tsx
// Before
<img src={image.url} alt="Gallery" className="..." />

// After
import Image from "next/image";

<Image
  src={image.url}
  alt="Gallery"
  width={400}
  height={300}
  className="h-full w-full object-cover"
/>
```

## Handling Fallbacks

### With Placeholder Image

```tsx
<Image
  src={imageUrl || "/images/placeholder-dinner.jpg"}
  alt={alt}
  width={800}
  height={600}
  className="..."
/>
```

### With Error Handling

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export function DinnerImage({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-48 w-full items-center justify-center bg-gray-100">
        <Users className="h-12 w-12 text-gray-300" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      onError={() => setError(true)}
      className="h-48 w-full object-cover"
    />
  );
}
```

## Image Sizes Reference

### Dinner Cards
- Width: 800px
- Height: 600px
- Aspect ratio: 4:3

### Hero Images
- Width: 1200px
- Height: 600px
- Aspect ratio: 2:1

### Gallery Thumbnails
- Width: 400px
- Height: 300px
- Aspect ratio: 4:3

### Profile Avatars
- Width: 128px
- Height: 128px
- Aspect ratio: 1:1

## Performance Tips

### 1. Use Appropriate Sizes
```tsx
// Mobile: full width
// Tablet: 50% width
// Desktop: 33% width
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
```

### 2. Priority for Above-the-Fold
```tsx
// Hero images, first card
priority={true}
```

### 3. Lazy Load Below-the-Fold
```tsx
// Default behavior, no prop needed
loading="lazy" // explicit
```

### 4. Quality Setting
```tsx
// Default: 75 (good balance)
quality={75}

// High quality: 90
quality={90}

// Low quality: 50
quality={50}
```

## Testing

### Check Optimization
1. Open DevTools Network tab
2. Filter by "Img"
3. Check file format (should be WebP/AVIF)
4. Check file size (should be smaller)
5. Check dimensions (should match viewport)

### Lighthouse Audit
```bash
npx lighthouse http://localhost:3001 --view
```

Check:
- Properly sized images
- Efficient image formats
- Offscreen images lazy loaded
- Image elements have explicit dimensions

## Common Issues

### Issue: Image not loading
**Solution**: Check remote patterns in `next.config.js`

### Issue: Layout shift
**Solution**: Always provide width and height

### Issue: Blurry images
**Solution**: Increase quality prop or use larger source image

### Issue: Slow loading
**Solution**: Use priority for above-the-fold, lazy load others

## Migration Checklist

- [ ] Update dinner card images
- [ ] Update dinner hero images
- [ ] Update gallery images
- [ ] Update restaurant images
- [ ] Update user avatars
- [ ] Add error handling
- [ ] Add placeholders
- [ ] Test on mobile
- [ ] Test on desktop
- [ ] Run Lighthouse audit
- [ ] Check bundle size
- [ ] Verify lazy loading
- [ ] Check WebP/AVIF conversion

## Resources

- [Next.js Image Documentation](https://nextjs.org/docs/app/api-reference/components/image)
- [Image Optimization Guide](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)

---

**Note**: This is a gradual migration. Start with high-impact images (hero, cards) and work your way through the app.
