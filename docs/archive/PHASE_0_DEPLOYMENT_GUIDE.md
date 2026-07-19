# Phase 0 Deployment Guide

**Status**: Ready for Deployment  
**Date**: March 11, 2026  
**Estimated Time**: 1.5 days

## 🎯 Overview

Phase 0 implements critical pre-deployment tasks that must be completed before Phase 1. These changes prevent production failures related to race conditions, user sync, security, and data migration.

## 📋 Pre-Deployment Steps

### Step 1: Database Schema Update (5 minutes)

Add the WebhookEvent model for replay attack prevention:

```bash
# The model has been added to prisma/schema.prisma
# Run migration
npx prisma migrate dev --name add-webhook-events

# Generate Prisma client
npx prisma generate
```

### Step 2: Backup Production Database (15 minutes)

**CRITICAL**: Create a full backup before running any migrations.

```bash
# Using your database provider's backup tool
# For example, with Supabase:
# 1. Go to Database > Backups
# 2. Click "Create Backup"
# 3. Wait for completion
# 4. Download backup file

# Or using pg_dump:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 3: Test Migration in Development (30 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Run migration script in development
npm run migrate:pre-deployment

# Expected output:
# 🚀 Starting pre-deployment migration...
# 📦 Creating backups...
#   ✓ Backed up users
#   ✓ Backed up restaurants
#   ✓ Backed up dinners
#   ✓ Backed up seats
#   ✓ Backed up payment_intents
# 🎨 Migrating theme data...
#   ✓ Migrated X restaurants, skipped Y
# 📊 Adding indexes...
#   ✓ Added index (x5)
# 🧹 Cleaning up expired holds...
#   ✓ Cleaned up X expired holds
# ✅ Verifying data integrity...
#   ✓ Data integrity verified
# ✅ Migration complete!
```

### Step 4: Test Concurrent Bookings (15 minutes)

```bash
# Run concurrent booking test
npm run test:concurrent-bookings

# Expected output:
# ✓ should prevent double bookings with concurrent requests
# ✓ should prevent user from holding multiple seats for same dinner
```

### Step 5: Verify User Sync (Manual - 10 minutes)

1. Start development server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Sign up with a new test user
4. Check database immediately - user should exist
5. Try signing up 3-5 users quickly
6. Verify all users created without errors

### Step 6: Check Security Headers (5 minutes)

```bash
# Start dev server
npm run dev

# In another terminal, check headers
curl -I http://localhost:3000

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 🚀 Production Deployment

### Step 1: Deploy to Staging (30 minutes)

```bash
# 1. Commit all changes
git add .
git commit -m "Phase 0: Pre-deployment tasks complete"
git push origin main

# 2. Deploy to staging
vercel --env=staging

# 3. Run migration on staging database
# Set DATABASE_URL to staging database
NODE_ENV=production npm run migrate:pre-deployment

# 4. Test staging thoroughly
# - Sign up new users
# - Try concurrent bookings
# - Check health endpoint
# - Verify payment webhook
```

### Step 2: Deploy to Production (1 hour)

```bash
# 1. Final backup check
# Verify backup was created and is recent

# 2. Run migration on production
NODE_ENV=production DATABASE_URL=$PRODUCTION_DATABASE_URL npm run migrate:pre-deployment

# 3. Deploy to production
vercel --prod

# 4. Verify deployment
curl https://your-domain.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "database": true,
#     "bookingRate": true,
#     "timestamp": "2026-03-11T..."
#   },
#   "issues": [],
#   "timestamp": "2026-03-11T..."
# }
```

### Step 3: Post-Deployment Verification (30 minutes)

```bash
# 1. Check health endpoint
curl https://your-domain.com/api/health

# 2. Test user signup
# - Sign up with new account
# - Verify user created immediately
# - Check no errors in logs

# 3. Test booking flow
# - Hold a seat
# - Complete payment
# - Verify seat confirmed
# - Check webhook processed

