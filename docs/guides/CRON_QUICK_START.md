# Cron Quick Start

## For Development (Right Now)

### Just run this script when you want to expire holds:

```powershell
.\expire-holds-now.ps1
```

That's it! No setup, no deployment, no configuration needed.

**When to run it:**
- After testing seat holds
- Before testing if seats become available again
- Whenever you see held seats in the database

**Check if there are expired holds:**
```sql
SELECT COUNT(*) FROM seats 
WHERE status = 'HELD' AND "holdExpiresAt" <= NOW();
```

---

## For Production (Later)

When you deploy, choose one:

### Option 1: GitHub Actions (Free) ⭐
- See: `GITHUB_ACTIONS_SETUP.md`
- Time: 5 minutes
- Cost: $0

### Option 2: Cron-job.org (Free)
- See: `FREE_CRON_SETUP.md`
- Time: 3 minutes
- Cost: $0

### Option 3: Vercel Cron
- See: `EPIC_3.3_COMPLETE.md`
- Time: 2 minutes
- Cost: $20/month

---

## That's All You Need to Know!

For now, just use `.\expire-holds-now.ps1` when testing.

Set up automatic cron when you're ready to deploy.
