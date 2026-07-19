# EPIC 3.2: Seat Hold Testing Guide

## Quick Start

### 1. Run Concurrency Test
```powershell
npx tsx test-seat-hold-concurrency.ts
```

Expected output:
```
Testing concurrent seat holds...

✅ Found dinner: Italian Night
   Available seats: 12

✅ Found 3 test users

Test 1: Concurrent holds by different users
-------------------------------------------
✅ User 1 (luupetros@gmail.com): Held seat abc123...
✅ User 2 (user2@example.com): Held seat def456...
✅ User 3 (user3@example.com): Held seat ghi789...

Results: 3 successful, 0 failed

✅ No duplicate seats held (atomicity verified)
```

### 2. Test API Endpoint

#### Get a Dinner ID
```powershell
psql -U postgres -d dinewithme -c "SELECT id, theme FROM dinners WHERE status = 'SCHEDULED' LIMIT 1;"
```

#### Test with cURL (PowerShell)
```powershell
# Replace DINNER_ID with actual ID from above
$dinnerId = "cmm7xxx..."

# Hold a seat
curl -X POST http://localhost:3001/api/seats/hold `
  -H "Content-Type: application/json" `
  -d "{\"dinnerId\": \"$dinnerId\", \"holdDurationMinutes\": 10}"
```

#### Test with Browser Console
1. Navigate to `http://localhost:3001/admin/dinners`
2. Open browser console (F12)
3. Run:

```javascript
// Get a dinner ID from the page
const dinnerId = "cmm7xxx..."; // Replace with actual ID

// Hold a seat
fetch("/api/seats/hold", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    dinnerId: dinnerId,
    holdDurationMinutes: 10
  })
})
  .then(res => res.json())
  .then(data => console.log("Result:", data));
```

## Test Scenarios

### Scenario 1: Successful Hold
**Steps:**
1. Sign in as a user
2. Find a dinner with available seats
3. Call POST /api/seats/hold with dinnerId
4. Verify response contains seatId and holdExpiresAt

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "seatId": "cmm7xxx...",
    "dinnerId": "cmm7xxx...",
    "status": "HELD",
    "holdExpiresAt": "2026-03-01T15:30:00.000Z",
    "message": "Seat held successfully"
  }
}
```

**Verify in Database:**
```powershell
psql -U postgres -d dinewithme -c "SELECT id, status, \"heldByUserId\", \"holdExpiresAt\" FROM seats WHERE status = 'HELD' ORDER BY \"updatedAt\" DESC LIMIT 5;"
```

### Scenario 2: User Already Has Seat
**Steps:**
1. Hold a seat for a dinner (Scenario 1)
2. Try to hold another seat for the same dinner
3. Verify error response

**Expected Result:**
```json
{
  "success": false,
  "error": {
    "message": "User already has a seat for this dinner",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

### Scenario 3: No Available Seats
**Steps:**
1. Find a dinner with all seats held/confirmed
2. Try to hold a seat
3. Verify error response

**Expected Result:**
```json
{
  "success": false,
  "error": {
    "message": "No available seats for this dinner",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Setup (make dinner full):**
```powershell
# Get dinner ID
$dinnerId = "cmm7xxx..."

# Mark all seats as HELD
psql -U postgres -d dinewithme -c "UPDATE seats SET status = 'HELD' WHERE \"dinnerId\" = '$dinnerId';"
```

### Scenario 4: Unauthorized Access
**Steps:**
1. Sign out
2. Try to hold a seat
3. Verify 401 error

**Expected Result:**
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```

### Scenario 5: Invalid Input
**Steps:**
1. Call API with invalid dinnerId
2. Verify validation error

**Test:**
```javascript
fetch("/api/seats/hold", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    dinnerId: "invalid-id",
    holdDurationMinutes: 10
  })
})
  .then(res => res.json())
  .then(data => console.log("Result:", data));
```

**Expected Result:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid request data",
    "code": "VALIDATION_ERROR",
    "details": [...]
  }
}
```

## Verify Analytics Events

### Check Events Were Emitted
```powershell
# Check audit logs
psql -U postgres -d dinewithme -c "SELECT * FROM audit_logs WHERE \"actionType\" = 'seat_held' ORDER BY \"createdAt\" DESC LIMIT 5;"
```

Expected columns:
- actorUserId: User who held the seat
- actionType: "seat_held"
- entityType: "seat"
- entityId: Seat ID
- metadata: { dinnerId, holdExpiresAt }

## Verify Seat Counts

### Check Seat Distribution
```powershell
# Get seat counts by status for a dinner
$dinnerId = "cmm7xxx..."

psql -U postgres -d dinewithme -c "SELECT status, COUNT(*) FROM seats WHERE \"dinnerId\" = '$dinnerId' GROUP BY status;"
```

Expected output:
```
  status   | count
-----------+-------
 AVAILABLE |     9
 HELD      |     3
```

### Check User's Seats
```powershell
# Get all seats held by a user
psql -U postgres -d dinewithme -c "SELECT s.id, s.status, d.theme, s.\"holdExpiresAt\" FROM seats s JOIN dinners d ON s.\"dinnerId\" = d.id WHERE s.\"heldByUserId\" = (SELECT id FROM users WHERE email = 'luupetros@gmail.com');"
```

## Performance Testing

### Test Concurrent Holds
```javascript
// In browser console
const dinnerId = "cmm7xxx...";

// Simulate 10 concurrent requests
const promises = Array.from({ length: 10 }, () =>
  fetch("/api/seats/hold", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dinnerId })
  }).then(res => res.json())
);

Promise.all(promises).then(results => {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`Successful: ${successful}, Failed: ${failed}`);
  console.log("Results:", results);
});
```

**Expected:**
- Only 1 should succeed (user can only hold 1 seat)
- Others should fail with "User already has a seat"

## Cleanup After Testing

### Release All Held Seats
```powershell
psql -U postgres -d dinewithme -c "UPDATE seats SET status = 'AVAILABLE', \"heldByUserId\" = NULL, \"holdExpiresAt\" = NULL WHERE status = 'HELD';"
```

### Delete Test Audit Logs
```powershell
psql -U postgres -d dinewithme -c "DELETE FROM audit_logs WHERE \"actionType\" = 'seat_held';"
```

## Troubleshooting

### Issue: "User not found in database"
**Solution:** Make sure you're signed in and your Clerk user is synced to the database.

### Issue: "No available seats"
**Solution:** Check seat status in database. Reset seats to AVAILABLE if needed.

### Issue: Transaction timeout
**Solution:** Check database connection. Restart PostgreSQL if needed.

### Issue: Duplicate seats held
**Solution:** This indicates a concurrency bug. Check transaction implementation.

## Success Criteria

- [ ] Concurrency test passes (no duplicate seats)
- [ ] Can hold a seat successfully
- [ ] Cannot hold multiple seats for same dinner
- [ ] Proper error when no seats available
- [ ] Proper error when unauthorized
- [ ] Audit logs created
- [ ] Seat status updated in database
- [ ] holdExpiresAt set correctly (10 minutes from now)

## Next Steps

After testing is complete:
1. Implement hold expiration cron job (EPIC 3.4)
2. Implement seat confirmation with payment (EPIC 3.3)
3. Implement seat release endpoint (EPIC 3.5)
4. Add UI for seat selection (EPIC 3.6)
