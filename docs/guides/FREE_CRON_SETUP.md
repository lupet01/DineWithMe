# Free Cron Setup Guide

## Overview

Vercel Cron requires a Pro plan ($20/month). Here are completely free alternatives that work just as well.

## Recommended: GitHub Actions (100% Free)

GitHub Actions provides 2,000 free minutes per month for private repos (unlimited for public repos). Perfect for running cron jobs.

### Setup (5 minutes)

1. **Create workflow file:**

Create `.github/workflows/expire-holds.yml`:

```yaml
name: Expire Seat Holds

on:
  schedule:
    # Runs every minute
    - cron: '* * * * *'
  
  # Allow manual trigger from GitHub UI
  workflow_dispatch:

jobs:
  expire-holds:
    runs-on: ubuntu-latest
    
    steps:
      - name: Expire held seats
        run: |
          curl -f "${{ secrets.APP_URL }}/api/cron/expire-holds?token=${{ secrets.CRON_SECRET }}" || exit 1
      
      - name: Log result
        if: always()
        run: echo "Cron job completed at $(date)"
```

2. **Add secrets to GitHub:**

Go to: Repository → Settings → Secrets and variables → Actions → New repository secret

Add two secrets:
- `APP_URL`: Your deployed app URL (e.g., `https://your-app.vercel.app`)
- `CRON_SECRET`: Your cron secret token

3. **Commit and push:**

```bash
git add .github/workflows/expire-holds.yml
git commit -m "Add GitHub Actions cron for seat expiration"
git push origin main
```

4. **Verify it's running:**

Go to: Repository → Actions → Expire Seat Holds

You should see it running every minute.

### Pros:
- ✅ Completely free
- ✅ Reliable (GitHub infrastructure)
- ✅ Easy to monitor (Actions tab)
- ✅ Manual trigger available
- ✅ Logs included
- ✅ No external service needed

### Cons:
- ⚠️ Minimum interval is 1 minute (same as Vercel)
- ⚠️ May have 1-2 minute delay in execution
- ⚠️ Requires GitHub repository

## Alternative 1: Cron-job.org (Free Forever)

Free service specifically for HTTP cron jobs. No credit card required.

### Setup (3 minutes)

1. **Sign up:** https://cron-job.org/en/signup/

2. **Create cron job:**
   - Click "Create cronjob"
   - Title: "Expire Seat Holds"
   - URL: `https://your-app.vercel.app/api/cron/expire-holds?token=YOUR_SECRET`
   - Schedule: Every 1 minute
   - Method: GET
   - Save

3. **Enable notifications (optional):**
   - Email on failure
   - Webhook on failure

### Pros:
- ✅ Completely free
- ✅ Very simple setup
- ✅ Reliable
- ✅ Email notifications
- ✅ Execution history

### Cons:
- ⚠️ External service dependency
- ⚠️ Free tier has some limits (usually sufficient)

## Alternative 2: EasyCron (Free Tier)

Similar to cron-job.org with a generous free tier.

### Setup

1. **Sign up:** https://www.easycron.com/user/register

2. **Create cron job:**
   - URL: `https://your-app.vercel.app/api/cron/expire-holds?token=YOUR_SECRET`
   - Cron Expression: `* * * * *` (every minute)
   - HTTP Method: GET

3. **Save and enable**

### Free Tier Limits:
- Up to 1 cron job
- Runs every minute
- Email notifications

## Alternative 3: UptimeRobot (Creative Solution)

UptimeRobot is a free uptime monitoring service, but we can use it as a cron job.

### Setup

1. **Sign up:** https://uptimerobot.com/signUp

2. **Create monitor:**
   - Monitor Type: HTTP(s)
   - Friendly Name: "Expire Seat Holds"
   - URL: `https://your-app.vercel.app/api/cron/expire-holds?token=YOUR_SECRET`
   - Monitoring Interval: 1 minute (free tier allows 5 minutes)

3. **Save**

### Pros:
- ✅ Free forever
- ✅ Also monitors your app uptime
- ✅ Email alerts

### Cons:
- ⚠️ Minimum interval is 5 minutes (not 1 minute)
- ⚠️ Not designed for cron jobs

## Alternative 4: Render Cron Jobs (Free)

If you deploy to Render instead of Vercel, they offer free cron jobs.

### Setup

1. **Deploy to Render** (free tier available)

2. **Add cron job in render.yaml:**

```yaml
services:
  - type: web
    name: dinewithme
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    
  - type: cron
    name: expire-holds
    env: node
    schedule: "* * * * *"
    buildCommand: npm install
    startCommand: curl "$APP_URL/api/cron/expire-holds?token=$CRON_SECRET"
```

## Alternative 5: Cloudflare Workers (Free Tier)

