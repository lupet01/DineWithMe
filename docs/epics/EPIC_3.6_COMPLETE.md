# EPIC 3.6: Check-in Endpoint for Diners - ✅ COMPLETE & TESTED

## What Was Built

### 1. Check-in Policy Configuration
**File:** `packages/config/src/seat-policy.ts`

#### Configuration Object: `checkInPolicy`
```typescript
export const checkInPolicy = {
  earlyCheckInMinutes: 30,  // Check-in opens 30 min before dinner
  lateCheckInMinutes: 30,   // Check-in closes 30 min after dinner starts
} as const;
```

#### Helper Functions:
- `isCheckInAllowed(dinnerStartsAt, now?)` - Check if check-in is allowed
- `getCheckInWindow(dinnerStartsAt)` - Get check-in window (opens/closes times)

**Policy Rules:**
- ✅ Check-in opens 30 minutes before dinner starts
- ✅ Check-in closes 30 minutes after dinner starts
- ✅ Total window: 60 minutes
- ✅ Only confirmed users can check in
- ✅ User must own the confirmed seat

### 2. QR Token System
**File:** `packages/shared/src/utils/qr-token.ts`

#### Token Format:
```
{seatId}.{dinnerId}.{timestamp}.{signature}
```

#### Functions:
- `generateCheckInToken(seatId, dinnerId)` - Generate HMAC-signed token
- `verifyCheckInToken(token)` - Verify token signature and expiry
- `generateCheckInUrl(seatId, dinnerId, baseUrl)` - Generate full check-in URL

**Token Features:**
- ✅ HMAC-SHA256 signature for security
- ✅ 24-hour expiry
- ✅ Tamper-proof
- ✅ Contains seat and dinner IDs

**Security:**
- Uses `QR_TOKEN_SECRET` environment variable
- Signature prevents token forgery
- Timestamp prevents replay attacks
- Expiry prevents old tokens from working

### 3. Repository Method
**File:** `packages/db/src/repositories/seat.repository.ts`

#### Enhanced Method: `checkIn()`
```typescript
async checkIn(seatId: string, userId: string): Promise<{
  seat: Seat;
  policyResult: { allowed: boolean; reason?: string; minutesUntilStart?: number };
}>
```

**Validations:**
1. ✅ Seat exists
2. ✅ Seat status is CONFIRMED
3. ✅ User owns the confirmation
4. ✅ Check-in is within time window

**Behavior:**
- Checks policy using `isCheckInAllowed()`
- Sets status to ATTENDED
- Sets `checkedInAt` timestamp
- Returns seat and policy result

### 4. API Endpoint
**File:** `apps/web/src/app/api/seats/check-in/route.ts`

#### POST /api/seats/check-in

**Two Check-in Methods:**

#### Method 1: Authenticated Check-in
**Request Body:**
```json
{
  "seatId": "cmm7xxx..."
}
```

**Method 2: QR Token Check-in**
**Request Body:**
```json
{
  "token": "seat_id.dinner_id.timestamp.signature"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "seatId": "cmm7xxx...",
    "dinnerId": "cmm7xxx...",
    "status": "ATTENDED",
    "checkedInAt": "2026-03-01T19:00:00.000Z",
    "message": "Checked in successfully",
    "minutesUntilStart": -5
  }
}
```

