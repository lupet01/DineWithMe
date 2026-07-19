# MVP Critical Fixes - Implementation Spec

**Date**: March 5, 2026  
**Type**: Bug Fixes & MVP Completion  
**Priority**: CRITICAL - Blocks Production Launch  
**Estimated Time**: 5-7 days

---

## Executive Summary

This spec consolidates all critical issues identified across 18 comprehensive section reports into a prioritized, efficient implementation plan focused solely on MVP-critical features needed to ship to production and start selling to restaurants and diners.

**Key Insight**: The backend is 95% complete and excellent. Most issues are:
- 1 CRITICAL breaking bug (booking flow)
- Missing frontend UI for existing backend features
- Type errors and configuration issues
- Non-MVP features that can wait

**Goal**: Fix only what's needed to launch, defer everything else.

---

## Critical Issues Summary

### 🔴 BLOCKING PRODUCTION (Must Fix)
1. **Booking flow completely broken** - Calls deprecated endpoint
2. **Payment UI missing** - Backend ready, no frontend
3. **Type errors** - 8 TypeScript errors blocking build
4. **Environment secrets exposed** - Security risk

### 🟠 HIGH IMPACT (Affects Core UX)
5. **Dinner filters don't work** - City filter broken
6. **Theme type errors** - Breaks post-dinner flow
7. **QR token type error** - Check-in security issue

### 🟡 MEDIUM IMPACT (Can Ship Without)
- Admin navigation issues
- Missing analytics pages
- Audit log UI
- Connections page

**Decision**: Fix only 🔴 and 🟠 issues for MVP. Defer 🟡 issues post-launch.

---

## PHASE 1: CRITICAL BLOCKING ISSUES (Days 1-3)

### Issue #1: Fix Broken Booking Flow
**Severity**: 🔴 CRITICAL - BLOCKS ALL REVENUE  
**Source**: Section 3, Second Review, Wireframes Analysis  
**Time**: 2 days

**Problem**: Confirmation page calls `/api/seats/confirm` which returns 410 Gone.

**Root Cause**: EPIC 7 deprecated direct confirmation. Seats now confirmed via payment webhook.

**Solution**:


**Step 1.1**: Create Payment Page (4 hours)
- File: `apps/web/src/app/(core)/dinner/[id]/payment/page.tsx`
- Features:
  - 10-minute countdown timer
  - Dinner details display
  - Payment breakdown (R75 + R2.50 = R77.50)
  - "Proceed to Payment" button → calls `/api/payments/create`
  - "Cancel Reservation" button → releases seat
- Backend: Already exists and works

**Step 1.2**: Create Payment Callback Page (2 hours)
- File: `apps/web/src/app/(core)/dinner/[id]/payment/callback/page.tsx`
- Features:
  - Verify payment status from URL params
  - Show loading state
  - Redirect to confirmation on success
  - Show error and retry option on failure

**Step 1.3**: Update Booking Redirect (30 minutes)
- File: `apps/web/src/app/(core)/dinner/[id]/components/dinner-cta.tsx`
- Change: Line 32
```typescript
// FROM:
router.push(`/dinner/${dinnerId}/confirm?seatId=${seatId}`);

// TO:
router.push(`/dinner/${dinnerId}/payment?seatId=${seatId}`);
```

**Step 1.4**: Fix Confirmation Page (1 hour)
- File: `apps/web/src/app/(core)/dinner/[id]/confirm/components/confirmation-content.tsx`
- Remove: Lines 36-50 (deprecated API call)
- Keep: Only success state display
- Fetch: Dinner details for display only

**Step 1.5**: Test End-to-End (2 hours)
- Test with Paystack sandbox
- Complete 5+ bookings
- Test payment failure
- Test seat hold expiry
- Verify webhook processing
- Check database updates

**Acceptance Criteria**:
- ✅ User can complete booking: Hold → Payment → Paystack → Webhook → Confirmation
- ✅ Payment failures handled gracefully
- ✅ Seat hold expires after 10 minutes
- ✅ No double-charging possible
- ✅ Database seat status correct

---

### Issue #2: Fix All Type Errors
**Severity**: 🔴 CRITICAL - BLOCKS BUILD  
**Source**: Sections 8, 10, 12, 17  
**Time**: 3 hours

