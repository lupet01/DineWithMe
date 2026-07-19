# DEPLOYMENT QUICK REFERENCE GUIDE
**For**: Development Team  
**Date**: March 9, 2026  
**Version**: 2.0

---

## 🚨 CRITICAL: READ THIS FIRST

### DO NOT SKIP PHASE 0
The original deployment plan is missing critical pre-deployment tasks. Skipping Phase 0 will cause:
- ❌ User signup failures
- ❌ Double bookings
- ❌ Data corruption
- ❌ Security vulnerabilities
- ❌ Production crashes

### REVISED TIMELINE
- **Original**: 7-11 days
- **Revised**: 9-12.5 days
- **Additional**: +2 days for critical fixes
- **Worth it**: Prevents production failures

---

## 📋 PHASE OVERVIEW

```
Phase 0: Pre-Deployment (1.5 days) - 🔴 MUST DO
├── Database migration
├── User sync fix
├── Race condition fix
├── Security hardening
└── Monitoring setup

Phase 1: Critical Blockers (1 day) - 🔴 MUST DO
├── Booking flow fix
├── Credential removal
├── Trust enforcement
└── Email retry queue

Phase 2: High Priority (2.5-3 days) - 🟠 RECOMMENDED
├── Payment UI
├── Theme fixes
├── QR codes
├── Email notifications
├── Env validation
├── Analytics integration
└── Admin assignment

Phase 3: Medium Priority (2-3 days) - 🟡 OPTIONAL
└── UX improvements

Phase 4: Polish (2-3 days) - 🟢 OPTIONAL
└── Nice-to-haves
```

---

## ⚡ QUICK START

### Day 1 Morning: Phase 0 Setup

```bash
# 1. Create migration script
touch scripts/pre-deployment-migration.ts

# 2. Copy migration code from PRODUCTION_DEPLOYMENT_PLAN_REVISED.md

# 3. Test in development
npm run migrate:pre-deployment

# 4. Verify
npm run test:concurrent-bookings
npm run test:user-sync
```

### Day 1 Afternoon: Phase 0 Security

```bash
# 1. Add security headers to next.config.js

# 2. Create middleware.ts for rate limiting

# 3. Update payment webhook with signature verification

# 4. Test security
npm run test:security
```

### Day 2: Phase 1

```bash
# 1. Fix booking flow
# 2. Remove exposed credentials
# 3. Add trust enforcement
# 4. Add email retry queue
```

---

## 🔧 CRITICAL FILES TO CREATE/MODIFY

### NEW FILES (Phase 0):
```
scripts/pre-deployment-migration.ts
apps/web/src/middleware.ts
apps/web/src/app/api/health/route.ts
tests/concurrent-bookings.test.ts
vercel.json (monitoring config)
```

### MODIFY (Phase 0):
```
apps/web/src/app/layout.tsx (add SyncUser)
packages/db/src/services/seat-state-machine.ts (add locking)
apps/web/src/app/api/payments/webhook/route.ts (add verification)
next.config.js (add security headers)
```

---

## ✅ VERIFICATION CHECKLIST

### After Phase 0:
```bash
# Test concurrent signups
for i in {1..10}; do
  curl -X POST /api/auth/signup &
done
# Expected: All 10 succeed

# Test concurrent bookings
npm run test:concurrent-bookings
# Expected: Only 1 succeeds per seat

# Test payment webhook
curl -X POST /api/payments/webhook \
  -H "x-paystack-signature: invalid" \
  -d '{"event":"charge.success"}'
# Expected: 401 Unauthorized

# Test health check
curl /api/health
# Expected: {"status":"healthy"}
```

### After Phase 1:
```bash
# Test booking flow
npm run test:e2e:booking

# Test trust enforcement
npm run test:trust-enforcement

# Test email retry
npm run test:email-retry
```

---

## 🚨 COMMON PITFALLS