**Response (Error - Too Early):**
```json
{
  "success": false,
  "error": {
    "message": "Check-in opens 30 minutes before dinner starts",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Response (Error - Too Late):**
```json
{
  "success": false,
  "error": {
    "message": "Check-in closed 30 minutes after dinner started",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Features:**
- ✅ Supports both authenticated and QR token check-in
- ✅ Clerk authentication for authenticated check-in
- ✅ Token verification for QR check-in
- ✅ Policy enforcement
- ✅ Analytics events emitted
- ✅ Audit logging
- ✅ Proper error handling

### 5. QR Check-in Page
**File:** `apps/web/src/app/dinner/[id]/check-in/page.tsx`

#### URL: `/dinner/[id]/check-in?token=...`

**Features:**
- ✅ Automatic check-in on page load
- ✅ Loading state with spinner
- ✅ Success state with check mark
- ✅ Error state with error icon
- ✅ Check-in details display
- ✅ Navigation buttons
- ✅ Mobile-friendly design

**User Flow:**
1. User scans QR code
2. Opens check-in page with token
3. Page automatically calls API
4. Shows success or error message
5. User can view dinner details or go home

### 6. Analytics Events
**File:** `packages/analytics/src/events.ts`

#### New Events:
- ✅ `SEAT_CHECK_IN_SUCCESS` - When check-in succeeds
- ✅ `SEAT_CHECK_IN_DENIED` - When check-in is denied

**Event Payloads:**
```typescript
interface SeatCheckInSuccessEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  minutesUntilStart: number;
  timestamp: string;
}

interface SeatCheckInDeniedEvent {
  userId: string;
  dinnerId: string;
  seatId: string;
  reason: string;
  minutesUntilStart: number;
  timestamp: string;
}
```

### 7. Audit Logging
**File:** `packages/db/src/utils/audit-logger.ts`

#### Method: `seatCheckedIn()`
```typescript
async seatCheckedIn(
  actorUserId: string,
  seatId: string,
  dinnerId: string,
  metadata?: Record<string, any>
): Promise<void>
```

Logs all check-ins with method (authenticated or qr_token).

### 8. Test Script
**File:** `test-seat-check-in.ts`

#### Test Scenarios:
1. ✅ Successful check-in (within window)
2. ✅ Denied check-in (too early)
3. ✅ Denied check-in (too late)
4. ✅ Wrong user prevention
5. ✅ Seat not confirmed detection
6. ✅ QR token generation and verification

**Run Tests:**
```powershell
npx tsx test-seat-check-in.ts
```

## Seat Lifecycle Flow

```
AVAILABLE
    ↓ holdSeat()
HELD (with expiration)
    ↓ confirmSeat()
CONFIRMED
    ↓ checkIn() [this EPIC]
ATTENDED
    ↓ checkOut() [future]
COMPLETED
```

## Check-in Policy

### Time Window

```
Dinner starts at 7:00 PM

Check-in opens:  6:30 PM (30 min before)
Dinner starts:   7:00 PM
Check-in closes: 7:30 PM (30 min after)

Total window: 60 minutes
```

### Policy Examples

**Scenario 1: Check-in at 6:45 PM (dinner at 7:00 PM)**
- 15 minutes before start
- ✅ Allowed

**Scenario 2: Check-in at 7:15 PM (dinner at 7:00 PM)**
- 15 minutes after start
- ✅ Allowed

**Scenario 3: Check-in at 6:00 PM (dinner at 7:00 PM)**
- 60 minutes before start
- ❌ Denied: "Check-in opens 30 minutes before dinner starts"

**Scenario 4: Check-in at 7:45 PM (dinner at 7:00 PM)**
- 45 minutes after start
- ❌ Denied: "Check-in closed 30 minutes after dinner started"

## QR Token System

### Token Generation

```typescript
import { generateCheckInToken, generateCheckInUrl } from "@dinewithme/shared";

// Generate token
const token = generateCheckInToken(seatId, dinnerId);
// Result: "seat_id.dinner_id.1772387506891.1bfe95..."

// Generate full URL
const url = generateCheckInUrl(seatId, dinnerId, "https://dinewithme.com");
// Result: "https://dinewithme.com/dinner/dinner_id/check-in?token=..."
```

### Token Verification

```typescript
import { verifyCheckInToken } from "@dinewithme/shared";

const result = verifyCheckInToken(token);

if (result.valid) {
  console.log("Seat ID:", result.seatId);
  console.log("Dinner ID:", result.dinnerId);
} else {
  console.log("Invalid:", result.reason);
}
```

### Token Security

**HMAC-SHA256 Signature:**
- Prevents token forgery
- Uses `QR_TOKEN_SECRET` environment variable
- Must match exactly to be valid

**Timestamp:**
- Prevents replay attacks
- 24-hour expiry
- Old tokens automatically rejected

**Format:**
```
{seatId}.{dinnerId}.{timestamp}.{signature}
```

Example:
```
cmm7xxx.cmm8yyy.1772387506891.1bfe95a3c2d4e5f6...
```

## API Usage Examples

### Authenticated Check-in

```typescript
// User is logged in with Clerk
const response = await fetch("/api/seats/check-in", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    seatId: "cmm7xxx..."
  })
});

const data = await response.json();

if (data.success) {
  console.log("Checked in:", data.data.seatId);
  console.log("Status:", data.data.status); // "ATTENDED"
  console.log("Checked in at:", data.data.checkedInAt);
} else {
  console.error("Failed:", data.error.message);
}
```

### QR Token Check-in

```typescript
// User scans QR code with token
const response = await fetch("/api/seats/check-in", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "seat_id.dinner_id.timestamp.signature"
  })
});

const data = await response.json();

if (data.success) {
  console.log("Checked in via QR:", data.data.seatId);
} else {
  console.error("Failed:", data.error.message);
}
```

### Generate QR Code

```typescript
import { generateCheckInUrl } from "@dinewithme/shared";
import QRCode from "qrcode"; // npm install qrcode

// Generate check-in URL
const url = generateCheckInUrl(seatId, dinnerId, "https://dinewithme.com");

// Generate QR code image
const qrCodeDataUrl = await QRCode.toDataURL(url);

// Display in HTML
<img src={qrCodeDataUrl} alt="Check-in QR Code" />
```

## Error Scenarios

### 1. Too Early
```json
{
  "success": false,
  "error": {
    "message": "Check-in opens 30 minutes before dinner starts",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Wait until check-in window opens.

### 2. Too Late
```json
{
  "success": false,
  "error": {
    "message": "Check-in closed 30 minutes after dinner started",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Contact restaurant staff for manual check-in.

### 3. Wrong User
```json
{
  "success": false,
  "error": {
    "message": "Seat is confirmed by a different user",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Each user must check in with their own seat.

### 4. Seat Not Confirmed
```json
{
  "success": false,
  "error": {
    "message": "Cannot check in. Seat status: AVAILABLE",
    "code": "BUSINESS_LOGIC_ERROR"
  }
}
```

**Solution:** Confirm the seat first.

### 5. Invalid Token
```json
{
  "success": false,
  "error": {
    "message": "Invalid token signature",
    "code": "INVALID_TOKEN"
  }
}
```

**Solution:** Request a new QR code.

### 6. Expired Token
```json
{
  "success": false,
  "error": {
    "message": "Token expired",
    "code": "INVALID_TOKEN"
  }
}
```

**Solution:** Tokens expire after 24 hours. Request a new one.

## Testing

### Test Results

All tests passed successfully:

```
✅ Test 1: Successful check-in (within window)
✅ Test 2: Denied check-in (too early)
✅ Test 3: Denied check-in (too late)
✅ Test 4: Wrong user prevention
✅ Test 5: Seat not confirmed detection
✅ Test 6: QR token generation and verification
```

### Manual Testing

1. **Authenticated check-in:**
   ```bash
   curl -X POST http://localhost:3001/api/seats/check-in \
     -H "Content-Type: application/json" \
     -d '{"seatId": "YOUR_SEAT_ID"}'
   ```

2. **QR token check-in:**
   ```bash
   curl -X POST http://localhost:3001/api/seats/check-in \
     -H "Content-Type: application/json" \
     -d '{"token": "YOUR_TOKEN"}'
   ```

3. **Verify in database:**
   ```sql
   SELECT id, status, "checkedInAt", "confirmedByUserId"
   FROM seats
   WHERE id = 'YOUR_SEAT_ID';
   ```

### Browser Testing

```javascript
// 1. Generate token
const token = "seat_id.dinner_id.timestamp.signature";

// 2. Check in via QR
const res = await fetch("/api/seats/check-in", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token })
});
const data = await res.json();
console.log(data);

// 3. Or visit QR page directly
window.location.href = `/dinner/dinner_id/check-in?token=${token}`;
```

## Database Changes

### Seat Status Transition

**Before Check-in:**
```sql
SELECT status, "confirmedByUserId", "checkedInAt"
FROM seats WHERE id = 'xxx';

-- Result:
-- status: CONFIRMED
-- confirmedByUserId: user_id
-- checkedInAt: null
```

**After Check-in:**
```sql
SELECT status, "confirmedByUserId", "checkedInAt"
FROM seats WHERE id = 'xxx';

-- Result:
-- status: ATTENDED
-- confirmedByUserId: user_id
-- checkedInAt: 2026-03-01T19:00:00Z
```

### Query Checked-in Seats

```sql
-- Get all checked-in seats for a dinner
SELECT 
  s.id,
  s.status,
  u.email AS user_email,
  s."checkedInAt",
  EXTRACT(EPOCH FROM (s."checkedInAt" - d."startsAt")) / 60 AS minutes_before_start
FROM seats s
JOIN users u ON s."confirmedByUserId" = u.id
JOIN dinners d ON s."dinnerId" = d.id
WHERE s."dinnerId" = 'YOUR_DINNER_ID'
  AND s.status = 'ATTENDED'
ORDER BY s."checkedInAt" ASC;
```

## Analytics & Monitoring

### Key Metrics

1. **Check-in Rate**
   - `SEAT_CHECK_IN_SUCCESS` / `SEAT_CONFIRMED`
   - Should be >90% for healthy system

2. **Check-in Timing**
   - Track `minutesUntilStart` in success events
   - Shows when users typically check in

3. **Check-in Denial Rate**
   - `SEAT_CHECK_IN_DENIED` / (`SEAT_CHECK_IN_SUCCESS` + `SEAT_CHECK_IN_DENIED`)
   - High rate indicates policy issues

### Analytics Queries

```typescript
// Get check-in rate
const confirmed = await track.count(AnalyticsEvents.SEAT_CONFIRMED);
const checkedIn = await track.count(AnalyticsEvents.SEAT_CHECK_IN_SUCCESS);
const checkInRate = (checkedIn / confirmed) * 100;

console.log(`Check-in rate: ${checkInRate.toFixed(2)}%`);

// Get average check-in timing
const checkIns = await track.query(AnalyticsEvents.SEAT_CHECK_IN_SUCCESS);
const avgMinutes = checkIns.reduce((sum, e) => sum + e.minutesUntilStart, 0) / checkIns.length;

console.log(`Average check-in: ${avgMinutes.toFixed(1)} minutes before start`);
```

## Environment Variables

### Required

Add to `.env`:

```bash
# QR Token Secret (for check-in tokens)
QR_TOKEN_SECRET=your-qr-token-secret-change-in-production
```

**Security:**
- Use a strong random secret in production
- Never commit to version control
- Rotate periodically

**Generate Secret:**
```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Future Enhancements

### Restaurant-Side Scanning UI
- Admin page to scan QR codes
- Real-time check-in list
- Manual check-in override

### Enhanced QR Codes
- Add restaurant logo
- Custom styling
- Error correction level

### Check-in Notifications
- Email confirmation
- SMS notification
- Push notification

### Check-in Analytics Dashboard
- Real-time check-in status
- No-show tracking
- Check-in patterns

## Files Changed

### New Files:
- `packages/shared/src/utils/qr-token.ts` - QR token system
- `apps/web/src/app/api/seats/check-in/route.ts` - Check-in endpoint
- `apps/web/src/app/dinner/[id]/check-in/page.tsx` - QR check-in page
- `test-seat-check-in.ts` - Test script
- `EPIC_3.6_COMPLETE.md` - This document

### Modified Files:
- `packages/config/src/seat-policy.ts` - Added check-in policy
- `packages/config/src/index.ts` - Export check-in functions
- `packages/shared/src/utils/index.ts` - Export qr-token
- `packages/db/src/repositories/seat.repository.ts` - Enhanced checkIn method
- `packages/analytics/src/events.ts` - Added check-in events
- `packages/db/src/utils/audit-logger.ts` - Added seatCheckedIn method
- `.env.example` - Added QR_TOKEN_SECRET
- `.env` - Added QR_TOKEN_SECRET

## Success Criteria ✅

- ✅ POST /api/seats/check-in endpoint implemented
- ✅ Time window policy (30 min before to 30 min after)
- ✅ Validates seat is CONFIRMED
- ✅ Validates user owns the confirmation
- ✅ Validates check-in within time window
- ✅ Sets status to ATTENDED
- ✅ Sets checkedInAt timestamp
- ✅ QR token generation and verification
- ✅ QR check-in page stub
- ✅ Analytics events emitted
- ✅ Audit logging implemented
- ✅ Test script created and passing
- ✅ Error handling for all failure paths
- ✅ Documentation complete

## Status: ✅ COMPLETE & TESTED

The check-in endpoint is complete and all tests have passed successfully.

### Test Results

```
✅ Test 1: Successful check-in (within window)
✅ Test 2: Denied check-in (too early)
✅ Test 3: Denied check-in (too late)
✅ Test 4: Wrong user prevention
✅ Test 5: Seat not confirmed detection
✅ Test 6: QR token generation and verification
```

All validation rules working correctly:
- ✅ Seat must be CONFIRMED
- ✅ User must own the confirmation
- ✅ Must be within time window (30 min before to 30 min after)
- ✅ Status transitions correctly
- ✅ QR tokens work correctly
- ✅ Token verification prevents forgery

## Quick Test

```powershell
# Run test script
npx tsx test-seat-check-in.ts

# Test via API (in browser console)
# 1. Authenticated check-in
const checkIn = await fetch("/api/seats/check-in", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ seatId: "YOUR_SEAT_ID" })
}).then(r => r.json());

console.log(checkIn);

# 2. QR token check-in
const token = "seat_id.dinner_id.timestamp.signature";
const qrCheckIn = await fetch("/api/seats/check-in", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token })
}).then(r => r.json());

console.log(qrCheckIn);
```

## Next Steps

- EPIC 3.7: Check-out endpoint
- EPIC 3.8: Restaurant-side scanning UI
- EPIC 3.9: Payment integration (Stripe)
- EPIC 3.10: Email/SMS notifications
