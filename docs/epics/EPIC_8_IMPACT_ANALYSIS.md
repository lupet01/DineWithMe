# Epic 8: Impact Analysis & Material Changes

## Executive Summary

This epic introduces **self-service restaurant onboarding** without breaking existing functionality. Changes are **additive** - we're adding new features alongside the current system.

### Key Principle: Backward Compatibility
- Existing users keep their access
- Existing restaurants remain approved
- Current workflows continue to work
- New features are opt-in

---

## Database Changes

### 1. Restaurant Model - Add Application Tracking

**Current State:**
```prisma
model Restaurant {
  id          String   @id @default(cuid())
  name        String
  description String?
  // ... other fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**New State:**
```prisma
model Restaurant {
  id          String   @id @default(cuid())
  name        String
  description String?
  // ... existing fields
  
  // NEW: Application tracking
  applicationStatus      RestaurantApplicationStatus @default(APPROVED)  // ← Default APPROVED for backward compatibility
  applicationSubmittedAt DateTime?
  applicationReviewedAt  DateTime?
  applicationReviewedBy  String?
  applicationNotes       String?
  rejectionReason        String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // NEW: Relation
  reviewedBy  User?    @relation("RestaurantReviewer", fields: [applicationReviewedBy], references: [id])
}

// NEW: Enum
enum RestaurantApplicationStatus {
  DRAFT              // Application started but not submitted
  PENDING_APPROVAL   // Submitted, waiting for review
  APPROVED           // Approved by platform admin
  REJECTED           // Rejected by platform admin
  SUSPENDED          // Temporarily suspended
}
```

**Impact:**
- ✅ **Existing restaurants:** Default to `APPROVED` status - no disruption
- ✅ **Existing queries:** Continue to work (new fields are optional)
- ✅ **New restaurants:** Start as `PENDING_APPROVAL`

**Migration Strategy:**
```sql
-- Set all existing restaurants to APPROVED
UPDATE "Restaurant" 
SET 
  "applicationStatus" = 'APPROVED',
  "applicationReviewedAt" = "createdAt",
  "applicationSubmittedAt" = "createdAt"
WHERE "applicationStatus" IS NULL;
```

### 2. User Model - No Changes Needed!

**Current State:** Already supports roles
```prisma
model User {
  role  Role  @default(DINER)
}

enum Role {
  DINER
  RESTAURANT_ADMIN
  PLATFORM_ADMIN
}
```

**Impact:**
- ✅ **No schema changes needed**
- ✅ **Existing users unaffected**
- ✅ **New users can be created with any role**

---

## Code Changes

### 1. Auth Sync Endpoint - Modified

**File:** `apps/web/src/app/api/auth/sync/route.ts`

**Current Behavior:**
- Creates user with default role (DINER)
- No role parameter accepted

**New Behavior:**
- Accepts optional `role` parameter
- Validates role is allowed (DINER or RESTAURANT_ADMIN only)
- Creates user with specified role
- Falls back to DINER if no role specified

**Change Type:** ✅ **Backward Compatible**
- Existing calls without role parameter → Still work (default to DINER)
- New calls with role parameter → Use specified role

**Code Diff:**
```typescript
// BEFORE
const user = await userRepository.upsertByAuthProviderId(userId, {
  authProviderId: userId,
  email: clerkUser.emailAddresses[0]?.emailAddress || "",
  // ... other fields
  // role is set by database default (DINER)
});

// AFTER
const requestedRole = request.nextUrl.searchParams.get('role');
const role = validateRole(requestedRole) || 'DINER'; // ← Fallback to DINER