**Problem**: 8 TypeScript errors prevent production build.

**Errors to Fix**:

**2.1**: QR Token Secret Type Error (30 min)
- File: `packages/shared/src/utils/qr-token.ts`
- Line: 13
- Error: `TOKEN_SECRET` can be undefined
```typescript
// FROM:
const TOKEN_SECRET = process.env.QR_TOKEN_SECRET || "dinewithme-qr-secret-change-in-production";

// TO:
const TOKEN_SECRET = process.env.QR_TOKEN_SECRET;
if (!TOKEN_SECRET) {
  throw new Error("QR_TOKEN_SECRET environment variable is required");
}
```

**2.2**: Dinner Filters Type Error (30 min)
- File: `apps/web/src/app/(core)/discover/components/dinner-filters.tsx`
- Line: 45
- Error: `city` type mismatch
```typescript
// FROM:
const filteredDinners = dinners.filter((dinner) => {
  if (filters.city && dinner.restaurant.city !== filters.city) {

// TO:
const filteredDinners = dinners.filter((dinner) => {
  if (filters.city && filters.city !== "all" && dinner.restaurant.city !== filters.city) {
```

**2.3**: Theme Type Error in Post-Dinner (30 min)
- File: `apps/web/src/app/(core)/dinner/[id]/post-dinner/components/person-signals-step.tsx`
- Line: 15
- Error: `theme` expects object, gets string
```typescript
// FROM:
<p className="text-sm text-gray-600">{dinner.theme}</p>

// TO:
<p className="text-sm text-gray-600">{typeof dinner.theme === 'string' ? dinner.theme : dinner.theme.title}</p>
```

**2.4**: Analytics Track Type Errors (1 hour)
- File: `packages/analytics/src/track.ts`
- Lines: Multiple
- Error: Event properties type mismatches
- Fix: Add proper type definitions for each event

**2.5**: Dinner Detail Type Error (30 min)
- File: `apps/web/src/app/(core)/dinner/[id]/components/dinner-detail-content.tsx`
- Error: Theme type inconsistency
- Fix: Handle both string and object theme types

**Acceptance Criteria**:
- ✅ `npm run build` succeeds with no errors
- ✅ All type errors resolved
- ✅ No runtime errors from type fixes

---

### Issue #3: Fix Environment Security
**Severity**: 🔴 CRITICAL - SECURITY RISK  
**Source**: Section 16  
**Time**: 1 hour

**Problem**: Production secrets exposed in `.env` file committed to git.

**Step 3.1**: Remove Secrets from Git (15 min)
```bash
# Add to .gitignore if not already there
echo ".env" >> .gitignore
echo "apps/web/.env.local" >> .gitignore

# Remove from git history
git rm --cached .env
git rm --cached apps/web/.env.local
git commit -m "Remove environment files from git"
```

**Step 3.2**: Update .env.example (15 min)
- Ensure all secrets are placeholder values
- Add comments for required vs optional vars
- Document where to get each secret

**Step 3.3**: Rotate Exposed Secrets (30 min)
- Generate new `QR_TOKEN_SECRET`
- Rotate `PAYSTACK_SECRET_KEY` if exposed
- Update `DATABASE_URL` password if exposed
- Rotate `CLERK_SECRET_KEY` if exposed

**Acceptance Criteria**:
- ✅ No real secrets in git repository
- ✅ `.env` files in `.gitignore`
- ✅ All exposed secrets rotated
- ✅ `.env.example` has only placeholders

---

## PHASE 2: HIGH IMPACT UX ISSUES (Days 4-5)

### Issue #4: Fix Dinner Filters
**Severity**: 🟠 HIGH - CORE FEATURE BROKEN  
**Source**: Section 8  
**Time**: 2 hours

**Problem**: City filter doesn't work, always shows all dinners.

**Step 4.1**: Fix Filter Logic (1 hour)
- File: `apps/web/src/app/(core)/discover/components/dinner-filters.tsx`
- Current: Filter logic runs client-side but doesn't update display
- Fix: Properly filter and update state

**Step 4.2**: Add Loading State (30 min)
- Show loading spinner while filtering
- Prevent multiple filter requests

**Step 4.3**: Test All Filters (30 min)
- Test city filter
- Test theme filter  
- Test date filter
- Test combinations

