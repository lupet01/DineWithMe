# Navigation Guide - Finding the New UI

## The Issue

You're seeing the OLD admin portal pages, but we built a NEW user-facing app with Apple-native design in EPICs 4.1-4.7.

## Two Different App Sections

### 1. Admin Portal (Old Design - What You're Seeing)
- `/admin/restaurant` - Restaurant profile management
- `/admin/dinners` - Dinner management
- `/admin/ops/restaurants` - Restaurant operations
- `/app/profile` - Old profile page
- `/dashboard` - Admin dashboard

These pages use a more utilitarian design and are for restaurant admins and platform admins.

### 2. User App (New Apple-Native Design - What We Built)
- `/discover` - Browse dinners with filters and cards
- `/dinner/[id]` - Dinner detail page with hero image
- `/my-dinners` - Your reservations with tabs
- `/profile` - User profile (should be at `/(core)/profile`)

## How to Access the New UI

### Option 1: Direct URLs
Navigate directly to these URLs in your browser:

```
http://localhost:3001/discover
http://localhost:3001/my-dinners
http://localhost:3001/profile
```

### Option 2: From Sign-in
After signing in, you should be redirected to `/discover` automatically.

### Option 3: Bottom Navigation
Once you're on any `/(core)` page, you'll see the bottom tab navigation with:
- Discover
- My Dinners  
- Profile

## Current Routing Structure

```
apps/web/src/app/
├── (auth)/              # Sign in/up pages
├── (core)/              # NEW USER APP (Apple-native design)
│   ├── discover/        # Browse dinners
│   ├── dinner/[id]/     # Dinner details
│   ├── my-dinners/      # User reservations
│   └── profile/         # User profile
├── admin/               # Admin portal (old design)
├── app/                 # Old app pages (deprecated)
└── dashboard/           # Dashboard (old)
```

## The Problem

The old `/app/profile` page still exists and uses the old design. We need to either:
1. Redirect `/app/*` to `/(core)/*`
2. Delete the old `/app` directory
3. Update middleware to route correctly

## Quick Fix

I'll create redirects to send you to the new pages automatically.