Cloudflare Workers has a generous free tier with cron triggers.

### Setup

1. **Create worker:**

```javascript
export default {
  async scheduled(event, env, ctx) {
    const response = await fetch(
      `${env.APP_URL}/api/cron/expire-holds?token=${env.CRON_SECRET}`
    );
    console.log('Cron executed:', await response.text());
  },
};
```

2. **Add cron trigger in wrangler.toml:**

```toml
[triggers]
crons = ["* * * * *"]
```

3. **Deploy:**

```bash
npx wrangler deploy
```

### Free Tier:
- 100,000 requests per day
- More than enough for 1-minute cron

## Comparison Table

| Service | Cost | Interval | Reliability | Setup Time |
|---------|------|----------|-------------|------------|
| **GitHub Actions** | Free | 1 min | ⭐⭐⭐⭐⭐ | 5 min |
| **Cron-job.org** | Free | 1 min | ⭐⭐⭐⭐ | 3 min |
| **EasyCron** | Free | 1 min | ⭐⭐⭐⭐ | 3 min |
| **UptimeRobot** | Free | 5 min | ⭐⭐⭐ | 3 min |
| **Render** | Free | 1 min | ⭐⭐⭐⭐ | 10 min |
| **Cloudflare Workers** | Free | 1 min | ⭐⭐⭐⭐⭐ | 10 min |
| Vercel Cron | $20/mo | 1 min | ⭐⭐⭐⭐⭐ | 2 min |

## Recommended Setup: GitHub Actions

For most projects, GitHub Actions is the best free option:

1. **No external dependencies** - Everything in your repo
2. **Reliable** - GitHub's infrastructure
3. **Easy to monitor** - Actions tab shows all runs
4. **Version controlled** - Workflow is in git
5. **Manual trigger** - Can run on-demand from UI

## Testing Your Setup

After setting up any cron service:

1. **Wait 1-2 minutes** for first execution

2. **Check logs:**
   - GitHub Actions: Repository → Actions tab
   - Cron-job.org: Dashboard → Execution history
   - Your app logs: Check for cron execution logs

3. **Verify in database:**
   ```sql
   -- Check for expired seats
   SELECT COUNT(*) FROM seats WHERE status = 'HELD' AND "holdExpiresAt" <= NOW();
   
   -- Should be 0 if cron is working
   ```

4. **Check analytics:**
   ```sql
   SELECT COUNT(*) FROM audit_logs 
   WHERE "actionType" = 'seat_hold_expired' 
   AND "createdAt" >= NOW() - INTERVAL '1 hour';
   ```

## Monitoring

### GitHub Actions Monitoring

1. **Enable email notifications:**
   - Repository → Settings → Notifications
   - Check "Actions" under "Email notifications"

2. **Add status badge to README:**
   ```markdown
   ![Cron Status](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/expire-holds.yml/badge.svg)
   ```

3. **Set up alerts:**
   - Use GitHub Actions marketplace actions for Slack/Discord notifications
   - Example: `8398a7/action-slack@v3`

### External Service Monitoring

Most services (cron-job.org, EasyCron) provide:
- Email notifications on failure
- Execution history
- Success/failure statistics

## Troubleshooting

### Issue: Cron not running

**GitHub Actions:**
- Check Actions tab for errors
- Verify secrets are set correctly
- Check workflow file syntax

**External services:**
- Verify URL is correct
- Check token is valid
- Test URL manually with curl

### Issue: 401 Unauthorized

**Solution:**
- Verify `CRON_SECRET` matches in:
  - Your .env file
  - GitHub secrets / external service
  - Vercel environment variables

### Issue: Cron runs but seats don't expire

**Solution:**
- Check app logs for errors
- Verify database connection
- Test endpoint manually
- Check seat expiration times in database

## Cost Comparison

| Solution | Monthly Cost | Annual Cost |
|----------|--------------|-------------|
| GitHub Actions | $0 | $0 |
| Cron-job.org | $0 | $0 |
| EasyCron | $0 | $0 |
| UptimeRobot | $0 | $0 |
| Render | $0 | $0 |
| Cloudflare Workers | $0 | $0 |
| **Vercel Cron** | **$20** | **$240** |

**Savings: $240/year** by using free alternatives!

## Recommendation

**For production:** Use GitHub Actions
- Most reliable
- No external dependencies
- Easy to monitor
- Version controlled

**For quick testing:** Use Cron-job.org
- Fastest setup
- No code changes needed
- Good for prototyping

## Next Steps

1. Choose a free cron service (recommend GitHub Actions)
2. Follow setup instructions above
3. Test with manual trigger
4. Monitor for 24 hours to ensure reliability
5. Set up failure notifications

You're now running cron jobs for free! 🎉
