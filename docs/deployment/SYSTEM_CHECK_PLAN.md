# DineWithMe - Comprehensive System Check Plan

**Date**: March 3, 2026  
**Review Type**: Full System Audit - Backend, Frontend, Integration  
**Approach**: Section-by-section deep dive

---

## Review Sections

### SECTION 1: Authentication & Authorization System
**Scope**: User authentication, role-based access control, session management
- [ ] Clerk integration
- [ ] User sync flow
- [ ] Role assignment (DINER, RESTAURANT_ADMIN, PLATFORM_ADMIN)
- [ ] Protected routes
- [ ] Auth helpers and middleware
- [ ] Token validation
- [ ] Session persistence

**Files to Review**:
- `apps/web/src/lib/auth.ts`
- `apps/web/src/lib/auth-helpers.ts`
- `apps/web/src/app/api/lib/middleware.ts`
- `apps/web/src/app/api/auth/sync/route.ts`
- `apps/web/src/app/sync/page.tsx`
- `apps/web/src/app/dashboard/sync-user.tsx`
- All layout files with auth checks

---

### SECTION 2: Database Layer & Repositories
**Scope**: Database schema, repository patterns, data integrity
- [ ] Prisma schema validation
- [ ] Repository implementations
- [ ] Transaction handling
- [ ] Error handling
- [ ] Query optimization
- [ ] Index usage
- [ ] Cascade deletes
- [ ] Data validation

**Files to Review**:
- `prisma/schema.prisma`
- `packages/db/src/repositories/*.ts` (all repositories)
- `packages/db/src/index.ts`
- Database connection handling
- Migration files

---

### SECTION 3: Seat State Machine & Booking Flow
**Scope**: Seat lifecycle, state transitions, hold/confirm/cancel logic
- [ ] State machine implementation
- [ ] State transition rules
- [ ] Hold expiry logic
- [ ] Seat assignment algorithm
- [ ] Concurrent booking handling
- [ ] Race condition prevention
- [ ] Payment integration
- [ ] Webhook confirmation

**Files to Review**:
- `packages/db/src/services/seat-state-machine.ts`
- `packages/db/src/repositories/seat.repository.ts`
- `apps/web/src/app/api/seats/hold/route.ts`
- `apps/web/src/app/api/seats/confirm/route.ts`
- `apps/web/src/app/api/seats/cancel/route.ts`
- `apps/web/src/app/api/seats/check-in/route.ts`
- `packages/config/src/seat-policy.ts`

---

### SECTION 4: Payment System
**Scope**: Payment processing, Paystack integration, webhooks, refunds
- [ ] Payment intent creation
- [ ] Paystack API integration
- [ ] Webhook signature verification
- [ ] Idempotency handling
- [ ] Payment status tracking
- [ ] Refund processing
- [ ] Error handling
- [ ] Security measures

**Files to Review**:
- `packages/payment/src/paystack.ts`
- `apps/web/src/app/api/payments/create/route.ts`
- `apps/web/src/app/api/payments/webhook/route.ts`
- `apps/web/src/app/api/payments/refund/route.ts`
- `packages/db/src/repositories/payment-intent.repository.ts`
- `packages/config/src/payment.ts`

---

### SECTION 5: Trust & Safety System
**Scope**: Trust scores, feedback, safety flags, mutual interests
- [ ] Trust score calculation
- [ ] Trust event tracking
- [ ] Feedback submission
- [ ] Mutual interest detection
- [ ] Safety flag handling
- [ ] Trust profile updates
- [ ] Attendance tracking
- [ ] Flagging logic

**Files to Review**:
- `packages/db/src/repositories/trust-profile.repository.ts`
- `packages/db/src/repositories/trust-event.repository.ts`
- `packages/db/src/repositories/feedback.repository.ts`
- `packages/db/src/repositories/mutual-interest.repository.ts`
- `apps/web/src/app/api/feedback/submit/route.ts`
- `apps/web/src/app/api/feedback/eligibility/route.ts`
- `apps/web/src/app/api/trust/recalculate/route.ts`

---

### SECTION 6: Restaurant Management (Platform Admin)
**Scope**: Restaurant approvals, status management, ops admin features
- [ ] Restaurant creation
- [ ] Approval workflow
- [ ] Status transitions (PENDING → ACTIVE → PAUSED)
- [ ] Restaurant member management
- [ ] Media management
- [ ] Theme enablement
- [ ] Admin actions
- [ ] Audit logging

**Files to Review**:
- `packages/db/src/repositories/restaurant.repository.ts`
- `apps/web/src/app/admin/ops/restaurants/actions.ts`
- `apps/web/src/app/api/restaurants/route.ts`
- `apps/web/src/app/api/restaurants/[id]/route.ts`
- `apps/web/src/app/admin/ops/restaurants/components/*.tsx`
- `packages/db/src/repositories/media.repository.ts`