**Acceptance Criteria**:
- ✅ City filter works correctly
- ✅ Theme filter works correctly
- ✅ Date filter works correctly
- ✅ Filters can be combined
- ✅ "All" option shows all dinners

---

### Issue #5: Fix Theme Type Consistency
**Severity**: 🟠 HIGH - BREAKS POST-DINNER FLOW  
**Source**: Sections 10, 8  
**Time**: 2 hours

**Problem**: Theme is sometimes string, sometimes object, causing crashes.

**Step 5.1**: Standardize API Responses (1 hour)
- File: `apps/web/src/app/api/dinners/route.ts`
- File: `apps/web/src/app/api/dinners/[id]/route.ts`
- Ensure theme is always populated as object with `title` field

**Step 5.2**: Update Frontend Components (1 hour)
- Add type guards for theme display
- Handle both formats gracefully
- Update all components that display theme

**Acceptance Criteria**:
- ✅ Theme always has consistent type
- ✅ No crashes when displaying theme
- ✅ Post-dinner flow works correctly

---

### Issue #6: Add Missing Attendees API
**Severity**: 🟠 HIGH - BLOCKS POST-DINNER FEEDBACK  
**Source**: Section 10  
**Time**: 2 hours

**Problem**: Person signals step needs list of attendees, API doesn't exist.

**Step 6.1**: Create Attendees API (1.5 hours)
- File: `apps/web/src/app/api/dinners/[id]/attendees/route.ts`
- Query: Get all ATTENDED seats for dinner
- Return: User info (id, name, avatar) for each attendee
- Exclude: Current user from list

**Step 6.2**: Update Person Signals Component (30 min)
- File: `apps/web/src/app/(core)/dinner/[id]/post-dinner/components/person-signals-step.tsx`
- Fetch: Attendees from new API
- Display: Attendee cards with selection

**Acceptance Criteria**:
- ✅ API returns all attendees
- ✅ Current user excluded from list
- ✅ Person signals step displays attendees
- ✅ Selection works correctly

---

## PHASE 3: CONFIGURATION & POLISH (Days 6-7)

### Issue #7: Fix Environment Validation
**Severity**: 🟡 MEDIUM - PREVENTS ERRORS  
**Source**: Section 16  
**Time**: 2 hours

**Problem**: Missing environment variables cause runtime errors instead of startup errors.

**Step 7.1**: Add Validation to env.ts (1 hour)
- File: `packages/config/src/env.ts`
- Add: Zod schema for all required vars
- Validate: On app startup
- Fail fast: If any required var missing

**Step 7.2**: Document All Variables (1 hour)
- Update: `.env.example` with descriptions
- Add: Comments for each variable
- Document: Where to get each secret
- List: Required vs optional

**Acceptance Criteria**:
- ✅ App fails fast if env vars missing
- ✅ Clear error messages
- ✅ All variables documented

---

### Issue #8: Fix Audit Logger Naming
**Severity**: 🟡 LOW - CODE QUALITY  
**Source**: Section 18  
**Time**: 1 hour

