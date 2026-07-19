# Phase 0 Quick Start Guide

**⏱️ Time Required**: 2 hours for testing, 1 hour for deployment  
**🎯 Goal**: Prepare production environment with critical fixes

## 🚀 Quick Commands

### 1. Update Database Schema (2 minutes)
```bash
npx prisma migrate dev --name add-webhook-events
npx prisma generate
```

### 2. Test Migration (5 minutes)
```bash
npm run migrate:pre-deployment
```

### 3. Test Race Conditions (5 minutes)
```bash
npm run test:concurrent-bookings
```

### 4. Test User Sync (Manual - 5 minutes)
```bash
npm run dev
# Open browser, sign up 3-5 users quickly
# Verify all created in database
```

### 5. Deploy to Production (30 minutes)
```bash
# Backup database first!
NODE_ENV=production npm run migrate:pre-deployment
vercel --prod
curl https://your-domain.com/api/health
```

## ✅ Success Checklist

- [ ] Database schema updated
- [ ] Migration runs without errors
- [ ] Concurrent booking test passes (1 success, 4 failures)
- [ ] User sync works (no errors)
- [ ] Security headers present (`curl -I https://your-domain.com`)
- [ ] Health check returns 200 (`curl https://your-domain.com/api/health`)
- [ ] No errors in production logs

## 📋 What Changed

### Critical Fixes
1. **Race Conditions**: Database locking prevents double bookings
2. **User Sync**: Client-side sync prevents signup failures
3. **Security**: HMAC verification, replay attack prevention, security headers
4. **Monitoring**: Health checks every 5 minutes

### Files Modified
- `apps/web/src/app/layout.tsx` - Added SyncUser
- `packages/db/src/services/seat-state-machine.ts` - Added holdSeat() with locking
- `apps/web/src/app/api/payments/webhook/route.ts` - Enhanced security
- `apps/web/next.config.js` - Added security headers
- `prisma/schema.prisma` - Added WebhookEvent model

### Files Created
- `scripts/pre-deployment-migration.ts` - Migration script
- `tests/concurrent-bookings.test.ts` - Race condition tests
- `apps/web/src/app/api/health/route.ts` - Health monitoring
- `apps/web/src/middleware.ts` - Security middleware
- `vercel.json` - Cron configuration

## 🆘 Troubleshooting

### Migration Fails
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Verify database connection
npx prisma db pull
```

### Test Fails
```bash
# Check test database is configured
# Run with verbose output
npm run test:concurrent-bookings -- --reporter=verbose
```

### Health Check Fails
```bash
# Check endpoint directly
curl -v https://your-domain.com/api/health

# Check Vercel logs
vercel logs
```

## 📚 Full Documentation

- **PHASE_0_IMPLEMENTATION_CHECKLIST.md** - Detailed task list
- **PHASE_0_DEPLOYMENT_GUIDE.md** - Step-by-step deployment
- **PHASE_0_COMPLETE.md** - Complete summary

## 🎯 Next Steps

After Phase 0 is deployed:
1. Monitor for 24 hours
2. Verify booking rate > 50%
3. Check no errors in logs
4. Proceed to Phase 1

---

**Need Help?** Check PHASE_0_DEPLOYMENT_GUIDE.md troubleshooting section.