const user = await userRepository.upsertByAuthProviderId(userId, {
  authProviderId: userId,
  email: clerkUser.emailAddresses[0]?.emailAddress || "",
  role: role, // ← Use specified role
  // ... other fields
});
```

**Impact on App:**
- ✅ **Existing signup flow:** Unchanged (no role parameter = DINER)
- ✅ **New signup flows:** Can specify role
- ✅ **No breaking changes**

### 2. Signup Routes - New Files

**New Files Created:**
- `apps/web/src/app/(auth)/sign-up/diner/[[...sign-up]]/page.tsx`
- `apps/web/src/app/(auth)/sign-up/restaurant/[[...sign-up]]/page.tsx`

**Existing Files:**
- `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` - **Unchanged**

**Impact on App:**
- ✅ **Existing `/sign-up` route:** Still works (defaults to diner)
- ✅ **New routes:** Add functionality without breaking existing
- ✅ **No migration needed**

### 3. Restaurant Application - New Feature

**New Files:**
- `apps/web/src/app/admin/restaurant/apply/page.tsx`
- `apps/web/src/app/admin/restaurant/apply/components/application-form.tsx`
- `apps/web/src/app/admin/restaurant/apply/actions.ts`
- `apps/web/src/app/api/restaurants/apply/route.ts`

**Modified Files:**
- `apps/web/src/app/admin/restaurant/page.tsx` - Add status check

**Current Behavior:**
- Shows onboarding form if no restaurant
- Shows edit form if restaurant exists

**New Behavior:**
- Shows application form if no restaurant (new users)
- Shows "pending" status if application submitted
- Shows edit form if restaurant approved (existing users)

**Code Logic:**
```typescript
// apps/web/src/app/admin/restaurant/page.tsx

if (!restaurant) {
  // NEW USERS: Show application form
  return <ApplicationForm />;
}

if (restaurant.applicationStatus === 'PENDING_APPROVAL') {
  // NEW: Show pending status
  return <PendingApplicationView restaurant={restaurant} />;
}

if (restaurant.applicationStatus === 'REJECTED') {
  // NEW: Show rejection with reapply option
  return <RejectedApplicationView restaurant={restaurant} />;
}

// EXISTING USERS: Show normal edit form (status = APPROVED)
return <RestaurantForm restaurant={restaurant} mode="edit" />;
```

**Impact on App:**
- ✅ **Existing restaurant owners:** See normal edit form (status = APPROVED)
- ✅ **New restaurant owners:** See application form
- ✅ **No disruption to existing users**

### 4. Platform Ops - Enhanced

**Modified Files:**
- `apps/web/src/app/admin/ops/restaurants/page.tsx` - Add filtering
- `apps/web/src/app/admin/ops/restaurants/components/restaurants-table.tsx` - Add status column
- `apps/web/src/app/admin/ops/restaurants/components/restaurant-row.tsx` - Add actions
- `apps/web/src/app/admin/ops/restaurants/actions.ts` - Add approve/reject

**New Files:**
- `apps/web/src/app/admin/ops/restaurants/components/approve-modal.tsx`
- `apps/web/src/app/admin/ops/restaurants/components/reject-modal.tsx`
- `apps/web/src/app/api/admin/restaurants/[id]/approve/route.ts`
- `apps/web/src/app/api/admin/restaurants/[id]/reject/route.ts`

**Current Behavior:**
- Shows all restaurants
- No status filtering
- No approval actions

**New Behavior:**
- Shows all restaurants with status
- Filter by status (pending, approved, rejected)
- Approve/reject actions for pending applications

**Impact on App:**
- ✅ **Existing restaurants:** Show as "Approved" (no action needed)
- ✅ **New applications:** Show as "Pending" with actions
- ✅ **Platform admins:** Get new approval workflow
- ✅ **No breaking changes**

### 5. Middleware - Minor Update

**File:** `apps/web/src/middleware.ts`

**Change:**
```typescript
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",  // ← Already covers /sign-up/diner and /sign-up/restaurant
  "/api/auth/sync",
]);
```

**Impact on App:**
- ✅ **No changes needed** - existing pattern already covers new routes
- ✅ **No breaking changes**

---

## Repository Changes

### User Repository - New Methods

**File:** `packages/db/src/repositories/user.repository.ts`

**New Methods:**
```typescript
// Create user with specific role
async createWithRole(data: Prisma.UserCreateInput, role: Role): Promise<User> {
  return this.prisma.user.create({
    data: { ...data, role },
  });
}

// Update user role
async updateRole(id: string, role: Role): Promise<User> {
  return this.prisma.user.update({
    where: { id },
    data: { role },
  });
}
```

**Impact:**
- ✅ **Existing methods:** Unchanged
- ✅ **New methods:** Add functionality
- ✅ **No breaking changes**

### Restaurant Repository - New Methods

**File:** `packages/db/src/repositories/restaurant.repository.ts`

**New Methods:**
```typescript
// Find pending applications
async findPendingApplications(): Promise<Restaurant[]> {
  return this.prisma.restaurant.findMany({
    where: { applicationStatus: 'PENDING_APPROVAL' },
    include: { members: true },
    orderBy: { applicationSubmittedAt: 'asc' },
  });
}

