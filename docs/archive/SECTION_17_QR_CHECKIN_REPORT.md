# SECTION 17: QR Code & Check-in System - Comprehensive Review

**Date**: March 5, 2026  
**Reviewer**: Kiro AI  
**Status**: ✅ COMPLETE

---

## Executive Summary

The QR Code & Check-in System provides token-based authentication for seat check-ins at dinners. The implementation uses HMAC-based tokens with a 24-hour expiry window. The system supports both QR code scanning (unauthenticated) and manual check-in (authenticated).

**Overall Grade**: B+

**Key Strengths**:
- ✅ Secure HMAC-based token generation
- ✅ Token expiry validation (24 hours)
- ✅ Dual check-in methods (QR + authenticated)
- ✅ Clean UI with loading/success/error states
- ✅ Comprehensive test coverage
- ✅ Analytics tracking for check-ins
- ✅ Audit logging

**Critical Issues**:
- 🔴 Type error: TOKEN_SECRET can be undefined
- 🟠 No QR code generation/display UI
- 🟠 No email notification system for check-in links
- 🟠 Missing QR code library dependency

---

## 1. Token Generation & Validation

### 1.1 Token Format

**File**: `packages/shared/src/utils/qr-token.ts`

**Implementation**:
```typescript
// Format: {seatId}.{dinnerId}.{timestamp}.{signature}
const payload = `${seatId}.${dinnerId}.${timestamp}`;
const signature = createHmac("sha256", TOKEN_SECRET)
  .update(payload)
  .digest("hex");
return `${payload}.${signature}`;
```

**Analysis**:
- ✅ Simple, secure HMAC-SHA256 signature
- ✅ Includes seat ID, dinner ID, and timestamp
- ✅ Tamper-proof (signature verification)
- ✅ Time-limited (24-hour expiry)

**Security Considerations**:
- ✅ Uses HMAC for integrity
- ✅ Includes timestamp to prevent replay attacks
- ⚠️ Default secret is weak (should fail if not set)

### 1.2 Token Verification

**Implementation**:
```typescript
export function verifyCheckInToken(token: string): {
  valid: boolean;
  seatId?: string;
  dinnerId?: string;
  reason?: string;
}
```

**Validation Steps**:
1. ✅ Format validation (4 parts)
2. ✅ Signature verification
3. ✅ Expiry check (24 hours)
4. ✅ Returns detailed error reasons

**Edge Cases Handled**:
- ✅ Invalid format
- ✅ Invalid signature
- ✅ Expired token
- ✅ Malformed token

### 1.3 🔴 CRITICAL: Type Error

**Issue**: TOKEN_SECRET can be undefined

**Location**: Line 63 in `packages/shared/src/utils/qr-token.ts`

```typescript
const TOKEN_SECRET = process.env.QR_TOKEN_SECRET || "dinewithme-qr-secret-change-in-production";
// TypeScript error: string | undefined
```

**Problem**: 
- `process.env.QR_TOKEN_SECRET` is `string | undefined`
- The fallback makes it always a string, but TypeScript doesn't know this
- Should explicitly handle undefined case

**Fix Required**:
```typescript
const TOKEN_SECRET = process.env.QR_TOKEN_SECRET;
if (!TOKEN_SECRET) {
  throw new Error("QR_TOKEN_SECRET environment variable is required");
}
```

**Severity**: 🔴 CRITICAL (Type error, security risk with default secret)

---

## 2. Check-in API Endpoint

### 2.1 Dual Authentication Methods

**File**: `apps/web/src/app/api/seats/check-in/route.ts`

**Methods**:
1. **QR Token-based** (unauthenticated)
   - Token contains seat ID and dinner ID
   - No user authentication required
   - Validates token signature and expiry

2. **Authenticated** (logged-in user)
   - Requires Clerk authentication
   - User must own the seat
   - Validates seat ownership

**Analysis**:
- ✅ Flexible authentication
- ✅ Secure token validation
- ✅ Proper error handling
- ✅ Analytics tracking
- ✅ Audit logging

### 2.2 QR Check-in Flow