### 1. Skipping Database Migration
**Problem**: Theme type change breaks existing data  
**Solution**: Run migration BEFORE deploying type fix

### 2. Not Testing Concurrent Bookings
**Problem**: Race condition causes double bookings  
**Solution**: Run concurrent booking tests

### 3. Deploying Without User Sync Fix
**Problem**: New users can't sign up  
**Solution**: Add SyncUser to layout.tsx

### 4. Missing Security Headers
**Problem**: Vulnerable to XSS, clickjacking  
**Solution**: Add headers to next.config.js

### 5. No Monitoring
**Problem**: Production issues go undetected  
**Solution**: Set up health checks and alerts

---

## 📞 EMERGENCY CONTACTS

### If Production Fails:

1. **Check health endpoint**: `/api/health`
2. **Check Vercel logs**: `vercel logs`
3. **Rollback**: `vercel rollback`
4. **Check database**: Verify connection
5. **Check cron jobs**: Verify running

### Rollback Plan:
```bash
# 1. Rollback deployment
vercel rollback

# 2. Restore database (if needed)
# Use your database provider's restore tool

# 3. Verify rollback
curl /api/health
```

---

## 📊 PROGRESS TRACKING

### Phase 0 (1.5 days):
- [ ] Database migration script created
- [ ] Migration tested in development
- [ ] Migration run in production
- [ ] User sync fixed
- [ ] Race condition fixed
- [ ] Security headers added
- [ ] Rate limiting added
- [ ] Payment webhook secured
- [ ] Monitoring setup
- [ ] All tests passing

### Phase 1 (1 day):
- [ ] Booking flow fixed
- [ ] Credentials removed
- [ ] Trust enforcement added
- [ ] Email retry queue added
- [ ] All tests passing

### Phase 2 (2.5-3 days):
- [ ] Payment UI implemented
- [ ] Theme fixes deployed
- [ ] QR codes working
- [ ] Email notifications sent
- [ ] Env validation working
- [ ] Analytics integrated
- [ ] Admin assignment working
- [ ] All tests passing

---

## 🎯 SUCCESS METRICS

### Must Achieve (Phase 0-1):
- ✅ 100% user signup success rate
- ✅ 0 double bookings
- ✅ 0 security vulnerabilities
- ✅ 100% payment webhook verification
- ✅ Health check returns 200

### Should Achieve (Phase 2):
- ✅ 95%+ booking success rate
- ✅ 95%+ email delivery rate
- ✅ <500ms API response time
- ✅ 0 TypeScript errors
- ✅ 0 critical bugs

---

## 📚 DOCUMENTATION REFERENCES

- **Full Review**: `DEPLOYMENT_PLAN_COMPREHENSIVE_REVIEW.md`
- **Critical Gaps**: `CRITICAL_DEPLOYMENT_GAPS_SUMMARY.md`
- **Revised Plan**: `PRODUCTION_DEPLOYMENT_PLAN_REVISED.md`
- **Original Plan**: `PRODUCTION_DEPLOYMENT_PLAN.md`

---

## 🚀 DEPLOYMENT DAY CHECKLIST

### Morning of Deployment:
- [ ] All Phase 0 tasks complete
- [ ] All Phase 1 tasks complete
- [ ] All tests passing
- [ ] Staging tested
- [ ] Team briefed
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Database backed up

### During Deployment:
- [ ] Deploy to production
- [ ] Verify health check
- [ ] Test critical flows
- [ ] Monitor logs
- [ ] Check metrics
- [ ] Verify emails sending
- [ ] Test payments

### After Deployment:
- [ ] Monitor for 1 hour
- [ ] Check error rates
- [ ] Verify cron jobs
- [ ] Test user signups
- [ ] Test bookings
- [ ] Document issues
- [ ] Celebrate! 🎉

---

**Remember**: Better to take 2 extra days and deploy safely than rush and cause production failures.

**Questions?** Review the comprehensive documentation or consult with the team.

**Ready?** Start with Phase 0!
