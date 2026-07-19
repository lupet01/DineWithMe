# Test Checklist - EPIC 2.4 Media Upload

## Pre-Test Setup

- [x] R2 bucket name fixed: `dinewithme-media`
- [x] Build error fixed: Changed Upload to ImagePlus icon
- [x] Admin layout rewritten with better error handling
- [ ] Dev server running on port 3001
- [ ] Signed in as user with RESTAURANT_ADMIN role

---

## Test 1: Build Verification

**Command**:
```bash
cd apps/web
npm run build
```

**Expected Result**:
- ✅ Build completes without errors
- ✅ No "Module not found" errors
- ✅ No TypeScript errors

**If Failed**:
- Check console output for specific errors
- Run `npm run type-check` to see TypeScript issues

---

## Test 2: Admin Portal Access

**Steps**:
1. Start dev server: `npm run dev` (from root)
2. Open browser: http://localhost:3001
3. Sign in with your account (luupetros@gmail.com)
4. Navigate to: http://localhost:3001/dashboard
5. Wait for "Your profile has been synced" message
6. Navigate to: http://localhost:3001/admin/restaurant

**Expected Result**:
- ✅ Should see "Restaurant Profile" page
- ✅ Should NOT redirect to /dashboard
- ✅ Should see restaurant form or onboarding

**If Failed**:
- Check browser console for errors
- Check server logs for database errors
- Verify user role in database:
  ```bash
  psql -U postgres -d dinewithme -c "SELECT email, role FROM \"User\" WHERE email = 'luupetros@gmail.com';"
  ```
  Should show: `RESTAURANT_ADMIN`

---

## Test 3: Restaurant Creation (If First Time)

**Steps**:
1. On `/admin/restaurant` page
2. Fill in restaurant details:
   - Name: "Test Restaurant"
   - Description: "A test restaurant"
   - Address: "123 Test St"
   - Phone: "+1234567890"
   - Email: "test@restaurant.com"
3. Click "Create Restaurant"

**Expected Result**:
- ✅ Form submits successfully
- ✅ Success message appears
- ✅ Page reloads showing edit mode
- ✅ Can see "Upload Hero Image" section

**If Failed**:
- Check browser console for errors
- Check server logs for database/validation errors
- Verify database connection is working

---

## Test 4: Hero Image Upload

**Steps**:
1. On restaurant profile page (edit mode)
2. Scroll to "Hero Image" section
3. Click the upload area
4. Select an image file (PNG, JPG, or WEBP, < 5MB)
5. Wait for upload to complete

**Expected Result**:
- ✅ Upload progress indicator shows
- ✅ Image uploads successfully
- ✅ Image displays in the upload area
- ✅ Image URL starts with R2_PUBLIC_URL from .env
- ✅ Console shows: "restaurant_media_uploaded" event

**If Failed**:
- Check browser console for errors
- Check Network tab for failed requests
- Verify R2 credentials in `.env`:
  - R2_ENDPOINT
  - R2_ACCESS_KEY_ID
  - R2_SECRET_ACCESS_KEY
  - R2_BUCKET
  - R2_PUBLIC_URL
- Check server logs for R2 connection errors

---

## Test 5: Gallery Images Upload

**Steps**:
1. Scroll to "Gallery Images" section
2. Click "Add Image" button
3. Select an image file
4. Repeat for multiple images (up to 10)

**Expected Result**:
- ✅ Each image uploads successfully
- ✅ Images display in gallery grid
- ✅ Can remove images with X button
- ✅ Maximum 10 images enforced

**If Failed**:
- Same troubleshooting as Test 4
- Check if gallery manager component is rendering

---

## Test 6: Image Deletion

**Steps**:
1. Hover over an uploaded image
2. Click the X button
3. Confirm deletion (if prompted)

**Expected Result**:
- ✅ Image removed from UI
- ✅ Image deleted from R2 storage
- ✅ Console shows: "restaurant_media_deleted" event

**If Failed**:
- Check browser console for errors
- Check server logs for deletion errors
- Verify R2 delete permissions

---

## Test 7: Form Persistence

**Steps**:
1. Upload hero image
2. Upload 2-3 gallery images
3. Navigate away: http://localhost:3001/admin
4. Navigate back: http://localhost:3001/admin/restaurant

**Expected Result**:
- ✅ Hero image still displays
- ✅ Gallery images still display
- ✅ All restaurant data persists

**If Failed**:
- Check database for media records:
  ```bash
  psql -U postgres -d dinewithme -c "SELECT * FROM \"RestaurantMedia\";"
  ```

---

## Troubleshooting Common Issues

### Issue: Clerk Infinite Redirect Loop

**Symptoms**: Console shows repeated Clerk errors

**Fix**:
1. Clear browser cookies for localhost:3001
2. Clear Local Storage and Session Storage
3. Close browser completely
4. Restart dev server
5. Open fresh browser window

### Issue: "User not found" or Redirect to Dashboard

**Fix**:
1. Go to http://localhost:3001/dashboard first
2. Wait for sync to complete
3. Then try admin portal

### Issue: R2 Upload Fails

**Fix**:
1. Verify R2 credentials in Cloudflare dashboard
2. Check bucket permissions (public read, authenticated write)
3. Verify CORS settings on bucket
4. Check R2_PUBLIC_URL is correct

### Issue: Images Don't Display

**Fix**:
1. Check R2_PUBLIC_URL in .env
2. Verify bucket has public access enabled
3. Check browser console for CORS errors
4. Verify image URLs in database match public URL

---

## Success Criteria

All tests pass:
- ✅ Build completes without errors
- ✅ Can access admin portal without redirect
- ✅ Can create/edit restaurant profile
- ✅ Can upload hero image
- ✅ Can upload gallery images
- ✅ Can delete images
- ✅ Images persist across page reloads
- ✅ Images display with correct public URLs

---

## After Testing

If all tests pass:
1. EPIC 2.4 is complete ✅
2. Ready to move to next epic
3. Media upload system is fully functional

If tests fail:
1. Note which test failed
2. Check troubleshooting section
3. Review error messages
4. Ask for help with specific error details