// Approve application
async approveApplication(id: string, reviewerId: string, notes?: string): Promise<Restaurant> {
  return this.prisma.restaurant.update({
    where: { id },
    data: {
      applicationStatus: 'APPROVED',
      applicationReviewedAt: new Date(),
      applicationReviewedBy: reviewerId,
      applicationNotes: notes,
    },
  });
}

// Reject application
async rejectApplication(id: string, reviewerId: string, reason: string, notes?: string): Promise<Restaurant> {
  return this.prisma.restaurant.update({
    where: { id },
    data: {
      applicationStatus: 'REJECTED',
      applicationReviewedAt: new Date(),
      applicationReviewedBy: reviewerId,
      rejectionReason: reason,
      applicationNotes: notes,
    },
  });
}
```

**Impact:**
- ✅ **Existing methods:** Unchanged
- ✅ **New methods:** Add functionality
- ✅ **No breaking changes**

---

## Impact on Existing Features

### ✅ Discover Page (Diners)
**Impact:** None
- Diners continue to browse and book dinners
- No changes to diner experience

### ✅ My Dinners Page
**Impact:** None
- Users continue to see their bookings
- No changes to booking management

### ✅ Admin Dashboard
**Impact:** None for existing admins
- Existing restaurant admins see normal dashboard
- New restaurant admins see limited dashboard until approved

### ✅ Restaurant Profile Management
**Impact:** Enhanced for new users
- Existing admins: Normal edit form (status = APPROVED)
- New admins: Application form → Pending status → Edit form after approval

### ✅ Dinner Management
**Impact:** None for existing admins
- Existing admins: Can create dinners (status = APPROVED)
- New admins: Cannot create dinners until approved (status = PENDING)

### ✅ Platform Ops
**Impact:** Enhanced functionality
- Existing restaurants: Show as "Approved"
- New applications: Show as "Pending" with approve/reject actions
- No disruption to existing data

---

## Data Migration Plan

### Step 1: Add New Columns (Safe)
```sql
-- Add new columns with defaults
ALTER TABLE "Restaurant" 
ADD COLUMN "applicationStatus" TEXT DEFAULT 'APPROVED',
ADD COLUMN "applicationSubmittedAt" TIMESTAMP,
ADD COLUMN "applicationReviewedAt" TIMESTAMP,
ADD COLUMN "applicationReviewedBy" TEXT,
ADD COLUMN "applicationNotes" TEXT,
ADD COLUMN "rejectionReason" TEXT;
```

### Step 2: Backfill Existing Data (Safe)
```sql
-- Set existing restaurants to APPROVED
UPDATE "Restaurant" 
SET 
  "applicationStatus" = 'APPROVED',
  "applicationSubmittedAt" = "createdAt",
  "applicationReviewedAt" = "createdAt"
WHERE "applicationStatus" = 'APPROVED';
```

### Step 3: Add Enum (Safe)
```sql
-- Create enum type
CREATE TYPE "RestaurantApplicationStatus" AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUSPENDED'
);

-- Convert column to enum
ALTER TABLE "Restaurant" 
ALTER COLUMN "applicationStatus" 
TYPE "RestaurantApplicationStatus" 
USING "applicationStatus"::"RestaurantApplicationStatus";
```

### Step 4: Add Constraints (Safe)
```sql
-- Add foreign key for reviewer
ALTER TABLE "Restaurant"
ADD CONSTRAINT "Restaurant_applicationReviewedBy_fkey"
FOREIGN KEY ("applicationReviewedBy")
REFERENCES "User"("id")
ON DELETE SET NULL;
```

**Rollback Plan:**
```sql
-- If needed, can drop new columns
ALTER TABLE "Restaurant"
DROP COLUMN "applicationStatus",
DROP COLUMN "applicationSubmittedAt",
DROP COLUMN "applicationReviewedAt",
DROP COLUMN "applicationReviewedBy",
DROP COLUMN "applicationNotes",
DROP COLUMN "rejectionReason";

