# Fix: Buttons Not Working

## Issue
Clicking buttons (Create Dinner, Update Restaurant, Upload Image) doesn't work.

## Diagnosis Steps

### Step 1: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Click the button
4. Look for errors

Common errors:
- `TypeError: Cannot read property...` - Missing data
- `Failed to fetch` - Network/CORS issue
- `Unauthorized` - Authentication issue
- `Permission denied` - Authorization issue

### Step 2: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Click the button
4. Look for failed requests (red)

Check:
- Status code (should be 200)
- Response body (look for error messages)
- Request payload (verify data is sent)

### Step 3: Check Server Logs

Look at your terminal where `npm run dev` is running.

Look for:
- Error messages
- Stack traces
- Database errors
- Authorization failures

---

## Common Issues & Fixes

### Issue 1: Image Upload - CORS Error

**Symptoms**:
- Upload button doesn't work
- Console shows: `Access to fetch... blocked by CORS policy`

**Fix**: Configure CORS on R2 bucket (see `R2_CORS_FIX.md`)

---

### Issue 2: Restaurant Update - No Restaurant Membership

**Symptoms**:
- Update button doesn't work
- Error: "You do not have permission"

**Fix**: Add yourself as restaurant owner

```bash
# Get your user ID
psql -U postgres -d dinewithme -c "SELECT id FROM users WHERE email = 'luupetros@gmail.com';"

# Get restaurant ID
psql -U postgres -d dinewithme -c "SELECT id FROM restaurants LIMIT 1;"

# Add membership (replace IDs)
psql -U postgres -d dinewithme -c "INSERT INTO restaurant_members (id, \"restaurantId\", \"userId\", role, \"createdAt\") VALUES (gen_random_uuid()::text, 'RESTAURANT_ID', 'USER_ID', 'OWNER', NOW()) ON CONFLICT DO NOTHING;"
```

---

### Issue 3: Create Dinner - Button Not Implemented

**Symptoms**:
- "Create Dinner" button does nothing
- No errors in console

**Reason**: The create dinner functionality hasn't been implemented yet in EPIC 2.6. Only viewing and managing existing dinners is implemented.

**Workaround**: Use the seed script to create dinners:
```bash
npx tsx seed-dinners.ts
```

---

### Issue 4: Form Submission - JavaScript Not Loading

**Symptoms**:
- Buttons don't respond at all
- No console errors
- Page might reload

**Fix**: Check if JavaScript is enabled and loading

1. Open DevTools → Sources tab
2. Look for your component files
3. Check if there are any load errors

Try:
```bash
# Clear Next.js cache
rm -rf apps/web/.next
npm run dev
```

---

### Issue 5: Server Action - Authentication Issue

**Symptoms**:
- Button click causes redirect
- Console shows: "Unauthorized"

**Fix**: Ensure you're signed in

1. Go to http://localhost:3001/dashboard
2. Wait for "Your profile has been synced"
3. Try the button again

---

### Issue 6: Database Connection Issue

**Symptoms**:
- Buttons hang/loading forever
- Server logs show database errors

**Fix**: Check database connection

```bash
# Test database connection
psql -U postgres -d dinewithme -c "SELECT 1;"

# If fails, start PostgreSQL
# Windows: Start PostgreSQL service
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

---

## Specific Button Fixes

### "Create Dinner" Button

This button is a placeholder. To create dinners, use:

```bash
npx tsx seed-dinners.ts
```

Or manually:
```bash
psql -U postgres -d dinewithme -c "INSERT INTO dinners (id, \"restaurantId\", \"scheduledAt\", theme, \"totalSeats\", \"filledSeats\", status, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid()::text, 'YOUR_RESTAURANT_ID', NOW() + INTERVAL '7 days', 'Test Dinner', 10, 0, 'SCHEDULED', NOW(), NOW());"
```

### "Update Restaurant" Button

If not working:

1. Check you're on `/admin/restaurant` page
2. Fill in at least the required fields (name, address, phone)
3. Click "Update Restaurant"
4. Check console for errors

Debug:
```javascript
// In browser console
console.log('Form data:', document.querySelector('form'));
```

### "Upload Image" Button

If not working:

1. **First**: Configure CORS (see `R2_CORS_FIX.md`)
2. Check file size < 5MB
3. Check file type is image (PNG, JPG, WEBP)
4. Check R2 credentials in `.env`

---

## Quick Debug Commands

```bash
# Check if you're a restaurant owner
psql -U postgres -d dinewithme -c "SELECT u.email, rm.role, r.name FROM restaurant_members rm JOIN users u ON rm.\"userId\" = u.id JOIN restaurants r ON rm.\"restaurantId\" = r.id WHERE u.email = 'luupetros@gmail.com';"

# Check if dinners exist
psql -U postgres -d dinewithme -c "SELECT COUNT(*) FROM dinners;"

# Check if restaurant exists
psql -U postgres -d dinewithme -c "SELECT id, name FROM restaurants;"

# Restart dev server
# Ctrl+C to stop
npm run dev
```

---

## Still Not Working?

If buttons still don't work after trying above:

1. **Share the exact error message** from browser console
2. **Share the server logs** from terminal
3. **Share which button** isn't working
4. **Share what happens** when you click (nothing? error? loading?)

Then I can provide a specific fix!

---

## Expected Behavior

### Restaurant Update Button
- Click → Loading state → Success message → Page refreshes

### Image Upload Button
- Click → File picker → Select image → Upload progress → Image displays

### Dinner Action Buttons
- Click → Confirmation dialog → Loading → Status changes → Table updates

### Create Dinner Button
- Currently not implemented (placeholder)
- Will be added in future epic
