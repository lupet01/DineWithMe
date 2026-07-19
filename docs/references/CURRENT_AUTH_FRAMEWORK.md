# Current Authentication & Role Framework

## Overview

The current system has a **single signup flow** where all users start as `DINER` and must be manually upgraded to admin roles.

## Current Flow

### 1. Landing Page (`/`)
- Shows "Sign In" and "Sign Up" buttons
- No differentiation between user types
- Everyone goes through the same Clerk authentication

### 2. Signup Process
```
User clicks "Sign Up" 
  → Clerk handles authentication
  → User signs in
  → `/api/auth/sync` is called
  → User created in database with role = DINER (default)
  → Redirected to /discover
```

### 3. Role Assignment
**Default Role:** `DINER` (set in Prisma schema)

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

**Current Method:** Manual database update via terminal
```sql
UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'user@example.com';
```

### 4. Access Control
- `/discover`, `/my-dinners`, `/profile` - Any authenticated user (DINER)
- `/admin/*` - Requires RESTAURANT_ADMIN or PLATFORM_ADMIN
- `/admin/ops/*` - Requires PLATFORM_ADMIN only

## Problems with Current Framework

### 1. Poor UX for Restaurant Owners
- Restaurant owners must:
  1. Sign up as regular user
  2. Contact admin/developer
  3. Wait for manual role update
  4. Sign out and back in
  5. Finally access admin portal

### 2. No Self-Service
- Can't onboard restaurant owners without developer intervention
- Requires database access
- Not scalable

### 3. No Differentiation
- Landing page doesn't indicate there are different user types
- No clear path for restaurant owners to join

### 4. Development-Only Solution
- Terminal commands work for development
- Not suitable for production
- No approval workflow

## What Should Happen Instead

### Option 1: Separate Signup Flows (Recommended)

**Landing Page:**
```
┌─────────────────────────────────────┐
│         DineWithMe                  │
│    Connect over meals               │
│                                     │
│  [Find Dinners]  [Host Dinners]    │
│                                     │
│  Already have an account? Sign In   │
└─────────────────────────────────────┘
```

**Flow:**
1. **Find Dinners** → Sign up as DINER → Access /discover
2. **Host Dinners** → Sign up as RESTAURANT_ADMIN → Submit restaurant application → Wait for approval → Access /admin
3. **Platform Admin** → Invite-only (no public signup)

### Option 2: Role Selection During Signup

**Signup Flow:**
```
1. Enter email/password (Clerk)
2. Choose account type:
   - I want to find dinners (DINER)
   - I want to host dinners (RESTAURANT_ADMIN)
3. If RESTAURANT_ADMIN:
   - Fill restaurant application
   - Submit for approval
   - Status: PENDING
4. Create user with selected role
```

### Option 3: Post-Signup Role Upgrade

**Flow:**
1. Everyone signs up as DINER
2. In profile, show "Become a Host" button
3. Click → Fill restaurant application
4. Submit for approval
5. Admin approves → Role upgraded to RESTAURANT_ADMIN

## Recommended Approach

**Hybrid: Option 1 + Approval Workflow**

### Landing Page
- "Find Dinners" button → `/sign-up?type=diner`
- "Host Dinners" button → `/sign-up?type=restaurant`
- "Sign In" link → `/sign-in`

### Signup Flows

**Diner Signup:**
```
/sign-up?type=diner
  → Clerk authentication
  → Create user with role=DINER
  → Redirect to /discover
```

**Restaurant Signup:**
```
/sign-up?type=restaurant
  → Clerk authentication
  → Create user with role=RESTAURANT_ADMIN, status=PENDING
  → Show restaurant application form
  → Submit application
  → Create restaurant with status=PENDING_APPROVAL
  → Redirect to /admin/restaurant (limited access)
  → Show "Application Pending" message
```

### Approval Workflow

**Platform Admin:**
```
/admin/ops/restaurants
  → See pending restaurant applications
  → Review details
  → Approve or Reject
  → If approved:
    - Restaurant status → APPROVED
    - User status → ACTIVE
    - Send email notification
  → If rejected:
    - Restaurant status → REJECTED
    - User status → ACTIVE (can reapply)
    - Send email with reason
```

### Database Schema Changes Needed

```prisma
model User {
  role   Role    @default(DINER)
  status String  @default("active")  // active, pending, suspended
}

model Restaurant {
  status RestaurantStatus @default(PENDING_APPROVAL)
}

enum RestaurantStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SUSPENDED
}
```

## Implementation Steps

### Phase 1: Separate Signup Flows
1. Update landing page with "Find Dinners" and "Host Dinners" buttons
2. Create `/sign-up/diner` and `/sign-up/restaurant` routes
3. Modify `/api/auth/sync` to accept role parameter
4. Create restaurant application form

### Phase 2: Approval Workflow
1. Add restaurant status field to database
2. Update `/admin/ops/restaurants` to show pending applications
3. Create approve/reject actions
4. Add email notifications

### Phase 3: User Experience
1. Show application status in restaurant admin
2. Add "Become a Host" option in diner profile
3. Add restaurant reapplication flow
4. Add admin dashboard for monitoring

## Benefits of New Approach

1. **Self-Service:** Restaurant owners can sign up without developer intervention
2. **Scalable:** Works in production with proper approval workflow
3. **Clear UX:** Users know which path to take from landing page
4. **Secure:** Platform admins control who gets restaurant access
5. **Professional:** No terminal commands needed
6. **Flexible:** Diners can upgrade to hosts later

## Migration Path

For existing users:
1. Keep current users as-is
2. Add new signup flows alongside existing flow
3. Gradually migrate to new system
4. Eventually deprecate manual role updates