**Implementation**:
```typescript
async function handleQRCheckIn(token: string) {
  // 1. Verify token
  const tokenResult = verifyCheckInToken(token);
  
  // 2. Get seat
  const seat = await seatRepository.findById(seatId);
  
  // 3. Check seat is confirmed
  if (!seat.confirmedByUserId) {
    return error("Seat is not confirmed");
  }
  
  // 4. Check in
  const result = await seatRepository.checkIn(seatId, seat.confirmedByUserId);
  
  // 5. Track analytics
  await track(AnalyticsEvents.SEAT_CHECK_IN_SUCCESS, {...});
  
  // 6. Log audit
  await auditLogger.seatCheckedIn(...);
}
```

**Analysis**:
- ✅ Comprehensive validation
- ✅ Proper error responses
- ✅ Analytics tracking (success + denied)
- ✅ Audit logging with method tag
- ✅ Policy enforcement (via repository)

### 2.3 Authenticated Check-in Flow

**Implementation**:
```typescript
async function handleAuthenticatedCheckIn(body: any) {
  // 1. Authenticate user
  const { userId: clerkUserId } = await auth();
  
  // 2. Get database user
  const user = await userRepository.findByAuthProviderId(clerkUserId);
  
  // 3. Validate request body
  const validatedData = checkInSchema.parse(body);
  
  // 4. Check in
  const result = await seatRepository.checkIn(validatedData.seatId, user.id);
  
  // 5. Track analytics
  await track(AnalyticsEvents.SEAT_CHECK_IN_SUCCESS, {...});
  
  // 6. Log audit
  await auditLogger.seatCheckedIn(...);
}
```

**Analysis**:
- ✅ Proper authentication
- ✅ Schema validation
- ✅ Error handling
- ✅ Analytics tracking
- ✅ Audit logging

### 2.4 Error Handling

**Error Codes**:
- `INVALID_TOKEN` - Token verification failed
- `SEAT_NOT_FOUND` - Seat doesn't exist
- `SEAT_NOT_CONFIRMED` - Seat not in CONFIRMED status
- `BUSINESS_LOGIC_ERROR` - Policy denied check-in
- `UNAUTHORIZED` - User not authenticated
- `USER_NOT_FOUND` - User doesn't exist

**Analysis**:
- ✅ Comprehensive error codes
- ✅ User-friendly error messages
- ✅ Proper HTTP status codes
- ✅ Analytics tracking for denials

---

## 3. Check-in UI

### 3.1 Check-in Page

**File**: `apps/web/src/app/dinner/[id]/check-in/page.tsx`

**Features**:
- ✅ Automatic check-in on page load
- ✅ Loading state with spinner
- ✅ Success state with details
- ✅ Error state with retry
- ✅ Navigation to dinner details
- ✅ Home button

**UI States**:
1. **Loading**: Spinner animation
2. **Success**: Green checkmark, check-in details
3. **Error**: Red X, error message, retry button

**Analysis**:
- ✅ Clean, user-friendly UI
- ✅ Automatic check-in (no button click)
- ✅ Clear visual feedback
- ✅ Helpful navigation options
- ✅ Responsive design

### 3.2 Success Details Display

**Information Shown**:
- ✅ Status (ATTENDED)
- ✅ Check-in timestamp
- ✅ Minutes until dinner starts
- ✅ Navigation to dinner details

**Analysis**:
- ✅ Comprehensive information
- ✅ Time-relative display
- ✅ Clear next steps

### 3.3 Error Handling

**Error Display**:
- ✅ Clear error message
- ✅ Retry button
- ✅ Home navigation
- ✅ Help text

**Analysis**:
- ✅ User-friendly error handling
- ✅ Recovery options
- ✅ Support guidance

---

## 4. 🟠 Missing: QR Code Generation UI

### 4.1 Current State

**What Exists**:
- ✅ Token generation function
- ✅ URL generation function
- ✅ Check-in page
- ✅ API endpoint

**What's Missing**:
- ❌ QR code display component
- ❌ QR code generation library
- ❌ UI to show QR code to users
- ❌ QR code in confirmation email

### 4.2 Where QR Code Should Appear

