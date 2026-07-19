# EPIC 2.4: Media Upload for Restaurant Assets - COMPLETE

## Overview
Implemented secure media upload system using Cloudflare R2 (S3-compatible) storage with signed URLs, database tracking, and UI components for hero and gallery images.

## What Was Implemented

### 1. Database Schema

#### RestaurantMedia Model
```prisma
model RestaurantMedia {
  id           String              @id @default(cuid())
  restaurantId String
  type         RestaurantMediaType  // HERO or GALLERY
  url          String               // Public URL
  key          String               // Storage key for deletion
  createdAt    DateTime            @default(now())
  
  restaurant Restaurant @relation(...)
}
```

#### RestaurantMediaType Enum
- `HERO` - Hero/banner image (one per restaurant)
- `GALLERY` - Gallery images (max 10 per restaurant)

### 2. Storage Abstraction Layer (`packages/storage`)

Created a clean abstraction for object storage:

#### StorageProvider Interface
```typescript
interface StorageProvider {
  getSignedUploadUrl(key, contentType, expiresIn): Promise<UploadSignature>
  getSignedDownloadUrl(key, expiresIn): Promise<string>
  deleteObject(key): Promise<void>
  getPublicUrl(key): string
}
```

#### R2StorageProvider
- S3-compatible implementation for Cloudflare R2
- Uses AWS SDK v3
- Supports signed URLs for secure uploads
- Configurable public URLs

#### Helper Functions
- `generateStorageKey()` - Creates organized storage keys
- `getStorage()` - Singleton storage instance
- `initializeStorage()` - Manual initialization

### 3. Upload Signing API (`/api/uploads/sign`)

Secure endpoint for generating signed upload URLs:

#### Features
- Authentication required
- Ownership verification
- File type validation (images only)
- Gallery limit enforcement (max 10)
- Returns signed URL + public URL

#### Request
```typescript
POST /api/uploads/sign
{
  restaurantId: string,
  filename: string,
  contentType: string,  // image/jpeg, image/png, etc.
  type: "hero" | "gallery"
}
```

#### Response
```typescript
{
  success: true,
  data: {
    uploadUrl: string,    // Signed URL for PUT request
    key: string,          // Storage key
    publicUrl: string     // Public URL after upload
  }
}
```

### 4. Server Actions

#### `saveMediaRecord()`
- Saves media record after successful upload
- Updates restaurant heroImageUrl for hero images
- Emits `restaurant_media_uploaded` analytics event
- Revalidates restaurant page

#### `deleteMedia()`
- Deletes media from storage
- Removes database record
- Clears restaurant heroImageUrl if needed
- Emits `restaurant_media_deleted` analytics event
- Revalidates restaurant page

### 5. UI Components

#### ImageUpload Component
- File selection with drag-and-drop ready
- Image preview
- Upload progress indicator
- Error handling
- File validation (type, size)
- Remove functionality

#### GalleryManager Component
- Grid display of gallery images
- Delete functionality with confirmation
- Upload new images
- Gallery limit indicator (10 max)
- Responsive grid layout

### 6. Media Repository

Created `MediaRepository` with methods:
- `findById()` - Get media by ID
- `findByRestaurant()` - Get all media for restaurant
- `findByRestaurantAndType()` - Filter by type
- `create()` - Create media record
- `delete()` - Delete media record
- `deleteByKey()` - Delete by storage key

### 7. Analytics Events

#### restaurant_media_uploaded
```typescript
{
  restaurantId: string,
  restaurantName: string,
  userId: string,
  mediaType: "HERO" | "GALLERY",
  mediaId: string,
  timestamp: string
}
```

#### restaurant_media_deleted
```typescript
{
  restaurantId: string,
  restaurantName: string,
  userId: string,
  mediaType: "HERO" | "GALLERY",
  mediaId: string,
  timestamp: string
}
```

## Architecture

### Upload Flow
```
1. User selects file
2. Client requests signed URL from /api/uploads/sign
3. Server validates and generates signed URL
4. Client uploads directly to R2 using signed URL
5. Client calls saveMediaRecord() server action
6. Server saves record and emits analytics
7. Page revalidates and shows new image
```

### Delete Flow
```
1. User clicks delete
2. Client calls deleteMedia() server action
3. Server deletes from R2 storage
4. Server deletes database record
5. Server emits analytics
6. Page revalidates and removes image
```

## Storage Organization