# 4. Monitor logs
# - Check for any errors
# - Verify analytics events
# - Check audit logs

# 5. Test concurrent bookings (optional)
# - Use load testing tool
# - Try to book same seat from multiple browsers
# - Verify only one succeeds
```

## 📊 Monitoring

### Health Check

The health check endpoint runs every 5 minutes via Vercel cron:

```bash
# Manual check
curl https://your-domain.com/api/health

# Check cron logs in Vercel dashboard
# Settings > Cron Jobs > View Logs
```

### Key Metrics to Monitor

1. **Database Connection**: Should always be `true`
2. **Booking Rate**: Should be > 50% (adjustable threshold)
3. **Response Time**: Health check should respond < 1s
4. **Error Rate**: Should be 0 errors in logs

### Alert Thresholds

- Health check returns 503: CRITICAL
- Booking rate < 50%: WARNING
- Database connection fails: CRITICAL
- Webhook signature failures: WARNING

## 🔧 Troubleshooting

### Migration Fails

```bash
# Check error message
# Common issues:
# 1. Database connection - verify DATABASE_URL
# 2. Permissions - ensure user has CREATE TABLE rights
# 3. Existing backups - tables already exist (safe to ignore)

# Rollback if needed
# Restore from backup created in Step 2
```

### User Sync Not Working

```bash
# Check:
# 1. SyncUser component is in layout.tsx
# 2. Clerk webhook is disabled (if using client-side sync)
# 3. Database connection is working
# 4. No errors in browser console

# Debug:
# - Check Network tab for /api/users/sync calls
# - Check server logs for errors
# - Verify Clerk configuration
```

### Race Condition Still Occurring

```bash
# Check:
# 1. Database supports FOR UPDATE locks (PostgreSQL does)
# 2. Transaction isolation level is Serializable
# 3. holdSeat() method is being used (not direct updates)

# Debug:
# - Run concurrent booking test
# - Check database logs for lock conflicts
# - Verify seat status transitions in audit logs
```

### Security Headers Not Applied

```bash
# Check:
# 1. next.config.js has headers() function
# 2. Middleware is in apps/web/src/middleware.ts
# 3. Deployment includes config files

# Debug:
# - Check Vercel deployment logs
# - Verify headers in browser DevTools
# - Test with curl -I
```

### Health Check Failing

```bash
# Check:
# 1. Database connection
# 2. Booking rate calculation
# 3. Vercel cron job configuration

# Debug:
# - Check /api/health endpoint directly
# - Review error logs
# - Verify database queries
# - Check Vercel cron logs
```

## ✅ Success Criteria

Phase 0 is complete when:

- [x] All files created and committed
- [ ] Database schema updated with WebhookEvent model
- [ ] Migration runs successfully in development
- [ ] Concurrent booking test passes
- [ ] User sync works (manual verification)
- [ ] Security headers present in responses
- [ ] Health check returns 200 status
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Post-deployment verification complete

## 📝 Rollback Plan

If critical issues occur after deployment:

1. **Immediate**: Revert to previous Vercel deployment
   ```bash
   vercel rollback
   ```

2. **Database**: Restore from backup
   ```bash
   # Using your database provider's restore tool
   # Or with psql:
   psql $DATABASE_URL < backup_file.sql
   ```

3. **Code**: Revert Git commits
   ```bash
   git revert HEAD
   git push origin main
   vercel --prod
   ```

## 🎯 Next Steps

After Phase 0 is complete and verified:

1. Review Phase 0 checklist
2. Confirm all success criteria met
3. Monitor production for 24 hours
4. Proceed to Phase 1 implementation

## 📞 Support

If you encounter issues:

1. Check troubleshooting section above
2. Review deployment logs in Vercel
3. Check database logs
4. Review audit logs for state transitions
5. Monitor health check endpoint

---

**Document Version**: 1.0  
**Last Updated**: March 11, 2026  
**Status**: Ready for Deployment