**Locations**:
1. **Confirmation Success Page**
   - File: `apps/web/src/app/(core)/dinner/[id]/confirm/components/confirmation-success.tsx`
   - Current: Text mentions "QR code" but doesn't show one
   - Should: Display actual QR code

2. **My Dinners Page**
   - File: `apps/web/src/app/(core)/my-dinners/components/user-dinner-card.tsx`
   - Should: Show QR code for upcoming dinners

3. **Email Confirmation**
   - Should: Include QR code image
   - Should: Include check-in link

### 4.3 Implementation Gap

**Current Text**:
```tsx
<p>
  • Check in at the restaurant using your QR code
</p>
<p>
  • You'll receive a check-in link via email
</p>
```

**Problem**:
- ❌ No actual QR code displayed
- ❌ No email system implemented
- ❌ No QR code library installed

**Required**:
1. Install QR code library (e.g., `qrcode.react`)
2. Create QR code component
3. Display QR code on confirmation page
4. Implement email notification system

**Severity**: 🟠 HIGH (Core feature incomplete)

---

## 5. 🟠 Missing: Email Notification System

### 5.1 Current State

**What's Mentioned**:
- "You'll receive a check-in link via email"
- "Confirmation email sent to your inbox"
- "Calendar invite attached"
- "Reminder 24 hours before dinner"

**What's Implemented**:
- ❌ No email service package
- ❌ No email templates
- ❌ No email sending logic
- ❌ No email configuration

### 5.2 Required Email Types

**1. Booking Confirmation Email**
- Dinner details
- QR code image
- Check-in link
- Calendar invite (.ics file)
- Cancellation policy

**2. Reminder Email (24h before)**
- Dinner reminder
- QR code
- Check-in link
- Restaurant directions

**3. Check-in Confirmation Email**
- Check-in success
- Dinner details
- What to expect

### 5.3 Implementation Requirements

**Email Service Options**:
- Resend
- SendGrid
- AWS SES
- Postmark

**Required Components**:
1. Email service package
2. Email templates (React Email or MJML)
3. Email sending logic
4. Email queue (for reliability)
5. Email tracking (opens, clicks)

**Severity**: 🟠 HIGH (Promised feature not implemented)

---

## 6. Configuration & Environment

### 6.1 Environment Variables

**File**: `.env.example`

```bash
# QR Token Secret (for check-in tokens)
QR_TOKEN_SECRET=your-qr-token-secret-change-in-production
```

**Analysis**:
- ✅ Documented in .env.example
- ✅ Set in .env
- ⚠️ Should be required (not optional with fallback)

### 6.2 Token Configuration

**Constants**:
```typescript
const TOKEN_EXPIRY_HOURS = 24; // Tokens valid for 24 hours
```

**Analysis**:
- ✅ Reasonable expiry time
- ⚠️ Hardcoded (should be configurable)

**Recommendation**:
```typescript
const TOKEN_EXPIRY_HOURS = parseInt(
  process.env.QR_TOKEN_EXPIRY_HOURS || "24",
  10
);
```

---

## 7. Testing

### 7.1 Test Coverage

**File**: `tests/test-seat-check-in.ts`

**Tests**:
1. ✅ Successful check-in (within window)
2. ✅ Denied check-in (too early)
3. ✅ Denied check-in (too late)
4. ✅ Wrong user prevention
5. ✅ Seat not confirmed detection
6. ✅ QR token generation and verification

**Analysis**:
- ✅ Comprehensive test coverage
- ✅ Tests all edge cases
- ✅ Tests policy enforcement
- ✅ Tests token generation/verification

### 7.2 Token Tests

**Tests**:
- ✅ Token generation
- ✅ Token verification (valid)
- ✅ Token verification (invalid)
- ✅ URL generation

**Analysis**:
- ✅ Complete token testing
- ✅ Tests invalid tokens
- ✅ Tests token format

---

## 8. Security Analysis

### 8.1 Token Security

**Strengths**:
- ✅ HMAC-SHA256 signature
- ✅ Tamper-proof
- ✅ Time-limited (24 hours)
- ✅ Includes seat and dinner IDs

