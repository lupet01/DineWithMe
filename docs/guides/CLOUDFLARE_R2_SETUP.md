# Cloudflare R2 Setup Guide - Step by Step

## What is Cloudflare R2?

Cloudflare R2 is an S3-compatible object storage service with:
- **No egress fees** (free data transfer out)
- **10GB free storage** per month
- **1 million free Class A operations** (uploads, lists)
- **10 million free Class B operations** (downloads)
- Very affordable beyond free tier

## Step-by-Step Setup

### Step 1: Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Enter your email and create a password
3. Verify your email address
4. You'll be taken to the Cloudflare dashboard

**Note:** You don't need to add a domain to use R2!

### Step 2: Access R2 Storage

1. In the Cloudflare dashboard, look at the left sidebar
2. Click on **"R2"** (it's under the "Storage & Databases" section)
3. If you don't see R2, scroll down in the sidebar
4. Click **"Get Started"** or **"Create Bucket"**

**First-time setup:**
- You may need to verify your account with a payment method
- Don't worry - you won't be charged unless you exceed the free tier
- Add a credit/debit card for verification

### Step 3: Create Your First Bucket

1. Click **"Create bucket"** button
2. Enter a bucket name:
   - Use lowercase letters, numbers, and hyphens only
   - Example: `dinewithme-media` or `dinewithme-dev`
   - Must be unique across all of Cloudflare
3. Choose a location (optional):
   - Select "Automatic" for best performance
   - Or choose a specific region close to your users
4. Click **"Create bucket"**

**Your bucket is now created!** ✅

### Step 4: Enable Public Access (Optional but Recommended)

This allows images to be viewed without authentication:

1. Click on your newly created bucket
2. Go to the **"Settings"** tab
3. Scroll down to **"Public access"**
4. Click **"Allow Access"**
5. You'll see a public URL like: `https://pub-xxxxxxxxxxxxx.r2.dev`
6. **Copy this URL** - you'll need it for `R2_PUBLIC_URL`

**Note:** This makes your bucket publicly readable but not writable (secure).

### Step 5: Generate API Tokens

Now we need to create credentials for your app to upload files:

1. In the R2 section, click **"Manage R2 API Tokens"** (top right)
   - Or go directly to: https://dash.cloudflare.com/?to=/:account/r2/api-tokens
2. Click **"Create API token"**
3. Configure the token:
   - **Token name:** `DineWithMe Development` (or any name you like)
   - **Permissions:** Select **"Object Read & Write"**
   - **TTL (Time to Live):** Leave as "Forever" or set an expiration
   - **Bucket restrictions:** 
     - Select "Apply to specific buckets only"
     - Choose your bucket (`dinewithme-media`)
4. Click **"Create API Token"**

### Step 6: Save Your Credentials

**IMPORTANT:** You'll see a screen with your credentials. This is shown **ONLY ONCE**!

You'll see:
- **Access Key ID** - looks like: `a1b2c3d4e5f6g7h8i9j0`
- **Secret Access Key** - looks like: `abcdefghijklmnopqrstuvwxyz1234567890ABCD`

**Copy both of these immediately!**

### Step 7: Get Your Account ID

1. Still in the Cloudflare dashboard
2. Look at the URL in your browser
3. It will look like: `https://dash.cloudflare.com/a1b2c3d4e5f6g7h8i9j0/r2/...`
4. The part after `/` and before `/r2/` is your **Account ID**
5. Or find it in the right sidebar under "Account ID"

### Step 8: Configure Your .env File

Now add all the credentials to your `.env` file:

```env
# Cloudflare R2 Storage
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=your_access_key_from_step_6
R2_SECRET_ACCESS_KEY=your_secret_key_from_step_6
R2_BUCKET=dinewithme-media
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
```

**Replace:**
- `YOUR_ACCOUNT_ID` with your Account ID from Step 7
- `your_access_key_from_step_6` with your Access Key ID
- `your_secret_key_from_step_6` with your Secret Access Key
- `pub-xxxxxxxxxxxxx.r2.dev` with your public URL from Step 4

### Step 9: Test Your Setup

1. Save your `.env` file
2. Restart your dev server:
   ```powershell
   # Stop the server (Ctrl+C)
   npm run dev
   ```
3. Navigate to http://localhost:3001/admin/restaurant
4. Scroll to the Media section
5. Try uploading an image!

## Example Configuration

Here's what your `.env` should look like (with fake values):

```env
# Cloudflare R2 Storage
R2_ENDPOINT=https://a1b2c3d4e5f6g7h8i9j0.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8i9j0
R2_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz1234567890ABCD
R2_BUCKET=dinewithme-media
R2_PUBLIC_URL=https://pub-1234567890abcdef.r2.dev
```

## Troubleshooting

### "Account ID not found"
- Double-check your Account ID in the Cloudflare dashboard
- Make sure there are no extra spaces in your `.env` file

### "Access Denied"
- Verify your Access Key ID and Secret Access Key are correct
- Make sure the API token has "Object Read & Write" permissions
- Check that the token is applied to your specific bucket

### "Bucket not found"
- Verify the bucket name matches exactly (case-sensitive)
- Make sure the bucket exists in your Cloudflare account

### Images not displaying
- Check that public access is enabled on your bucket
- Verify R2_PUBLIC_URL is set correctly
- Try accessing the public URL directly in your browser

### "CORS error"
If you get CORS errors, add CORS rules to your bucket:

1. Go to your bucket in Cloudflare dashboard
2. Click "Settings" tab
3. Scroll to "CORS policy"
4. Add this configuration:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3001"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## Security Best Practices

### For Development
- Use separate buckets for dev/staging/production
- Create separate API tokens for each environment
- Set token expiration dates

### For Production
- Use custom domain instead of r2.dev URL
- Enable access logs
- Set up bucket lifecycle policies
- Use separate API tokens with minimal permissions

## Cost Monitoring

To monitor your usage:

1. Go to R2 dashboard
2. Click on your bucket
3. View "Metrics" tab
4. Check storage usage and operations

**Free tier limits:**
- Storage: 10 GB/month
- Class A operations: 1 million/month (uploads, lists)
- Class B operations: 10 million/month (downloads)

## Custom Domain (Optional)

To use your own domain instead of r2.dev:

1. Go to your bucket settings
2. Click "Connect Domain"
3. Enter your domain (e.g., `cdn.yourdomain.com`)
4. Add the CNAME record to your DNS
5. Wait for DNS propagation
6. Update `R2_PUBLIC_URL` in `.env`

## Next Steps

After setup:
1. ✅ Restart your dev server
2. ✅ Navigate to `/admin/restaurant`
3. ✅ Upload a hero image
4. ✅ Upload gallery images
5. ✅ Test delete functionality

## Need Help?

If you get stuck:
1. Check the Cloudflare R2 documentation: https://developers.cloudflare.com/r2/
2. Verify all environment variables are set correctly
3. Check the browser console for error messages
4. Check the server logs for detailed errors

## Quick Checklist

Before testing uploads, verify:
- [ ] Cloudflare account created
- [ ] R2 bucket created
- [ ] Public access enabled
- [ ] API token created with Read & Write permissions
- [ ] Account ID copied
- [ ] Access Key ID copied
- [ ] Secret Access Key copied
- [ ] Public URL copied
- [ ] All values added to `.env`
- [ ] Dev server restarted
- [ ] No typos in environment variables

## Alternative: Use AWS S3

If you prefer AWS S3, the setup is similar:

```env
R2_ENDPOINT=https://s3.amazonaws.com
R2_REGION=us-east-1
R2_ACCESS_KEY_ID=your_aws_access_key
R2_SECRET_ACCESS_KEY=your_aws_secret_key
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.s3.amazonaws.com
```

The code works with any S3-compatible storage!