---

### SECTION 7: Restaurant Admin Features
**Scope**: Restaurant profile, dinner creation, theme management
- [ ] Restaurant profile CRUD
- [ ] Dinner creation and management
- [ ] Theme selection
- [ ] Media upload (hero, gallery)
- [ ] Dinner status management
- [ ] Seat count management
- [ ] Restaurant member roles

**Files to Review**:
- `apps/web/src/app/admin/restaurant/actions.ts`
- `apps/web/src/app/admin/restaurant/media-actions.ts`
- `apps/web/src/app/admin/restaurant/theme-actions.ts`
- `apps/web/src/app/admin/dinners/actions.ts`
- `apps/web/src/app/admin/dinners/create-actions.ts`
- `packages/db/src/repositories/dinner.repository.ts`
- `packages/db/src/repositories/theme.repository.ts`

---

### SECTION 8: Diner Discovery & Booking Flow
**Scope**: Dinner discovery, filtering, detail view, booking initiation
- [ ] Dinner listing API
- [ ] Filter logic (city, theme, date)
- [ ] Dinner detail API
- [ ] Seat availability calculation
- [ ] Booking button logic
- [ ] Hold initiation
- [ ] Error handling
- [ ] Loading states

**Files to Review**:
- `apps/web/src/app/api/dinners/route.ts`
- `apps/web/src/app/api/dinners/[id]/route.ts`
- `apps/web/src/app/api/dinners/[id]/seats/route.ts`
- `apps/web/src/app/(core)/discover/components/*.tsx`
- `apps/web/src/app/(core)/dinner/[id]/components/*.tsx`

---

### SECTION 9: My Dinners & User Management
**Scope**: User's dinner list, cancellations, connections
- [ ] User dinners API
- [ ] Upcoming/past filtering
- [ ] Cancellation logic
- [ ] Refund eligibility
- [ ] Connections API
- [ ] Mutual interest display
- [ ] Profile data

**Files to Review**:
- `apps/web/src/app/api/users/me/dinners/route.ts`
- `apps/web/src/app/api/users/me/connections/route.ts`
- `apps/web/src/app/(core)/my-dinners/components/*.tsx`
- `apps/web/src/app/(core)/profile/page.tsx`

---

### SECTION 10: Post-Dinner Feedback Flow
**Scope**: Feedback submission, mutual interest creation, trust updates
- [ ] Feedback eligibility check
- [ ] Multi-step flow logic
- [ ] Person signal submission
- [ ] Mutual interest creation
- [ ] Trust event generation
- [ ] Safety flag handling
- [ ] Feedback storage

**Files to Review**:
- `apps/web/src/app/(core)/dinner/[id]/post-dinner/components/*.tsx`
- `apps/web/src/app/api/feedback/submit/route.ts`
- `apps/web/src/app/api/feedback/eligibility/route.ts`

---

### SECTION 11: Media & Storage System
**Scope**: Image uploads, R2 storage, signed URLs
- [ ] R2 provider implementation
- [ ] Signed URL generation
- [ ] Upload flow
- [ ] Media deletion
- [ ] Storage key management
- [ ] Error handling
- [ ] File validation

**Files to Review**:
- `packages/storage/src/r2-provider.ts`
- `apps/web/src/app/api/uploads/sign/route.ts`
- `apps/web/src/app/admin/restaurant/components/image-upload.tsx`
- `apps/web/src/app/admin/restaurant/components/gallery-manager.tsx`

---

### SECTION 12: Analytics & Tracking
**Scope**: Event tracking, analytics repository, metrics
- [ ] Analytics event definitions
- [ ] Track function implementation
- [ ] Event storage
- [ ] Analytics queries
- [ ] Performance tracking
- [ ] Error tracking

**Files to Review**:
- `packages/analytics/src/track.ts`
- `packages/db/src/repositories/analytics.repository.ts`
- `apps/web/src/app/api/analytics/themes/route.ts`

---

### SECTION 13: Cron Jobs & Background Tasks
**Scope**: Scheduled tasks, seat expiry, no-show marking
- [ ] Expire holds job
- [ ] Mark no-shows job
- [ ] Job scheduling
- [ ] Error handling
- [ ] Idempotency
- [ ] Performance

**Files to Review**:
- `apps/web/src/app/api/cron/expire-holds/route.ts`
- `apps/web/src/app/api/cron/mark-no-shows/route.ts`
- `docs/jobs.md`

---

### SECTION 14: Navigation & Routing
**Scope**: All navigation components, links, redirects
- [ ] Bottom navigation (diner)
- [ ] Admin sidebar
- [ ] Ops sidebar
- [ ] Link destinations
- [ ] Redirect logic
- [ ] Protected routes
- [ ] 404 handling