**Weaknesses**:
- 🔴 Default secret is weak
- ⚠️ No rate limiting on check-in endpoint
- ⚠️ No CSRF protection (not needed for token-based)

### 8.2 Authentication Security

**QR Token Method**:
- ✅ No user authentication required
- ✅ Token proves seat ownership
- ✅ Token expires after 24 hours
- ⚠️ Token can be shared (by design)

**Authenticated Method**:
- ✅ Requires Clerk authentication
- ✅ Validates seat ownership
- ✅ Proper error handling

### 8.3 Recommendations

1. **Require QR_TOKEN_SECRET**
   - Remove default fallback
   - Fail fast if not set

2. **Add Rate Limiting**
   - Limit check-in attempts per IP
   - Prevent brute force attacks

3. **Add Token Revocation**
   - Allow tokens to be invalidated
   - Useful if seat is cancelled

4. **Consider Shorter Expiry**
   - 24 hours is generous
   - Could be 2-4 hours before dinner

---

## 9. Integration Points

### 9.1 Seat Repository Integration

**Method**: `seatRepository.checkIn(seatId, userId)`

**Analysis**:
- ✅ Enforces check-in policy
- ✅ Updates seat status to ATTENDED
- ✅ Records check-in timestamp
- ✅ Returns policy result

### 9.2 Analytics Integration

**Events Tracked**:
- `SEAT_CHECK_IN_SUCCESS`
- `SEAT_CHECK_IN_DENIED`

**Data Captured**:
- User ID
- Dinner ID
- Seat ID
- Minutes until start
- Denial reason (if denied)
- Timestamp

**Analysis**:
- ✅ Comprehensive analytics
- ✅ Tracks both success and failure
- ✅ Includes context data

### 9.3 Audit Logging Integration

**Method**: `auditLogger.seatCheckedIn(userId, seatId, dinnerId, metadata)`

**Metadata**:
- `method: "qr_token"` or `method: "authenticated"`

**Analysis**:
- ✅ Proper audit trail
- ✅ Distinguishes check-in methods
- ✅ Compliance-ready

---

## 10. User Experience

### 10.1 QR Code Flow

**Expected Flow**:
1. User books seat
2. User receives email with QR code
3. User arrives at restaurant
4. User scans QR code
5. Browser opens check-in page
6. Automatic check-in
7. Success message displayed

**Current Implementation**:
- ✅ Steps 4-7 work
- ❌ Steps 1-3 incomplete (no QR code, no email)

### 10.2 Manual Check-in Flow

**Expected Flow**:
1. User logs in
2. User navigates to My Dinners
3. User clicks "Check In" button
4. Check-in API called
5. Success message displayed

**Current Implementation**:
- ⚠️ No "Check In" button in UI
- ✅ API endpoint works
- ⚠️ Flow not fully implemented

### 10.3 UX Issues

**Issues**:
1. 🟠 No QR code displayed to users
2. 🟠 No email with check-in link
3. 🟠 No manual check-in button in UI
4. 🟡 No check-in status indicator
5. 🟡 No "already checked in" message

---

## 11. Performance Considerations

### 11.1 Token Generation

**Performance**:
- ✅ Fast (HMAC is efficient)
- ✅ No database queries
- ✅ Stateless

### 11.2 Token Verification

**Performance**:
- ✅ Fast (HMAC verification)
- ✅ No database queries
- ✅ Stateless

### 11.3 Check-in API

**Database Queries**:
1. Find seat by ID
2. Find user by auth provider ID (authenticated only)
3. Update seat status
4. Insert analytics event
5. Insert audit log

**Analysis**:
- ✅ Minimal queries
- ✅ Proper indexing (assumed)
- ✅ No N+1 queries

---

## 12. Scalability

### 12.1 Token System

**Scalability**:
- ✅ Stateless (no database)
- ✅ Can be generated anywhere
- ✅ No central bottleneck

### 12.2 Check-in API

**Scalability**:
- ✅ Stateless API
- ✅ Horizontal scaling possible
- ⚠️ Database writes (seat update)
- ⚠️ No caching

**Recommendations**:
- Add Redis for rate limiting
- Cache seat status (short TTL)
- Use database read replicas

---