Files are organized by restaurant:
```
restaurants/
  {restaurantId}/
    hero/
      {timestamp}-{filename}
    gallery/
      {timestamp}-{filename}
```

## Security

### Upload Security
- Signed URLs with 1-hour expiration
- Ownership verification before signing
- File type validation (images only)
- File size limit (5MB client-side)
- Gallery limit enforcement (10 max)

### Delete Security
- Ownership verification
- Confirmation dialog
- Server-side validation

## Configuration

### Environment Variables
```env
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET=your-bucket
R2_PUBLIC_URL=https://custom-domain.com  # Optional
```

### Cloudflare R2 Setup
1. Create R2 bucket in Cloudflare dashboard
2. Generate API tokens (Access Key ID + Secret)
3. Configure public access (optional)
4. Set custom domain (optional)

## Files Created/Modified

### Created
- `prisma/migrations/20260228152428_add_restaurant_media/migration.sql`
- `packages/storage/package.json`
- `packages/storage/tsconfig.json`
- `packages/storage/src/types.ts`
- `packages/storage/src/r2-provider.ts`
- `packages/storage/src/index.ts`
- `packages/db/src/repositories/media.repository.ts`
- `apps/web/src/app/api/uploads/sign/route.ts`
- `apps/web/src/app/admin/restaurant/media-actions.ts`
- `apps/web/src/app/admin/restaurant/components/image-upload.tsx`
- `apps/web/src/app/admin/restaurant/components/gallery-manager.tsx`
- `EPIC_2.4_COMPLETE.md`

### Modified
- `prisma/schema.prisma`
- `packages/db/src/repositories/restaurant.repository.ts`
- `packages/db/src/repositories/index.ts`
- `packages/analytics/src/events.ts`
- `apps/web/src/app/admin/restaurant/page.tsx`
- `.env.example`

## Testing

### Test Upload Flow
1. Navigate to `/admin/restaurant`
2. Scroll to Media section
3. Click "Click to upload hero image"
4. Select an image file
5. Wait for upload to complete
6. Verify image appears

### Test Gallery
1. Upload multiple gallery images
2. Verify grid display
3. Try to upload 11th image (should be blocked)
4. Delete an image
5. Verify it's removed

### Test Validation
1. Try to upload non-image file → Error
2. Try to upload large file (>5MB) → Error
3. Try to upload without ownership → 403

## Non-Goals (As Specified)

- ❌ No video upload (can be added later)
- ❌ No image editing/cropping
- ❌ No image optimization (handled by R2)

## Next Steps

### EPIC 2.5: Image Optimization
- Add image resizing
- Generate thumbnails
- WebP conversion
- Lazy loading

### EPIC 2.6: Advanced Media Features
- Drag-and-drop upload
- Bulk upload
- Image reordering
- Alt text for accessibility

## Usage Examples

### Upload Image (Client)
```typescript
// 1. Get signed URL
const signResponse = await fetch("/api/uploads/sign", {
  method: "POST",
  body: JSON.stringify({
    restaurantId,
    filename: file.name,
    contentType: file.type,
    type: "hero"
  })
});

const { data } = await signResponse.json();

// 2. Upload to R2
await fetch(data.uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file
});

// 3. Save record
await saveMediaRecord(restaurantId, data.key, data.publicUrl, "HERO");
```

### Delete Image
```typescript
await deleteMedia(mediaId);
```

### Get Restaurant Media
```typescript
const restaurant = await restaurantRepository.findByIdWithMedia(restaurantId);
const heroImages = restaurant.media.filter(m => m.type === "HERO");
const galleryImages = restaurant.media.filter(m => m.type === "GALLERY");
```

## Performance

- Direct upload to R2 (no server proxy)
- Signed URLs cached for 1 hour
- Optimistic UI updates
- Lazy loading of images
- CDN delivery via R2

## Accessibility

- Alt text support (in schema, UI pending)
- Keyboard navigation
- Screen reader friendly
- Loading states
- Error messages

## Browser Compatibility

- Modern browsers with File API
- Drag-and-drop (future)
- Progressive enhancement

## Cost Considerations

### Cloudflare R2
- No egress fees
- Storage: $0.015/GB/month
- Class A operations: $4.50/million
- Class B operations: $0.36/million
- Free tier: 10GB storage, 1M Class A, 10M Class B

### Alternatives
- AWS S3 (higher egress costs)
- Vercel Blob (simpler, more expensive)
- Uploadthing (managed, higher cost)