**Problem**: Inconsistent method naming (some have `log` prefix, some don't).

**Step 8.1**: Standardize Naming (30 min)
- File: `packages/db/src/utils/audit-logger.ts`
- Remove: `log` prefix from all methods
- Update: All call sites

**Step 8.2**: Fix Check-in Action Type (30 min)
- Change: `seatCheckedIn` to use `SEAT_ATTENDED` instead of `SEAT_CONFIRMED`
- Remove: Workaround metadata

**Acceptance Criteria**:
- ✅ Consistent naming across all methods
- ✅ Check-in uses correct action type
- ✅ All call sites updated

---

## DEFERRED TO POST-MVP

These issues are NOT critical for launch. Ship without them, add later:

### Admin Features (Not MVP)
- ❌ Ops Admin sidebar
- ❌ Restaurant Admin sidebar fixes
- ❌ Analytics pages
- ❌ Audit logs UI
- ❌ Users management
- ❌ Settings pages

**Reason**: Admins can use database directly for MVP. Add UI post-launch.

### Diner Features (Not MVP)
- ❌ Connections page
- ❌ Trust score display
- ❌ Search bar
- ❌ QR code display

**Reason**: Core booking flow works without these. Add after validating market fit.

### Nice-to-Haves (Not MVP)
- ❌ Email notifications
- ❌ QR code generation UI
- ❌ Seat selection visual
- ❌ 404 page
- ❌ Client-side validation

**Reason**: Backend works, these are UX enhancements. Add based on user feedback.

---

## Implementation Order

### Day 1: Critical Blocking
- Morning: Fix booking flow (Steps 1.1-1.3)
- Afternoon: Test booking flow (Step 1.5)

### Day 2: Critical Blocking
- Morning: Fix type errors (Issue #2)
- Afternoon: Fix environment security (Issue #3)

### Day 3: Build & Deploy Test
- Morning: Run full build, fix any remaining errors
- Afternoon: Deploy to staging, test end-to-end

### Day 4: High Impact UX
- Morning: Fix dinner filters (Issue #4)
- Afternoon: Fix theme types (Issue #5)

### Day 5: High Impact UX
- Morning: Add attendees API (Issue #6)
- Afternoon: Test post-dinner flow

### Day 6: Configuration
- Morning: Environment validation (Issue #7)
- Afternoon: Code quality fixes (Issue #8)

### Day 7: Final Testing
- Morning: Full regression testing
- Afternoon: Production deployment

---

## Testing Strategy

### Critical Path Testing (Every Day)
- ✅ Booking flow: Hold → Payment → Confirmation
- ✅ Payment webhook processing
- ✅ Seat state transitions
- ✅ No TypeScript errors
- ✅ No console errors

### Pre-Production Checklist
- [ ] All 🔴 issues fixed
- [ ] All 🟠 issues fixed
- [ ] Build succeeds
- [ ] No type errors
- [ ] No exposed secrets
- [ ] Booking flow works end-to-end
- [ ] Payment integration tested
- [ ] Filters work correctly
- [ ] Post-dinner feedback works
- [ ] Mobile responsive
- [ ] Paystack sandbox tested

### Production Deployment
- [ ] Environment variables set
- [ ] Paystack webhook URL configured
- [ ] Database migrations run
- [ ] Secrets rotated
- [ ] Monitoring enabled
- [ ] Error tracking enabled

---

## Success Criteria

### MVP is Ready When:
1. ✅ Users can discover dinners
2. ✅ Users can book and pay for seats
3. ✅ Restaurants can create dinners
4. ✅ Platform admin can approve restaurants
5. ✅ Post-dinner feedback works
6. ✅ No critical bugs
7. ✅ No security issues
8. ✅ Build succeeds
9. ✅ Payment integration works
10. ✅ Mobile responsive

### Can Ship Without:
- Admin UI polish
- Analytics dashboards
- Connections page
- Email notifications
- QR code display
- Trust score display
- Search functionality
- Audit log UI

---

## Risk Assessment

### Low Risk (Safe to Ship)
- ✅ Backend is solid and tested
- ✅ Payment system has safeguards
- ✅ Database schema is complete
- ✅ Core flows work

### Medium Risk (Test Thoroughly)
- ⚠️ Payment redirect flow
- ⚠️ Webhook processing
- ⚠️ Type error fixes

### Mitigation
- Test in Paystack sandbox
- Deploy to staging first
- Monitor error logs
- Have rollback plan

---

## Rollback Plan

If critical issues found in production:

### Immediate Actions
1. Revert to previous deployment
2. Disable new user signups
3. Notify active users

### Investigation
1. Check error logs
2. Review payment transactions
3. Verify database state

### Fix Forward
1. Fix issue in development
2. Test thoroughly
3. Deploy fix

---

## Post-MVP Roadmap

### Week 1 Post-Launch
- Monitor error logs
- Track booking conversion
- Gather user feedback
- Fix critical bugs

### Week 2-4 Post-Launch
- Add email notifications
- Implement connections page
- Add QR code display
- Polish admin UI

### Month 2
- Add analytics dashboards
- Implement search
- Add trust score display
- Build audit log UI

---

## Conclusion

This spec focuses ruthlessly on MVP-critical issues:
- **7 days** to fix all blocking issues
- **3 critical** bugs fixed
- **3 high-impact** UX issues fixed
- **Ready to ship** and start selling

Everything else deferred to post-launch based on actual user feedback.

**Next Step**: Begin Phase 1, Issue #1 - Fix booking flow.

