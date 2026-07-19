# Epic 8: Restaurant Onboarding & Approval System

## Overview

Implement a self-service restaurant onboarding system that allows restaurant owners to sign up, submit applications, and get approved without manual database intervention.

## Goals

1. Enable restaurant owners to sign up with the correct role automatically
2. Provide a restaurant application form during signup
3. Allow platform admins to review and approve/reject applications
4. Eliminate need for terminal commands to assign roles

## Epic Breakdown

### Epic 8.1: Database Schema & Role Assignment
**Priority:** High (Foundation)
**Estimated Effort:** 2-3 hours

#### Scope
- Add restaurant application status tracking
- Modify user sync to accept role parameter
- Add database migrations

#### Tasks
1. Update Prisma schema
   - Add `applicationStatus` field to Restaurant model
   - Add `applicationSubmittedAt` timestamp
   - Add `applicationReviewedAt` timestamp
   - Add `applicationReviewedBy` field (references User)
   - Add `rejectionReason` field
   
2. Create migration
   - Generate Prisma migration
   - Apply to database
   
3. Update user repository
   - Add method to create user with specific role
   - Add method to update user role
   
4. Update restaurant repository
   - Add method to find pending applications
   - Add method to approve/reject applications
   - Add method to get application history

#### Acceptance Criteria
- [ ] Restaurant model has application status fields
- [ ] Can create users with RESTAURANT_ADMIN role
- [ ] Can query pending restaurant applications
- [ ] Migration runs successfully

#### Files to Create/Modify
- `prisma/schema.prisma`
- `packages/db/src/repositories/user.repository.ts`
- `packages/db/src/repositories/restaurant.repository.ts`

---

### Epic 8.2: Role-Based Signup Routes
**Priority:** High (Core Feature)
**Estimated Effort:** 3-4 hours
**Depends On:** Epic 8.1

#### Scope
- Create separate signup flows for diners and restaurant owners
- Modify auth sync endpoint to accept role parameter
- Handle role assignment during signup

#### Tasks
1. Create signup route structure
   - `/sign-up/diner` - Diner signup
   - `/sign-up/restaurant` - Restaurant owner signup
   - Keep `/sign-up` as default (redirects to diner)
   
2. Modify auth sync endpoint
   - Accept `role` query parameter
   - Accept `intendedRole` in request body
   - Validate role is allowed (DINER or RESTAURANT_ADMIN only)
   - Create user with specified role
   