## 13. Documentation

### 13.1 Code Documentation

**Quality**:
- ✅ Excellent JSDoc comments
- ✅ Clear function descriptions
- ✅ Parameter documentation
- ✅ Return type documentation

**Example**:
```typescript
/**
 * Generate a check-in token for a seat
 * 
 * @param seatId - ID of the seat
 * @param dinnerId - ID of the dinner
 * @returns Token string
 */
```

### 13.2 API Documentation

**Documentation**:
- ✅ Endpoint description
- ✅ Request body format
- ✅ Response format
- ✅ Policy description

### 13.3 Test Documentation

**Documentation**:
- ✅ Test descriptions
- ✅ Test scenarios
- ✅ Expected outcomes

---

## 14. Issues Summary

### 14.1 Critical Issues

| Issue | Severity | Impact | File |
|-------|----------|--------|------|
| TOKEN_SECRET type error | 🔴 CRITICAL | Type error, security risk | `packages/shared/src/utils/qr-token.ts` |

### 14.2 High Priority Issues

| Issue | Severity | Impact | Location |
|-------|----------|--------|----------|
| No QR code display UI | 🟠 HIGH | Core feature incomplete | Multiple files |
| No email notification system | 🟠 HIGH | Promised feature missing | N/A |
| No QR code library | 🟠 HIGH | Cannot generate QR codes | `package.json` |

### 14.3 Medium Priority Issues

| Issue | Severity | Impact | Location |
|-------|----------|--------|----------|
| No manual check-in button | 🟡 MEDIUM | UX incomplete | My Dinners page |
| No rate limiting | 🟡 MEDIUM | Security concern | Check-in API |
| Hardcoded expiry time | 🟡 MEDIUM | Configuration inflexible | `qr-token.ts` |

### 14.4 Low Priority Issues

| Issue | Severity | Impact | Location |
|-------|----------|--------|----------|
| No check-in status indicator | 🟢 LOW | UX enhancement | My Dinners page |
| No "already checked in" message | 🟢 LOW | UX enhancement | Check-in page |

---

## 15. Recommendations

### 15.1 Immediate Actions (Critical)

1. **Fix TOKEN_SECRET Type Error**
   ```typescript
   const TOKEN_SECRET = process.env.QR_TOKEN_SECRET;
   if (!TOKEN_SECRET) {
     throw new Error("QR_TOKEN_SECRET environment variable is required");
   }
   ```

### 15.2 High Priority Actions

1. **Implement QR Code Display**
   - Install `qrcode.react` or similar
   - Create QR code component
   - Display on confirmation page
   - Display in My Dinners

2. **Implement Email System**
   - Choose email service (Resend recommended)
   - Create email templates
   - Send confirmation emails with QR code
   - Send reminder emails

3. **Add Manual Check-in Button**
   - Add button to My Dinners page
   - Call authenticated check-in API
   - Show success/error feedback

### 15.3 Medium Priority Actions

1. **Add Rate Limiting**
   - Use Redis or in-memory store
   - Limit check-in attempts per IP
   - Return 429 Too Many Requests

2. **Make Expiry Configurable**
   - Add QR_TOKEN_EXPIRY_HOURS env var
   - Update documentation

3. **Add Token Revocation**
   - Store token hashes in database
   - Check revocation on verification
   - Revoke on seat cancellation

### 15.4 Low Priority Actions

1. **Add Check-in Status Indicator**
   - Show "Checked In" badge
   - Show check-in timestamp
   - Disable check-in button if already checked in

2. **Improve Error Messages**
   - More specific error reasons
   - Helpful recovery suggestions
   - Support contact information

---

## 16. Testing Recommendations

### 16.1 Additional Tests Needed

1. **Token Security Tests**
   - Test token tampering
   - Test expired tokens
   - Test malformed tokens
   - Test signature verification

2. **API Tests**
   - Test concurrent check-ins
   - Test rate limiting
   - Test error responses
   - Test analytics tracking

3. **UI Tests**
   - Test QR code display
   - Test check-in flow
   - Test error handling
   - Test loading states

### 16.2 Integration Tests

