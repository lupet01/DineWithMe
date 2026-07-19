# EPIC 2.7: Quick Setup Guide

## Prerequisites
- Dev server stopped
- Database running

---

## Step 1: Sync Database Schema

```bash
cd prisma
npx prisma db push
npx prisma generate
```

Expected output: "Your database is now in sync"

---

## Step 2: Update Existing Data

### Set Status for Existing Restaurants
```bash
psql -U postgres -d dinewithme -c "UPDATE restaurants SET status = 'PENDING' WHERE status IS NULL;"
```

### Make Yourself Platform Admin
```bash
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'luupetros@gmail.com';"
```

---

## Step 3: Start Dev Server

```bash
npm run dev
```

---

## Step 4: Test the Ops Page

1. Navigate to: **http://localhost:3001/admin/ops/restaurants**

2. You should see:
   - Stats cards (Pending, Active, Paused counts)
   - Filter tabs
   - Restaurants table
   - Your restaurant with PENDING status

3. Test approval:
   - Click "Approve" on your restaurant
   - Confirm
   - Status changes to ACTIVE

---

## Step 5: Test Dinner Creation

Now that your restaurant is ACTIVE, you can create dinners:

```bash
npx tsx seed-dinners.ts
```

Should work without errors.

---

## If You Get Permission Errors

### Check Your Role
```bash
psql -U postgres -d dinewithme -c "SELECT email, role FROM users WHERE email = 'luupetros@gmail.com';"
```

Should show: `PLATFORM_ADMIN`

### Check Restaurant Status
```bash
psql -U postgres -d dinewithme -c "SELECT name, status FROM restaurants;"
```

Should show status column with values.

---

## Quick Test Checklist

- [ ] Database schema synced
- [ ] Existing restaurants have status
- [ ] User is PLATFORM_ADMIN
- [ ] Can access `/admin/ops/restaurants`
- [ ] Can see restaurants table
- [ ] Can approve restaurant
- [ ] Can pause restaurant
- [ ] Can reactivate restaurant
- [ ] Dinner creation works for ACTIVE restaurants

---

## Troubleshooting

### "Column status does not exist"
→ Run `npx prisma db push` again

### "Access denied" or redirect to unauthorized
→ Make sure you're PLATFORM_ADMIN

### Can't create dinners
→ Make sure restaurant status is ACTIVE

### Prisma generate fails
→ Stop dev server first, then run generate

---

## Summary

Once setup is complete:
- New restaurants start as PENDING
- Platform admins approve restaurants
- Only ACTIVE restaurants can create dinners
- Platform admins can pause/reactivate restaurants

Access the ops page at: **http://localhost:3001/admin/ops/restaurants**
