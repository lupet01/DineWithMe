# Restaurant Approval System - Setup Guide

## Quick Setup

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or install specific package
cd packages/email && npm install
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Email Service (Optional in development)
RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
EMAIL_FROM="DineWithMe <noreply@dinewithme.co>"

# Application URL (for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Sign Up for Resend (Optional for Development)

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Verify your domain (or use test mode)
4. Copy API key from dashboard
5. Add to `.env` file

**Note**: Email service is optional in development. The approval system will work without it, but emails won't be sent.

### 4. Test the System

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to admin dashboard:
   ```
   http://localhost:3001/admin/ops/restaurants
   ```

3. Create a test restaurant (if needed):
   ```bash
   # Use the restaurant creation form or seed script
   ```

4. Click "Pending Approvals" to see pending restaurants

5. Click "Approve" on a restaurant

6. Check for success toast notification

7. Verify email was sent (if configured)

## Troubleshooting

### Email Module Not Found

If you see: `Cannot find module '@dinewithme/email'`

**Solution**:
```bash
# Install dependencies
npm install

# Or rebuild workspace
npm run clean
npm install
```

### Email Not Sending

If emails aren't being sent:

1. **Check Environment Variable**:
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Check Console Logs**:
   - Look for "Email service not configured" warning
   - This is normal in development without Resend

3. **Verify Resend API Key**:
   - Log in to Resend dashboard
   - Check API key is correct
   - Ensure domain is verified

### Approval Not Working

If approval button doesn't work:

1. **Check User Role**:
   - Only PLATFORM_ADMIN can approve
   - Check your user role in database

2. **Check Console for Errors**:
   - Open browser dev tools
   - Look for error messages

3. **Check Server Logs**:
   - Look for error messages in terminal

## Development Without Email

You can develop and test the approval system without configuring email:

1. Don't set `RESEND_API_KEY` in `.env`
2. Approval will work normally
3. Console will show: "Email service not configured. Skipping restaurant approval email."
4. No errors will be thrown
5. All other features work normally

## Production Setup

For production deployment:

1. **Required Environment Variables**:
   ```bash
   RESEND_API_KEY="re_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   EMAIL_FROM="DineWithMe <noreply@yourdomain.com>"
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

2. **Verify Domain in Resend**:
   - Add DNS records
   - Wait for verification
   - Test email sending

3. **Test Email Delivery**:
   - Approve a test restaurant
   - Check email arrives
   - Verify links work
   - Check spam folder

## Features Available

### Without Email Configuration
- ✅ One-click approval
- ✅ Status updates
- ✅ Audit logging
- ✅ Analytics tracking
- ✅ UI updates
- ✅ Toast notifications
- ❌ Email notifications

### With Email Configuration
- ✅ All features above
- ✅ Email notifications
- ✅ Professional communication
- ✅ Dashboard links
- ✅ Next steps guidance

## Next Steps

After setup:

1. Test the approval flow
2. Configure email service (optional)
3. Customize email templates (optional)
4. Set up monitoring (optional)
5. Train admin users

## Support

If you encounter issues:

1. Check this setup guide
2. Review error messages
3. Check environment variables
4. Verify dependencies installed
5. Check user permissions