1. **End-to-End Tests**
   - Book seat → Receive email → Scan QR → Check in
   - Book seat → Manual check-in
   - Check-in too early → Denied
   - Check-in too late → Denied

---

## 17. Compliance & Audit

### 17.1 Audit Trail

**What's Logged**:
- ✅ User ID
- ✅ Seat ID
- ✅ Dinner ID
- ✅ Check-in method (QR vs authenticated)
- ✅ Timestamp

**Analysis**:
- ✅ Comprehensive audit trail
- ✅ Distinguishes check-in methods
- ✅ Compliance-ready

### 17.2 Data Privacy

**PII Handling**:
- ✅ No PII in tokens
- ✅ Tokens contain only IDs
- ✅ Tokens expire after 24 hours

**Analysis**:
- ✅ Privacy-friendly design
- ✅ Minimal data exposure

---

## 18. Final Assessment

### 18.1 What Works Well

1. ✅ **Secure Token System**
   - HMAC-based signatures
   - Time-limited tokens
   - Tamper-proof

2. ✅ **Dual Authentication**
   - QR token-based
   - Authenticated check-in
   - Flexible for users

3. ✅ **Clean UI**
   - Automatic check-in
   - Clear feedback
   - User-friendly

4. ✅ **Comprehensive Testing**
   - All edge cases covered
   - Policy enforcement tested
   - Token validation tested

5. ✅ **Good Integration**
   - Analytics tracking
   - Audit logging
   - Policy enforcement

### 18.2 What Needs Work

1. 🔴 **Type Error**
   - TOKEN_SECRET can be undefined
   - Security risk with default secret

2. 🟠 **Missing QR Code UI**
   - No QR code display
   - No QR code library
   - Core feature incomplete

3. 🟠 **Missing Email System**
   - No email notifications
   - No QR code delivery
   - Promised feature missing

4. 🟡 **Incomplete UX**
   - No manual check-in button
   - No check-in status indicator
   - No rate limiting

### 18.3 Overall Grade: B+

**Breakdown**:
- Token System: A (Excellent, minus type error)
- API Implementation: A (Comprehensive, secure)
- UI Implementation: B (Works but incomplete)
- Testing: A+ (Excellent coverage)
- Documentation: A (Clear and thorough)
- Integration: A (Good analytics and audit)
- Missing Features: C (QR display and email missing)

**Justification**:
The core check-in system is well-implemented with secure token generation, comprehensive validation, and good error handling. However, the missing QR code display and email notification system are significant gaps that prevent users from actually using the feature. The type error is a critical issue that needs immediate attention.

---

## 19. Action Items

### Priority 1 (Critical - Do Now)
- [ ] Fix TOKEN_SECRET type error
- [ ] Remove default secret fallback
- [ ] Require QR_TOKEN_SECRET in production

### Priority 2 (High - This Sprint)
- [ ] Install QR code library (qrcode.react)
- [ ] Create QR code display component
- [ ] Add QR code to confirmation page
- [ ] Add QR code to My Dinners page
- [ ] Choose and configure email service
- [ ] Create email templates
- [ ] Implement confirmation email with QR code

### Priority 3 (Medium - Next Sprint)
- [ ] Add manual check-in button to My Dinners
- [ ] Implement rate limiting
- [ ] Make token expiry configurable
- [ ] Add check-in status indicator
- [ ] Implement reminder emails

### Priority 4 (Low - Backlog)
- [ ] Add token revocation
- [ ] Improve error messages
- [ ] Add "already checked in" handling
- [ ] Add check-in analytics dashboard

---

## 20. Conclusion

The QR Code & Check-in System has a solid foundation with secure token generation, comprehensive validation, and good error handling. The API implementation is excellent with proper authentication, analytics tracking, and audit logging.

However, the system is incomplete without QR code display and email notifications. Users cannot actually receive or use QR codes, which is a critical gap. The type error in TOKEN_SECRET is also a security concern that needs immediate attention.

Once the missing UI components and email system are implemented, this will be a robust and user-friendly check-in system.

**Recommendation**: Fix the type error immediately, then prioritize implementing QR code display and email notifications to complete the feature.

---

**Report Complete** ✅
