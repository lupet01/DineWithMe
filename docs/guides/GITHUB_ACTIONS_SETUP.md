# GitHub Actions Cron Setup (Free)

## Quick Setup (5 minutes)

### 1. Workflow File Already Created ✅

The file `.github/workflows/expire-holds.yml` is already in your repository.

### 2. Add Secrets to GitHub

1. **Go to your GitHub repository**

2. **Navigate to Settings:**
   - Click "Settings" tab
   - Click "Secrets and variables" in left sidebar
   - Click "Actions"

3. **Add APP_URL secret:**
   - Click "New repository secret"
   - Name: `APP_URL`
   - Value: Your deployed app URL
     - Example: `https://dinewithme.vercel.app`
     - Or: `https://your-custom-domain.com`
   - Click "Add secret"

4. **Add CRON_SECRET secret:**
   - Click "New repository secret"
   - Name: `CRON_SECRET`
   - Value: Same value as in your `.env` file
     - Default dev value: `dev-secret-token-change-in-production`
     - Production: Generate with `openssl rand -base64 32`
   - Click "Add secret"

### 3. Commit and Push

```bash
# Add the workflow file
git add .github/workflows/expire-holds.yml

# Commit
git commit -m "Add GitHub Actions cron for seat expiration"

# Push to GitHub
git push origin main
```

### 4. Verify It's Working

1. **Go to Actions tab:**
   - Click "Actions" tab in your repository
   - You should see "Expire Seat Holds" workflow

2. **Manual trigger (optional):**
   - Click on "Expire Seat Holds"
   - Click "Run workflow" button
   - Click green "Run workflow" button
   - Wait a few seconds and refresh

3. **Check execution:**
   - Click on the running/completed workflow
   - Click on "expire-holds" job
   - You should see logs showing the cron execution

4. **Verify in database:**
   ```sql
   -- Check for expired seats (should be 0 if working)
   SELECT COUNT(*) FROM seats 
   WHERE status = 'HELD' AND "holdExpiresAt" <= NOW();
   ```

## What Happens Now?

- ✅ Cron runs **every minute** automatically
- ✅ Expires any held seats past their expiration time
- ✅ Logs are visible in GitHub Actions tab
- ✅ You can manually trigger anytime from GitHub UI
- ✅ Email notifications on failure (if enabled)

## Monitoring

### View Execution History

1. Go to: Repository → Actions → Expire Seat Holds
2. See all past executions with timestamps
3. Click any execution to see detailed logs

### Enable Email Notifications

1. Go to: Repository → Settings → Notifications
2. Under "Actions", check "Email"
3. You'll get emails when workflow fails

### Add Status Badge to README

Add this to your `README.md`:

```markdown
![Cron Status](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/expire-holds.yml/badge.svg)
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your values.

## Troubleshooting

### Issue: Workflow not running

**Check:**
1. Is the workflow file committed and pushed?
2. Are secrets set correctly in GitHub?
3. Is the repository public or private? (Both work, but check Actions tab)

**Solution:**
- Go to Actions tab
- Click "Expire Seat Holds"
- Click "Run workflow" to trigger manually
- Check logs for errors

### Issue: 401 Unauthorized

**Cause:** CRON_SECRET mismatch

**Solution:**
1. Check secret value in GitHub matches your `.env`
2. Regenerate token if needed:
   ```bash
   openssl rand -base64 32
   ```
3. Update in both places:
   - GitHub repository secrets
   - Vercel environment variables (or your hosting)

### Issue: Can't find Actions tab

**Solution:**
- Actions may be disabled for your repository
- Go to: Settings → Actions → General
- Enable "Allow all actions and reusable workflows"

## Cost

**GitHub Actions Free Tier:**
- Private repos: 2,000 minutes/month
- Public repos: Unlimited
- Our cron uses ~1 second per run
- 1 minute × 60 minutes × 24 hours × 30 days = 43,200 runs/month
- Total time: ~43,200 seconds = ~720 minutes/month
- **Well within free tier!** ✅

**Savings vs Vercel Cron:**
- Vercel Pro: $20/month = $240/year
- GitHub Actions: $0/month = $0/year
- **You save $240/year!** 💰

## Advanced Configuration

### Change Frequency

Edit `.github/workflows/expire-holds.yml`:

```yaml
on:
  schedule:
    # Every 5 minutes
    - cron: '*/5 * * * *'
    
    # Every hour
    - cron: '0 * * * *'
    
    # Every 30 minutes
    - cron: '*/30 * * * *'
```

### Add Slack Notifications

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Seat expiration cron failed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Discord Notifications

```yaml
- name: Notify Discord on failure
  if: failure()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: "Cron Job Failed"
    description: "Seat expiration cron encountered an error"
```

## Comparison with Other Free Options

| Feature | GitHub Actions | Cron-job.org | Vercel Cron |
|---------|---------------|--------------|-------------|
| Cost | Free | Free | $20/month |
| Setup Time | 5 min | 3 min | 2 min |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Monitoring | Built-in | Dashboard | Dashboard |
| Manual Trigger | Yes | Yes | Yes |
| Email Alerts | Yes | Yes | Yes |
| Version Control | Yes | No | Yes |
| External Dependency | No | Yes | No |

**Winner: GitHub Actions** ✅

## Next Steps

1. ✅ Secrets added to GitHub
2. ✅ Workflow committed and pushed
3. ✅ Verified it's running in Actions tab
4. ✅ Checked database for expired seats
5. ✅ Enabled email notifications (optional)
6. ✅ Added status badge to README (optional)

**You're all set!** Your seat holds will now expire automatically every minute, completely free. 🎉

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review workflow logs in Actions tab
3. Test the endpoint manually:
   ```bash
   curl "https://your-app.vercel.app/api/cron/expire-holds?token=YOUR_SECRET"
   ```
4. Check `docs/jobs.md` for detailed documentation