DROP TYPE "RestaurantApplicationStatus";
```

---

## Testing Impact

### Existing Tests
**Impact:** ✅ Should continue to pass
- User creation tests: Still work (default role = DINER)
- Restaurant creation tests: Still work (default status = APPROVED)
- Admin access tests: Still work (existing admins have APPROVED status)

### New Tests Needed
1. Role-based signup tests
2. Application submission tests
3. Approval workflow tests
4. Rejection workflow tests
5. Status filtering tests

---

## Performance Impact

### Database Queries
**Impact:** ✅ Minimal
- New columns are optional (nullable)
- Indexes on `applicationStatus` for filtering
- No impact on existing queries

**Recommended Indexes:**
```sql
-- Speed up pending applications query
CREATE INDEX "Restaurant_applicationStatus_idx" 
ON "Restaurant"("applicationStatus");

-- Speed up application timeline queries
CREATE INDEX "Restaurant_applicationSubmittedAt_idx" 
ON "Restaurant"("applicationSubmittedAt");
```

### API Response Times
**Impact:** ✅ Negligible
- New endpoints are separate (no impact on existing)
- Modified endpoints have minimal additional logic
- Database queries remain efficient

---

## Security Impact

### Authentication
**Impact:** ✅ Enhanced
- Role validation during signup
- Prevents unauthorized role assignment
- PLATFORM_ADMIN still requires manual assignment

### Authorization
**Impact:** ✅ Enhanced
- Pending restaurants have limited access
- Approval actions require PLATFORM_ADMIN
- Audit trail for all approvals/rejections

### Data Protection
**Impact:** ✅ Maintained
- Restaurant owners can only see their own application
- Platform admins can see all applications
- No new security vulnerabilities

---

## Deployment Strategy

### Phase 1: Database Migration (Zero Downtime)
1. Run migration to add new columns
2. Backfill existing data
3. Verify all existing restaurants are APPROVED

### Phase 2: Code Deployment (Zero Downtime)
1. Deploy new code with backward compatibility
2. Existing routes continue to work
3. New routes become available

### Phase 3: Feature Enablement
1. Test new signup flows
2. Test application submission
3. Test approval workflow
4. Monitor for issues

### Phase 4: Documentation
1. Update user guides
2. Update admin guides
3. Update API documentation

---

## Rollback Strategy

### If Issues Arise

**Option 1: Disable New Features**
```typescript
// Feature flag in code
const ENABLE_SELF_SERVICE_ONBOARDING = false;

if (!ENABLE_SELF_SERVICE_ONBOARDING) {
  // Redirect to old flow
  redirect('/sign-up');
}
```

**Option 2: Revert Code**
- Keep database changes (they're backward compatible)
- Revert to previous code version
- New columns remain but unused

**Option 3: Full Rollback**
- Revert code
- Drop new database columns
- Restore previous state

---

## Summary

### Material Changes Required

**Database:**
- ✅ Add 6 new columns to Restaurant table (backward compatible)
- ✅ Add 1 new enum type
- ✅ Add 1 new foreign key relation

**Code:**
- ✅ Modify 1 API endpoint (backward compatible)
- ✅ Create 8 new pages/components
- ✅ Create 4 new API endpoints
- ✅ Add 6 new repository methods

**Total Effort:** ~20-25 hours across 6 sub-epics

### Impact on App

**Existing Users:** ✅ **Zero Impact**
- All existing functionality preserved
- No breaking changes
- No data loss
- No downtime required

**New Users:** ✅ **Enhanced Experience**
- Self-service signup
- Clear application process
- Transparent approval status
- No terminal commands needed

**Platform Admins:** ✅ **New Capabilities**
- Review applications in UI
- Approve/reject with notes
- Track application history
- Monitor approval metrics

### Risk Assessment

**Low Risk:**
- Changes are additive
- Backward compatible
- Easy rollback
- Existing data protected

**Medium Risk:**
- Database migration (mitigated by defaults)
- New user flows (mitigated by testing)

**High Risk:**
- None identified

### Recommendation

✅ **Proceed with implementation**
- Changes are well-scoped
- Impact is minimal
- Benefits are significant
- Rollback plan is solid