**Files to Review**:
- `apps/web/src/app/(core)/components/bottom-nav.tsx`
- `apps/web/src/app/admin/components/admin-sidebar.tsx`
- `apps/web/src/app/admin/components/admin-header.tsx`
- All layout files
- All page files with navigation

---

### SECTION 15: Error Handling & Validation
**Scope**: Error handling patterns, validation, user feedback
- [ ] API error handler
- [ ] Validation schemas
- [ ] Error responses
- [ ] User-facing error messages
- [ ] Logging
- [ ] Sentry integration (if any)

**Files to Review**:
- `apps/web/src/app/api/lib/error-handler.ts`
- `packages/shared/src/schemas/*.ts`
- All API routes error handling
- All form validation

---

### SECTION 16: Configuration & Environment
**Scope**: Environment variables, configuration management
- [ ] Environment variable validation
- [ ] Configuration files
- [ ] Secrets management
- [ ] Feature flags
- [ ] API keys

**Files to Review**:
- `packages/config/src/env.ts`
- `.env.example`
- `apps/web/.env.example`
- All config files

---

### SECTION 17: QR Code & Check-in System
**Scope**: QR token generation, validation, check-in flow
- [ ] Token generation
- [ ] Token validation
- [ ] Expiry handling
- [ ] Check-in API
- [ ] Security measures

**Files to Review**:
- `packages/shared/src/utils/qr-token.ts`
- `apps/web/src/app/dinner/[id]/check-in/page.tsx`
- `apps/web/src/app/api/seats/check-in/route.ts`

---

### SECTION 18: Audit Logging System
**Scope**: Audit trail, action logging, compliance
- [ ] Audit logger implementation
- [ ] Event capture
- [ ] Log storage
- [ ] Query capabilities
- [ ] Retention

**Files to Review**:
- `packages/db/src/utils/audit-logger.ts`
- Audit log usage across codebase

---

## Review Methodology

For each section, I will:

1. **Read all code** - Line by line analysis
2. **Trace execution paths** - Follow function calls
3. **Check error handling** - Verify all edge cases
4. **Validate security** - Check for vulnerabilities
5. **Test logic** - Verify business rules
6. **Check performance** - Identify bottlenecks
7. **Verify scalability** - Check for scaling issues
8. **Test integration** - Verify component interaction
9. **Check links/buttons** - Verify all navigation works
10. **Document issues** - Record all findings

## Issue Severity Levels

- 🔴 **CRITICAL**: Breaks core functionality, security vulnerability
- 🟠 **HIGH**: Major bug, data integrity issue, poor UX
- 🟡 **MEDIUM**: Minor bug, performance issue, code smell
- 🟢 **LOW**: Cosmetic issue, optimization opportunity
- ✅ **VERIFIED**: Working correctly, no issues found

---

## Progress Tracking

- [x] Section 1: Authentication & Authorization - COMPLETE (Grade: B+)
- [x] Section 2: Database Layer & Repositories - COMPLETE (Grade: A+)
- [x] Section 3: Seat State Machine & Booking Flow - COMPLETE (Grade: B - CRITICAL BUG FOUND)
- [x] Section 4: Payment System - COMPLETE (Grade: A- - Backend Excellent, Frontend Missing)
- [x] Section 5: Trust & Safety System - COMPLETE (Grade: A+ - Excellent)
- [x] Section 6: Restaurant Management (Platform Admin) - COMPLETE (Grade: B+ - UI Complete, API Stubs)
- [x] Section 7: Restaurant Admin Features - COMPLETE (Grade: A+ - Excellent)
- [x] Section 8: Diner Discovery & Booking Flow - COMPLETE (Grade: A- - Type Error & Non-functional Filter)
- [x] Section 9: My Dinners & User Management - COMPLETE (Grade: A - Minor Placeholders)
- [x] Section 10: Post-Dinner Feedback Flow - COMPLETE (Grade: A - Theme Type Error & Missing Attendees API)
- [x] Section 11: Media & Storage System - COMPLETE (Grade: A+ - Excellent, Minor Env Issues)
- [x] Section 12: Analytics & Tracking - COMPLETE (Grade: A - Stub Provider, Type Errors)
- [x] Section 13: Cron Jobs & Background Tasks - COMPLETE (Grade: A - Missing mark-no-shows config)
- [x] Section 14: Navigation & Routing - COMPLETE (Grade: B+ - Duplicate Routes, Missing 404)
- [x] Section 15: Error Handling & Validation - COMPLETE (Grade: B+ - No Client Validation, Inconsistent Patterns)
- [x] Section 16: Configuration & Environment - COMPLETE (Grade: B - CRITICAL: Exposed Credentials, Incomplete Validation)
- [ ] Section 17: QR Code & Check-in System
- [ ] Section 18: Audit Logging System

---

**Status**: Ready to begin  
**Estimated Time**: 6-8 hours total (20-30 minutes per section)  
**Approach**: Wait for user approval before starting each section
