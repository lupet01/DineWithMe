# Fix R2 CORS Error

## Problem
Image uploads are failing with CORS error:
```
Access to fetch at 'https://dinethime-media...' has been blocked by CORS policy
```

## Solution: Configure CORS on R2 Bucket

### Step 1: Go to Cloudflare Dashboard

1. Open: https://dash.cloudflare.com
2. Click "R2" in the left sidebar
3. Click on your bucket: `dinewithme-media`

### Step 2: Configure CORS

1. Click the "Settings" tab
2. Scroll down to "CORS Policy"
3. Click "Add CORS Policy" or "Edit"
4. Add this configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3001",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. Click "Save"

### Step 3: Test Upload

1. Go back to: http://localhost:3001/admin/restaurant
2. Try uploading an image again
3. Should work now!

---

## Alternative: Use Wrangler CLI

If you prefer command line:

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create CORS config file
cat > cors.json << 'EOF'
[
  {
    "AllowedOrigins": ["http://localhost:3001"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
EOF

# Apply CORS config
wrangler r2 bucket cors put dinewithme-media --cors-config cors.json
```

---

## For Production

When deploying to production, update the CORS policy to include your production domain:

```json
{
  "AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
  ],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

---

## Verify CORS is Working

After configuring CORS:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try uploading an image
4. Look for the OPTIONS request (preflight)
5. Should see `Access-Control-Allow-Origin: http://localhost:3001` in response headers

---

## Common Issues

### Issue: Still getting CORS error after configuration

**Solution**: 
- Wait 1-2 minutes for CORS config to propagate
- Clear browser cache
- Try in incognito/private window
- Restart dev server

### Issue: CORS works but upload still fails

**Solution**:
- Check R2 bucket permissions
- Verify access keys are correct
- Check bucket name matches in .env

---

## Summary

The CORS error happens because browsers block cross-origin requests by default. By configuring CORS on your R2 bucket, you're telling Cloudflare to allow requests from your localhost development server.

Once configured, image uploads should work perfectly!