3. Create Clerk sign-up components
   - Diner signup page (uses Clerk's SignUp component)
   - Restaurant signup page (uses Clerk's SignUp component)
   - Add role metadata to Clerk user
   
4. Update middleware
   - Allow `/sign-up/diner` and `/sign-up/restaurant` as public routes

#### Acceptance Criteria
- [ ] Can access `/sign-up/diner` and sign up as DINER
- [ ] Can access `/sign-up/restaurant` and sign up as RESTAURANT_ADMIN
- [ ] User created with correct role in database
- [ ] Role stored in Clerk metadata
- [ ] Redirects work correctly after signup

#### Files to Create/Modify
- `apps/web/src/app/(auth)/sign-up/diner/[[...sign-up]]/page.tsx`
- `apps/web/src/app/(auth)/sign-up/restaurant/[[...sign-up]]/page.tsx`
- `apps/web/src/app/api/auth/sync/route.ts`
- `apps/web/src/middleware.ts`

---

### Epic 8.3: Restaurant Application Form
**Priority:** High (Core Feature)
**Estimated Effort:** 4-5 hours
**Depends On:** Epic 8.1, Epic 8.2

#### Scope
- Create restaurant application form
- Show form after restaurant owner signs up
- Submit application with PENDING status
- Show application status to restaurant owner

#### Tasks
1. Create application form component
   - Restaurant name (required)
   - Description (required)
   - Cuisine type (required)
   - Address (required)
   - City (required)
   - Phone (required)
   - Website (optional)
   - Why do you want to host dinners? (required, textarea)
   
2. Create application submission page
   - `/admin/restaurant/apply` - Application form
   - Show after restaurant signup
   - Validate all required fields
   - Submit to API endpoint
   
3. Create application API endpoint
   - `POST /api/restaurants/apply`
   - Create restaurant with PENDING_APPROVAL status
   - Link to authenticated user
   - Send confirmation email (optional)
   
4. Create application status page
   - Show in `/admin/restaurant` when application is pending
   - Display "Application Under Review" message
   - Show submitted details
   - Show estimated review time
   
5. Update restaurant admin layout
   - Allow access even with PENDING status
   - Show limited functionality until approved

#### Acceptance Criteria
- [ ] Restaurant owner sees application form after signup
- [ ] Can submit application with all required fields
- [ ] Application saved with PENDING_APPROVAL status
- [ ] Restaurant owner sees "pending" status in admin
- [ ] Cannot create dinners until approved
- [ ] Can view/edit application while pending

#### Files to Create/Modify
- `apps/web/src/app/admin/restaurant/apply/page.tsx`
- `apps/web/src/app/admin/restaurant/apply/components/application-form.tsx`
- `apps/web/src/app/admin/restaurant/apply/actions.ts`
- `apps/web/src/app/api/restaurants/apply/route.ts`
- `apps/web/src/app/admin/restaurant/page.tsx` (update for pending status)
- `packages/shared/src/schemas/restaurant.schema.ts`

---

### Epic 8.4: Application Approval Workflow
**Priority:** High (Core Feature)
**Estimated Effort:** 5-6 hours
**Depends On:** Epic 8.1, Epic 8.3

#### Scope
- Update platform ops to show pending applications
- Add approve/reject actions
- Send notifications on approval/rejection
- Update restaurant and user status

#### Tasks
1. Update restaurants table component
   - Add "Status" column
   - Add "Applied Date" column
   - Add "Actions" column with approve/reject buttons
   - Filter by status (pending, approved, rejected)
   - Sort by application date
   
2. Create approval modal
   - Show restaurant details
   - Show application answers
   - Add approval notes field
   - Confirm approval action
   
3. Create rejection modal
   - Show restaurant details
   - Require rejection reason
   - Add rejection notes field
   - Confirm rejection action
   
4. Create approval/rejection actions
   - `approveRestaurant(restaurantId, notes)`
   - `rejectRestaurant(restaurantId, reason, notes)`
   - Update restaurant status
   - Update user status if needed
   - Log action in audit trail
   
5. Create approval API endpoints
   - `POST /api/admin/restaurants/:id/approve`
   - `POST /api/admin/restaurants/:id/reject`
   - Verify PLATFORM_ADMIN role
   - Update database
   - Send email notification (optional)
   
6. Update restaurant owner view
   - Show approval notification
   - Show rejection notification with reason
   - Allow reapplication if rejected
   - Enable full admin access when approved

#### Acceptance Criteria
- [ ] Platform admin sees pending applications in ops
- [ ] Can view application details
- [ ] Can approve application with notes
- [ ] Can reject application with reason
- [ ] Restaurant status updates correctly
- [ ] Restaurant owner sees approval/rejection
- [ ] Approved owners can access full admin features
- [ ] Rejected owners can reapply

#### Files to Create/Modify
- `apps/web/src/app/admin/ops/restaurants/components/restaurants-table.tsx`
- `apps/web/src/app/admin/ops/restaurants/components/restaurant-row.tsx`
- `apps/web/src/app/admin/ops/restaurants/components/approve-modal.tsx`
- `apps/web/src/app/admin/ops/restaurants/components/reject-modal.tsx`
- `apps/web/src/app/admin/ops/restaurants/actions.ts`
- `apps/web/src/app/api/admin/restaurants/[id]/approve/route.ts`
- `apps/web/src/app/api/admin/restaurants/[id]/reject/route.ts`
- `apps/web/src/app/admin/restaurant/page.tsx` (update for approval status)

---

### Epic 8.5: Email Notifications (Optional)
**Priority:** Medium (Enhancement)
**Estimated Effort:** 3-4 hours
**Depends On:** Epic 8.4

#### Scope
- Send email when application is submitted
- Send email when application is approved
- Send email when application is rejected

#### Tasks
1. Set up email service (e.g., Resend, SendGrid)
2. Create email templates
3. Send emails on status changes
4. Add email preferences

#### Acceptance Criteria
- [ ] Restaurant owner receives confirmation email on application
- [ ] Restaurant owner receives approval email
- [ ] Restaurant owner receives rejection email with reason

---

### Epic 8.6: Analytics & Monitoring
**Priority:** Low (Nice to Have)
**Estimated Effort:** 2-3 hours
**Depends On:** Epic 8.4

#### Scope
- Track application submissions
- Track approval/rejection rates
- Monitor application review times

#### Tasks
1. Add analytics events
2. Create admin dashboard metrics
3. Add application timeline view

#### Acceptance Criteria
- [ ] Track application submission events
- [ ] Track approval/rejection events
- [ ] Show metrics in platform ops dashboard

---

## Implementation Order

### Phase 1: Foundation (Epic 8.1)
Start here - sets up database structure

### Phase 2: Signup Flow (Epic 8.2)
Enables role-based signup

### Phase 3: Application Form (Epic 8.3)
Allows restaurant owners to apply

### Phase 4: Approval System (Epic 8.4)
Enables platform admins to review

### Phase 5: Enhancements (Epic 8.5, 8.6)
Optional improvements

## Testing Strategy

### Unit Tests
- User repository role assignment
- Restaurant repository status updates
- Application form validation
- Approval/rejection logic

### Integration Tests
- End-to-end signup flow
- Application submission flow
- Approval workflow
- Rejection workflow

### Manual Testing
1. Sign up as restaurant owner
2. Submit application
3. Sign in as platform admin
4. Review and approve application
5. Verify restaurant owner has access
6. Test rejection flow
7. Test reapplication flow

## Database Schema Changes

```prisma
model Restaurant {
  // ... existing fields
  
  // Application tracking
  applicationStatus     RestaurantApplicationStatus @default(PENDING_APPROVAL)
  applicationSubmittedAt DateTime?
  applicationReviewedAt  DateTime?
  applicationReviewedBy  String?  // User ID
  applicationNotes       String?  // Admin notes
  rejectionReason        String?
  
  // Relations
  reviewedBy            User?    @relation("RestaurantReviewer", fields: [applicationReviewedBy], references: [id])
}

enum RestaurantApplicationStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SUSPENDED
}
```

## API Endpoints

### New Endpoints
- `POST /api/auth/sync?role=RESTAURANT_ADMIN` - Create user with role
- `POST /api/restaurants/apply` - Submit restaurant application
- `GET /api/restaurants/application/status` - Get application status
- `POST /api/admin/restaurants/:id/approve` - Approve application
- `POST /api/admin/restaurants/:id/reject` - Reject application
- `GET /api/admin/restaurants/pending` - Get pending applications

### Modified Endpoints
- `POST /api/auth/sync` - Accept role parameter

## Security Considerations

1. **Role Validation**
   - Only allow DINER and RESTAURANT_ADMIN during signup
   - PLATFORM_ADMIN must be assigned manually
   
2. **Application Access**
   - Restaurant owners can only see their own application
   - Platform admins can see all applications
   
3. **Approval Authorization**
   - Only PLATFORM_ADMIN can approve/reject
   - Log all approval/rejection actions
   
4. **Rate Limiting**
   - Limit application submissions per user
   - Prevent spam applications

## Migration Strategy

### For Existing Users
1. Keep existing users as-is
2. Add new signup flows alongside existing
3. Existing restaurant admins keep their access
4. New restaurant admins go through approval

### For Existing Restaurants
1. Mark existing restaurants as APPROVED
2. Set applicationStatus = APPROVED
3. Set applicationSubmittedAt = createdAt
4. Set applicationReviewedAt = createdAt

## Success Metrics

1. **Adoption**
   - Number of restaurant applications submitted
   - Conversion rate from signup to application
   
2. **Efficiency**
   - Average application review time
   - Approval rate
   
3. **User Experience**
   - Time from signup to first dinner created
   - Application abandonment rate

## Rollback Plan

If issues arise:
1. Disable new signup routes
2. Revert to manual role assignment
3. Keep existing approved restaurants active
4. Review and fix issues
5. Re-enable with fixes

## Documentation Needed

1. Restaurant owner onboarding guide
2. Platform admin approval guide
3. API documentation for new endpoints
4. Database schema documentation
5. Testing guide

## Future Enhancements

1. Multi-step application form
2. Document upload (business license, etc.)
3. Video interview scheduling
4. Automated background checks
5. Application scoring system
6. Bulk approval/rejection
7. Application templates
8. Conditional approval (with requirements)
