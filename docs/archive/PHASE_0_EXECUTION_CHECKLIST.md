# Phase 0 Execution Checklist

**Status**: In Progress
**Started**: April 5, 2026

## ✅ Pre-Deployment Verification

### Files Ready
- [x] WebhookEvent model in schema.prisma
- [x] Pre-deployment migration script exists
- [x] Concurrent booking test exists
- [x] npm scripts configured

## 📋 Execution Steps

### Step 1: Database Schema Update ⏳
```bash
# Generate migration for WebhookEvent model
npx prisma migrate dev --name add-webhook-events

# Generate Prisma client
npx prisma generate
```

**Status**: Ready to execute
**Estimated Time**: 5 minutes

---

### Step 2: Backup Production Database ⏳
**CRITICAL**: Must be done before any production changes

```bash
# Option 1: Using database provider (Supabase/Vercel Postgres)
# - Go to database dashboard
# - Create manual backup
# - Download backup file

# Option 2: Using pg_dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Status**: Pending
**Estimated Time**: 15 minutes

---

### Step 3: Test Migration in Development ⏳
```bash
# Install dependencies (if needed)
npm install

# Run pre-deployment migration
npm run migrate:pre-deployment
```

**Expected Output**:
```
🚀 Starting pre-deployment migration...
📦 Creating backups...
  ✓ Backed up users
  ✓ Backed up restaurants
  ✓ Backed up dinners
  ✓ Backed up seats
  ✓ Backed up payment_intents
🎨 Migrating theme data...
  ✓ Theme data structure already correct
📊 Adding indexes...
  ✓ Added index (x5)
🧹 Cleaning up expired holds...
  ✓ Cleaned up X expired holds
✅ Verifying data integrity...
  ✓ Data integrity verified
✅ Migration complete!
```

**Status**: Ready to execute
**Estimated Time**: 30 minutes

---

### Step 4: Test Concurrent Bookings ⏳
```bash
npm run test:concurrent-bookings
```

**Expected**: All tests pass
**Status**: Ready to execute
**Estimated Time**: 15 minutes

---

### Step 5: Verify User Sync ⏳
**Manual Testing Required**

1. Start dev server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Sign up with test user
4. Check database - user should exist immediately
5. Try 3-5 rapid signups
6. Verify all users created

**Status**: Ready to execute
**Estimated Time**: 10 minutes

---

### Step 6: Check Security Headers ⏳
```bash
# Start dev server
npm run dev

# In another terminal
curl -I http://localhost:3000
```

**Expected Headers**:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

**Status**: Ready to execute
**Estimated Time**: 5 minutes

---

## 🚀 Production Deployment (After All Tests Pass)

### Step 7: Deploy to Staging ⏳
```bash
# Commit changes
git add .
git commit -m "Phase 0: Pre-deployment tasks complete"
git push origin main

# Deploy to staging
vercel --env=staging

# Run migration on staging
NODE_ENV=production npm run migrate:pre-deployment
```

**Status**: Pending
**Estimated Time**: 30 minutes

---

### Step 8: Deploy to Production ⏳
```bash
# Verify backup exists and is recent

# Run migration on production
NODE_ENV=production DATABASE_URL=$PRODUCTION_DATABASE_URL npm run migrate:pre-deployment

# Deploy to production
vercel --prod

# Verify deployment
curl https://your-domain.com/api/health
```

**Status**: Pending
**Estimated Time**: 1 hour

---

### Step 9: Post-Deployment Verification ⏳
1. Check health endpoint
2. Test user signup
3. Test booking flow
4. Monitor logs
5. Test concurrent bookings (optional)

**Status**: Pending
**Estimated Time**: 30 minutes

---

## 🎯 Success Criteria

- [ ] Database schema updated with WebhookEvent model
- [ ] Migration runs successfully in development
- [ ] Concurrent booking test passes
- [ ] User sync works (manual verification)
- [ ] Security headers present
- [ ] Health check returns 200
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Post-deployment verification complete

---

## 📝 Notes

### Current Environment
- Database: PostgreSQL (via Prisma)
- Deployment: Vercel
- Auth: Clerk
- Payment: Paystack

### Next Steps After Phase 0
1. Monitor production for 24 hours
2. Review Phase 0 results
3. Proceed to Phase 1 implementation

---

**Last Updated**: April 5, 2026
