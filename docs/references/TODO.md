# TODO - Pending Tasks

## 🔴 Critical (Before Production)

### 1. Setup Cron Job for Seat Expiration
**Status:** Code complete, deployment pending  
**Time:** 1 minute (manual) or 5 minutes (automatic)  
**Priority:** MEDIUM for dev, HIGH for production

**For Development (Choose One):**

**Option A: Manual (Simplest)**
Just run this script whenever you want to expire holds:
```powershell
.\expire-holds-now.ps1
```
No setup needed! Script already created.

**Option B: Automatic (Windows Task Scheduler)**
Set up Windows to run it every minute automatically.
See: `WINDOWS_TASK_SCHEDULER_SETUP.md`

**For Production (When Ready to Deploy):**
- GitHub Actions (free) - See `GITHUB_ACTIONS_SETUP.md`
- Cron-job.org (free) - See `FREE_CRON_SETUP.md`
- Vercel Cron ($20/month)

**Why it matters:**
- Users hold seats for 10 minutes
- Without cron, seats stay held forever
- Other users can't book those seats
- Results in "sold out" dinners that aren't actually full

**For now:** Just use the manual script when testing. Set up automatic cron when you deploy.

---

### 2. Fix Cloudflare R2 CORS
**Status:** Pending  
**Time:** 5 minutes  
**Priority:** HIGH - Image uploads don't work

**What to do:**
1. Go to Cloudflare Dashboard → R2 → dinewithme-media bucket
2. Settings → CORS Policy
3. Add the CORS configuration from `R2_CORS_FIX.md`

**Documentation:** `R2_CORS_FIX.md`

**Why it matters:**
- Restaurant admins can't upload images
- Gallery manager doesn't work
- Hero images can't be set

---

## 🟡 Important (Before Launch)

### 3. Update Admin Dinners UI
**Status:** Partially complete  
**Time:** 30 minutes  
**Priority:** MEDIUM

**What's done:**
- ✅ Updated to use `startsAt` instead of `scheduledAt`
- ✅ Shows `endsAt` time
- ✅ Fetches seat counts from API

**What's pending:**
- ⚠️ Test the seat count API endpoint
- ⚠️ Verify all dinner actions work (Mark Live, Complete, Cancel)
- ⚠️ Check error handling

**Files to check:**
- `apps/web/src/app/admin/dinners/page.tsx`
- `apps/web/src/app/admin/dinners/components/dinner-row.tsx`
- `apps/web/src/app/api/dinners/[id]/seats/route.ts`

---

### 4. Generate Production CRON_SECRET
**Status:** Using dev token  
**Time:** 2 minutes  
**Priority:** MEDIUM

**What to do:**
```bash
# Generate secure token
openssl rand -base64 32

# Update in:
# 1. .env file
# 2. Vercel environment variables
# 3. GitHub secrets
```

**Why it matters:**
- Current token is `dev-secret-token-change-in-production`
- Not secure for production
- Easy to guess

---

### 5. Test Seat Hold Flow End-to-End
**Status:** Backend complete, needs testing  
**Time:** 15 minutes  
**Priority:** MEDIUM

**What to test:**
1. Hold a seat via API
2. Wait 10 minutes (or set 1 minute for testing)
3. Trigger cron manually
4. Verify seat becomes available
5. Hold the same seat again

**Documentation:** `EPIC_3.2_TEST_GUIDE.md`

---

## 🟢 Nice to Have (Post-Launch)

### 6. Add Seat Selection UI
**Status:** Not started  
**Time:** 2-3 hours  
**Priority:** LOW

**What to build:**
- Diner-facing page to browse dinners
- Seat selection interface
- Hold confirmation UI
- Payment integration

---

### 7. Add Email Notifications
**Status:** Not started  
**Time:** 1-2 hours  
**Priority:** LOW

**What to build:**
- Email when seat hold expires
- Email when reservation confirmed
- Email reminder before dinner

---

### 8. Add Waitlist Feature
**Status:** Not started  
**Time:** 2-3 hours  
**Priority:** LOW

**What to build:**
- Join waitlist when dinner is full
- Notify when seat becomes available
- Auto-hold for waitlist users

---

## 📋 Completed Tasks

- ✅ EPIC 3.1: Dinner/Seat lifecycle schema
- ✅ EPIC 3.2: Seat hold endpoint with concurrency safety
- ✅ EPIC 3.3: Hold expiry mechanism (code complete)
- ✅ Admin portal with role-based access
- ✅ Restaurant onboarding and profile editing
- ✅ Media upload system (needs CORS fix)
- ✅ Admin dinners dashboard
- ✅ Restaurant verification workflow
- ✅ Audit logging for all admin actions

---

## 🚀 Quick Start Checklist (Before First User)

- [ ] Setup GitHub Actions cron (5 min) - **CRITICAL**
- [ ] Fix R2 CORS for image uploads (5 min) - **CRITICAL**
- [ ] Generate production CRON_SECRET (2 min)
- [ ] Test seat hold → expire → rebook flow (15 min)
- [ ] Test admin dinners page (10 min)
- [ ] Verify all analytics events are firing (10 min)

**Total time: ~47 minutes**

---

## 📝 Notes

### Cron Job Alternatives
If GitHub Actions doesn't work for you:
- Cron-job.org (free, 3 min setup)
- EasyCron (free, 3 min setup)
- Vercel Cron ($20/month, 2 min setup)

See `FREE_CRON_SETUP.md` for details.

### Environment Variables Checklist
Make sure these are set in production:
- [ ] `DATABASE_URL`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CRON_SECRET` (generate new for production)
- [ ] `R2_ENDPOINT`
- [ ] `R2_ACCESS_KEY_ID`
- [ ] `R2_SECRET_ACCESS_KEY`
- [ ] `R2_BUCKET`
- [ ] `R2_PUBLIC_URL`

### Testing Checklist
Before launch:
- [ ] Sign up as new user
- [ ] Create restaurant profile
- [ ] Upload hero image
- [ ] Upload gallery images
- [ ] Create a dinner
- [ ] Hold a seat (via API)
- [ ] Wait for expiration
- [ ] Verify seat becomes available
- [ ] Mark dinner as LIVE
- [ ] Mark dinner as COMPLETED
- [ ] Cancel a dinner
- [ ] Check audit logs

---

## 🆘 Need Help?

**Cron setup:** See `GITHUB_ACTIONS_SETUP.md`  
**CORS fix:** See `R2_CORS_FIX.md`  
**Seat testing:** See `EPIC_3.2_TEST_GUIDE.md`  
**General issues:** See `TROUBLESHOOTING.md`

---

**Last Updated:** March 1, 2026  
**Next Review:** Before production deployment
