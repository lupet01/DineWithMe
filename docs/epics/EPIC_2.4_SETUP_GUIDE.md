# EPIC 2.4: Setup Guide

## Quick Setup

### 1. Apply Database Migration

```powershell
# Apply migration
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -f prisma/migrations/20260228152428_add_restaurant_media/migration.sql

# Generate Prisma client
cd prisma
npx prisma generate
cd ..
```

### 2. Install Dependencies

```powershell
npm install
```

### 3. Configure Cloudflare R2

#### Option A: Use Cloudflare R2 (Recommended)

1. Go to https://dash.cloudflare.com
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., "dinewithme-media")
4. Generate API tokens:
   - Go to "Manage R2 API Tokens"
   - Create API token with "Object Read & Write" permissions
   - Save Access Key ID and Secret Access Key

5. Add to `.env`:
```env
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_key_here
R2_BUCKET=dinewithme-media
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # Optional: from R2 dashboard
```

#### Option B: Use AWS S3

Works with any S3-compatible storage:

```env
R2_ENDPOINT=https://s3.amazonaws.com
R2_REGION=us-east-1
R2_ACCESS_KEY_ID=your_aws_key
R2_SECRET_ACCESS_KEY=your_aws_secret
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.s3.amazonaws.com
```

#### Option C: Local Development (MinIO)

For local testing without cloud storage:

1. Install MinIO: https://min.io/download
2. Run MinIO locally
3. Configure:
```env
R2_ENDPOINT=http://localhost:9000
R2_REGION=us-east-1
R2_ACCESS_KEY_ID=minioadmin
R2_SECRET_ACCESS_KEY=minioadmin
R2_BUCKET=dinewithme-local
```

### 4. Test Upload

1. Start dev server: `npm run dev`
2. Navigate to `/admin/restaurant`
3. Scroll to Media section
4. Upload a hero image
5. Upload gallery images

## Troubleshooting

### "Storage configuration is incomplete"
- Check all R2_* environment variables are set
- Restart dev server after adding env vars

### "Failed to get upload URL"
- Verify R2 credentials are correct
- Check bucket exists
- Verify API token has correct permissions

### "Failed to upload file"
- Check CORS settings on R2 bucket
- Verify signed URL hasn't expired
- Check file size (<5MB)

### Images not displaying
- Verify R2_PUBLIC_URL is set correctly
- Check bucket has public access enabled
- Verify custom domain is configured

## CORS Configuration

If using custom domain, add CORS rules to R2 bucket:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## Features

✅ Hero image upload
✅ Gallery images (max 10)
✅ Image preview
✅ Delete images
✅ File validation
✅ Progress indicators
✅ Analytics tracking
✅ Secure signed URLs

## Next Steps

After setup:
1. Upload hero image for your restaurant
2. Add gallery images
3. Test delete functionality
4. Check analytics events in PostHog
