# EPIC 2.6 Testing Guide

## Prerequisites

- [x] Database schema updated with Dinner model
- [x] Prisma client generated
- [ ] Dev server running
- [ ] Signed in as RESTAURANT_ADMIN
- [ ] Test data seeded

---

## Step 1: Sync Database Schema

The schema has been updated with the Dinner model. Sync it:

```bash
cd prisma
npx prisma db push
```

Expected output: "Your database is now in sync"

---

## Step 2: Generate Prisma Client

**Important**: Stop the dev server first (Ctrl+C), then:

```bash
cd prisma
npx prisma generate
```

Expected output: "Generated Prisma Client"

---

## Step 3: Seed Test Data

Create sample dinners for testing:

```bash
npx tsx seed-dinners.ts
```

Expected output:
```
Seeding dinners...
Found restaurant: [Your Restaurant Name]
Created dinner: Italian Night (SCHEDULED)
Created dinner: Sushi Experience (SCHEDULED)
Created dinner: Farm to Table (SCHEDULED)
Created dinner: French Bistro (COMPLETED)
Created dinner: BBQ Night (CANCELLED)
✅ Dinners seeded successfully!
```

---

## Step 4: Start Dev Server

```bash
npm run dev
```

Wait for server to start on http://localhost:3001

---

## Step 5: Access Dinners Dashboard

1. Open browser: http://localhost:3001
2. Sign in with your RESTAURANT_ADMIN account
3. Navigate to: http://localhost:3001/admin/dinners

Expected: See dinners table with 5 dinners

---

## Step 6: Test Filter Tabs

### Test "All Dinners" Tab
- Click "All Dinners" tab
- Should see all 5 dinners

### Test "Upcoming" Tab
- Click "Upcoming" tab
- Should see 3 dinners (Italian Night, Sushi Experience, Farm to Table)
- All should have SCHEDULED status

### Test "Past" Tab
- Click "Past" tab
- Should see 2 dinners (French Bistro, BBQ Night)
- One COMPLETED, one CANCELLED

---

## Step 7: Test Status Updates

### Mark Dinner as LIVE

1. Go to "Upcoming" tab
2. Find "Italian Night" dinner
3. Click "Mark Live" button
4. Confirm in dialog
5. Expected:
   - Status badge changes to green "LIVE"
   - "Mark Live" button disappears
   - "Complete" button appears
   - "Cancel" button still visible

### Mark Dinner as COMPLETED

1. Find the dinner you just marked as LIVE
2. Click "Complete" button
3. Confirm in dialog
4. Expected:
   - Status badge changes to gray "COMPLETED"
   - All action buttons disappear
   - Shows "No actions"

---

## Step 8: Test Cancellation

### Cancel a Scheduled Dinner

1. Go to "Upcoming" tab
2. Find "Sushi Experience" dinner
3. Note the filled seats (should be 6)
4. Click "Cancel" button
5. Confirm: "All seats will be released"
6. Expected:
   - Status badge changes to red "CANCELLED"
   - Filled seats changes to 0
   - Available seats changes to 8 (total)
   - All action buttons disappear

### Try to Cancel Completed Dinner

1. Go to "Past" tab
2. Find "French Bistro" (COMPLETED)
3. Expected:
   - No "Cancel" button visible
   - Shows "No actions"

---

## Step 9: Verify Data Display

Check each dinner row shows:

**Date & Time**:
- ✅ Formatted date (e.g., "Mar 2, 2026")
- ✅ Formatted time (e.g., "7:00 PM")

**Theme**:
- ✅ Theme name displayed
- ✅ Description shown below (if exists)

**Seats**:
- ✅ Filled / Total format (e.g., "8 / 12")
- ✅ Available count below (e.g., "4 available")

**Status**:
- ✅ Color-coded badge
- ✅ Correct status text

**Actions**:
- ✅ Appropriate buttons for status
- ✅ Buttons disabled during updates

---

## Step 10: Test Empty State

1. Delete all dinners from database:
   ```bash
   psql -U postgres -d dinewithme -c "DELETE FROM dinners;"
   ```

2. Refresh page

3. Expected:
   - See empty state with 🍽️ emoji
   - Message: "No dinners yet"
   - Helpful text about creating first dinner

4. Re-seed data:
   ```bash
   npx tsx seed-dinners.ts
   ```

---

## Step 11: Check Analytics (Optional)

Open browser console and perform actions:

1. Mark a dinner as LIVE
2. Check console for:
   ```
   Analytics Event: dinner_status_changed
   {
     dinnerId: "...",
     restaurantId: "...",
     oldStatus: "SCHEDULED",
     newStatus: "LIVE",
     ...
   }
   ```

3. Cancel a dinner
4. Check console for:
   ```
   Analytics Event: dinner_cancelled
   {
     dinnerId: "...",
     releasedSeats: 6,
     ...
   }
   ```

---

## Step 12: Test Authorization (Optional)

1. Sign out
2. Sign in as a DINER user
3. Try to access: http://localhost:3001/admin/dinners
4. Expected: Redirect to /app/unauthorized

---

## Troubleshooting

### "Dinner model not found" Error

**Solution**: Generate Prisma client
```bash
cd prisma
npx prisma generate
```

### "No restaurant found" When Seeding

**Solution**: Create a restaurant first
```bash
# Go to http://localhost:3001/admin/restaurant
# Fill in restaurant details and save
# Then run seed script again
```

### Actions Don't Work

**Solution**: Check browser console for errors
- Verify user is RESTAURANT_ADMIN
- Check server logs for authorization errors
- Ensure dinner belongs to user's restaurant

### Filters Don't Work

**Solution**: Check date calculations
- Upcoming: scheduledAt >= now AND status IN (SCHEDULED, LIVE)
- Past: scheduledAt < now OR status IN (COMPLETED, CANCELLED)

---

## Success Criteria

All tests pass:
- ✅ Database schema synced
- ✅ Test data seeded successfully
- ✅ Dashboard loads without errors
- ✅ All 3 filter tabs work correctly
- ✅ Can mark dinner as LIVE
- ✅ Can mark dinner as COMPLETED
- ✅ Can cancel dinner
- ✅ Seats released on cancellation
- ✅ Status badges color-coded correctly
- ✅ Action buttons show/hide appropriately
- ✅ Analytics events tracked
- ✅ Empty state displays correctly

---

## Next Steps After Testing

If all tests pass:
1. ✅ EPIC 2.6 is complete
2. Ready for production use
3. Can proceed to next epic (diner notifications, seat management, etc.)

If tests fail:
1. Note which test failed
2. Check error messages
3. Review troubleshooting section
4. Check server logs for details
