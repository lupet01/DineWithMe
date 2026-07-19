# Windows Task Scheduler Setup (Local Development)

## Overview

Use Windows Task Scheduler to automatically run the cron job every minute on your local machine. No deployment needed!

## Setup (5 minutes)

### Step 1: Create the Task

1. **Open Task Scheduler:**
   - Press `Win + R`
   - Type `taskschd.msc`
   - Press Enter

2. **Create Basic Task:**
   - Click "Create Basic Task..." in right panel
   - Name: `Expire Seat Holds`
   - Description: `Automatically expire held seats every minute`
   - Click "Next"

3. **Trigger:**
   - Select "Daily"
   - Click "Next"
   - Start: Today's date
   - Recur every: 1 days
   - Click "Next"

4. **Action:**
   - Select "Start a program"
   - Click "Next"
   - Program/script: `powershell.exe`
   - Add arguments: `-ExecutionPolicy Bypass -File "C:\Users\PTRLUT005\OneDrive - University of Cape Town\Desktop\DineWithMe\expire-holds-now.ps1"`
   - (Replace path with your actual project path)
   - Click "Next"

5. **Finish:**
   - Check "Open the Properties dialog..."
   - Click "Finish"

### Step 2: Configure Advanced Settings

In the Properties dialog that opens:

1. **General tab:**
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"

2. **Triggers tab:**
   - Double-click the trigger
   - Check "Repeat task every: 1 minute"
   - For a duration of: Indefinitely
   - Check "Enabled"
   - Click "OK"

3. **Conditions tab:**
   - Uncheck "Start the task only if the computer is on AC power"
   - Uncheck "Stop if the computer switches to battery power"

4. **Settings tab:**
   - Check "Allow task to be run on demand"
   - Check "Run task as soon as possible after a scheduled start is missed"
   - If the task is already running: "Do not start a new instance"

5. **Click "OK"** to save

### Step 3: Test It

1. **Right-click the task** in Task Scheduler
2. **Click "Run"**
3. **Check the result:**
   - Last Run Result should show "The operation completed successfully (0x0)"
   - Check your database for expired seats

## Verify It's Working

### Check Task History

1. In Task Scheduler, select your task
2. Click "History" tab at bottom
3. You should see executions every minute

### Check Database

```sql
-- Should be 0 if working
SELECT COUNT(*) FROM seats 
WHERE status = 'HELD' AND "holdExpiresAt" <= NOW();
```

### Check Logs

The PowerShell script outputs to console, but Task Scheduler doesn't show this. To see logs:

1. Modify `expire-holds-now.ps1` to write to a log file:

```powershell
# Add at the top
$logFile = "C:\Users\PTRLUT005\OneDrive - University of Cape Town\Desktop\DineWithMe\cron.log"

# Add after success
Add-Content -Path $logFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Expired $($result.data.expiredCount) seats"
```

2. Check `cron.log` file for execution history

## Pros & Cons

### Pros:
- ✅ Completely free
- ✅ No deployment needed
- ✅ Works on local machine
- ✅ Runs even when browser is closed
- ✅ Built into Windows

### Cons:
- ⚠️ Only works when your computer is on
- ⚠️ Only works on your machine (not for production)
- ⚠️ Requires dev server to be running

## When to Use

**Use Windows Task Scheduler when:**
- You're developing locally
- You want to test the cron functionality
- You're not ready to deploy yet
- You want automatic expiration during development

**Don't use for production:**
- Your computer needs to be on 24/7
- Dev server needs to be running 24/7
- Not reliable for production use

## Alternative: Just Run Manually

If you don't want Task Scheduler, just run the script manually when needed:

```powershell
.\expire-holds-now.ps1
```

This is fine for development since:
- Holds last 10 minutes
- You can expire them manually when testing
- Not critical during development

## Disable Task Scheduler

When you're done testing:

1. Open Task Scheduler
2. Find "Expire Seat Holds" task
3. Right-click → Disable
4. Or right-click → Delete

## Production Setup

When you're ready for production, use one of these instead:
- GitHub Actions (free, see `GITHUB_ACTIONS_SETUP.md`)
- Cron-job.org (free, see `FREE_CRON_SETUP.md`)
- Vercel Cron ($20/month)

## Troubleshooting

### Task shows "Running" but nothing happens

**Solution:**
- Check dev server is running
- Check the path in Task Scheduler is correct
- Run the script manually first to test

### "Access Denied" error

**Solution:**
- Run Task Scheduler as Administrator
- Check "Run with highest privileges" in task properties

### Script runs but seats don't expire

**Solution:**
- Check database connection
- Verify CRON_SECRET in .env matches script
- Test endpoint manually with curl

## Summary

For local development:
1. Use `expire-holds-now.ps1` to manually expire holds
2. Or set up Task Scheduler for automatic expiration
3. When ready for production, switch to GitHub Actions or other service

**Recommendation:** Just use the manual script for now. Set up proper cron when you deploy.
