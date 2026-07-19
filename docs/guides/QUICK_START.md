# Quick Start Guide

Get your DineWithMe app up and running with mock data in 2 minutes.

## Prerequisites

1. ✅ Dev server is running (`npm run dev`)
2. ✅ You've signed in at least once (this syncs your account to the database)

## One Command Setup

Run this single command to set up everything:

```bash
npx tsx scripts/seed/seed-all.ts your-email@example.com
```

Replace `your-email@example.com` with the email you used to sign in.

## What This Does

✅ Creates 5 conversation themes  
✅ Creates a restaurant ("The Gathering Table")  
✅ Makes you the restaurant owner  
✅ Creates 5 upcoming dinners with seats  
✅ Gives you RESTAURANT_ADMIN access  

## What You Can Do Now

### As a Regular User (DINER)
- Visit `/discover` - Browse available dinners
- Visit `/my-dinners` - View your bookings
- Visit `/profile` - Manage your profile

### As Restaurant Admin
- Visit `/admin` - Restaurant dashboard
- Visit `/admin/restaurant` - Manage restaurant details
- Visit `/admin/dinners` - Create and manage dinners

### As Platform Admin (Ops)
First upgrade your role:
```bash
npx tsx scripts/set-user-role.ts your-email@example.com PLATFORM_ADMIN
```

Then access:
- Visit `/admin/ops` - Platform operations
- Visit `/admin/ops/restaurants` - Manage all restaurants
- Visit `/admin/ops/users` - View all users

## Need Help?

See [ADMIN_ACCESS_GUIDE.md](./ADMIN_ACCESS_GUIDE.md) for detailed instructions.

## Common Issues

**"User not found"**  
→ Sign in to the app first, then run the script

**"Access Denied" at /admin**  
→ Run: `npx tsx scripts/set-user-role.ts your-email@example.com RESTAURANT_ADMIN`

**No dinners showing**  
→ Run: `npx tsx scripts/seed/seed-dinners.ts`
