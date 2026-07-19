# Accessing the New Apple-Native UI

## Quick Start

After the changes I just made, here's how to access the new UI:

### 1. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Navigate to the App

Open your browser and go to:
```
http://localhost:3001
```

If you're signed in, you'll automatically be redirected to `/discover`

### 3. Explore the New UI

You should now see the Apple-native design with:

**Discover Page** (`/discover`)
- Premium dinner cards with hero images
- Theme and date filters
- Seat availability indicators
- Clean, rounded design

**Dinner Detail** (`/dinner/[id]`)
- Full-width hero image
- Restaurant information
- Theme description
- "What to Expect" section
- Sticky bottom CTA

**My Dinners** (`/my-dinners`)
- Tabs: Upcoming / Past
- Dinner cards with status badges
- Cancel booking button
- Empty states

**Profile** (`/profile`)
- User information
- Bottom tab navigation

## What Changed

### 1. Middleware Redirects
- `/app/profile` → `/profile`
- `/app` → `/discover`
- `/dashboard` → `/discover` (for non-admins)

### 2. Root Page
- Signed-in users automatically go to `/discover`
- Signed-out users see landing page

### 3. Admin Portal Still Available
The admin portal is still accessible at:
- `/admin/restaurant` - Restaurant management
- `/admin/dinners` - Dinner management
- `/admin/ops/restaurants` - Operations

## Troubleshooting

### Still Seeing Old UI?

1. **Clear browser cache**:
   - Chrome: Ctrl+Shift+Delete
   - Or use incognito mode

2. **Hard refresh**:
   - Ctrl+Shift+R (Windows)
   - Cmd+Shift+R (Mac)

3. **Check URL**:
   - Make sure you're at `/discover` not `/app` or `/dashboard`

### No Dinners Showing?

Run the seed script:
```bash
npx tsx seed-dinners.ts
```

### Bottom Navigation Not Showing?

Make sure you're on a `/(core)` route:
- `/discover` ✅
- `/my-dinners` ✅
- `/profile` ✅
- `/admin/*` ❌ (different layout)

## URL Structure

```
New User App (Apple-native design):
├── /                    → Redirects to /discover if signed in
├── /discover            → Browse dinners
├── /dinner/[id]         → Dinner details
├── /dinner/[id]/confirm → Confirmation page
├── /my-dinners          → User reservations
└── /profile             → User profile

Admin Portal (Utilitarian design):
├── /admin               → Admin dashboard
├── /admin/restaurant    → Restaurant management
├── /admin/dinners       → Dinner management
└── /admin/ops/*         → Operations

Old Routes (Now Redirected):
├── /app                 → Redirects to /discover
├── /app/profile         → Redirects to /profile
└── /dashboard           → Redirects to /discover
```

## Testing the New UI

### 1. Browse Dinners
- Go to `/discover`
- Use filters (theme, date)
- Click on a dinner card

### 2. View Dinner Details
- See hero image
- Read theme description
- Check seat availability
- Click "Reserve Seat"

### 3. Make a Reservation
- Hold a seat
- Confirm reservation
- See success screen

### 4. View Your Dinners
- Go to `/my-dinners`
- Switch between Upcoming/Past tabs
- Try canceling a booking

### 5. Check Profile
- Go to `/profile`
- See user information
- Use bottom navigation

## Screenshots

The new UI should look like:
- Clean, rounded cards
- Subtle borders and shadows
- Blue accent color (#2563eb)
- Generous spacing
- Bottom tab navigation
- Apple-native feel

## Need Help?

If you're still not seeing the new UI:
1. Check the browser console for errors
2. Verify you're signed in
3. Make sure dev server is running
4. Try a different browser
5. Check that you're on the correct URL

---

**Next Steps**: Once you see the new UI, you can start using the app and testing the features we built in EPICs 4.1-4.7!
