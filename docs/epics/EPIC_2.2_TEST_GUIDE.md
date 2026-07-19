# EPIC 2.2: Test Guide

## Prerequisites

1. Database is running with users table
2. Dev server is running: `npm run dev`
3. You have a user account synced to the database

## Test 1: Access Control

### Test 1.1: DINER Role (Should Be Denied)

1. Sign in as a user with DINER role
2. Navigate to: `http://localhost:3001/admin`
3. **Expected**: Redirected to `/app/unauthorized`
4. **Verify**: Cannot access admin portal

### Test 1.2: RESTAURANT_ADMIN Role (Should Work)

1. Update your user role to RESTAURANT_ADMIN:
   ```sql
   UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'your@email.com';
   ```
2. Navigate to: `http://localhost:3001/admin`
3. **Expected**: See admin dashboard
4. **Verify**: Full access to admin portal

### Test 1.3: PLATFORM_ADMIN Role (Should Work)

1. Update your user role to PLATFORM_ADMIN:
   ```sql
   UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'your@email.com';
   ```
2. Navigate to: `http://localhost:3001/admin`
3. **Expected**: See admin dashboard
4. **Verify**: Full access to admin portal

## Test 2: Navigation

### Test 2.1: Sidebar Navigation

1. Access admin portal as RESTAURANT_ADMIN
2. Click "Dashboard" in sidebar
   - **Expected**: Navigate to `/admin`
   - **Verify**: Dashboard page loads
   - **Verify**: "Dashboard" is highlighted in black
3. Click "Restaurant Profile" in sidebar
   - **Expected**: Navigate to `/admin/restaurant`
   - **Verify**: Restaurant page loads
   - **Verify**: "Restaurant Profile" is highlighted
4. Click "Dinners" in sidebar
   - **Expected**: Navigate to `/admin/dinners`
   - **Verify**: Dinners page loads
   - **Verify**: "Dinners" is highlighted

### Test 2.2: Direct URL Access

1. Navigate directly to: `http://localhost:3001/admin/restaurant`
   - **Expected**: Restaurant page loads
   - **Verify**: Layout and sidebar present
2. Navigate directly to: `http://localhost:3001/admin/dinners`
   - **Expected**: Dinners page loads
   - **Verify**: Layout and sidebar present

## Test 3: Visual Design

### Test 3.1: Layout Structure

1. Access admin portal
2. **Verify Header**:
   - DineWithMe logo with "Admin" badge visible
   - Restaurant switcher button present
   - "Restaurant Admin" text visible
3. **Verify Sidebar**:
   - Three navigation items visible
   - Icons displayed correctly
   - Clean white background
4. **Verify Content Area**:
   - Light gray background
   - Content centered with max-width
   - Proper padding and spacing

### Test 3.2: Hover States

1. Hover over sidebar items
   - **Expected**: Light gray background on hover
   - **Verify**: Smooth transition
2. Hover over restaurant switcher
   - **Expected**: Light gray background
   - **Verify**: Smooth transition
3. Hover over buttons
   - **Expected**: Darker background
   - **Verify**: Smooth transition

### Test 3.3: Active States

1. Navigate to each page
2. **Verify**: Active page has black background in sidebar
3. **Verify**: White text for active item
4. **Verify**: Other items remain gray

## Test 4: Dashboard Page

### Test 4.1: Page Header

1. Navigate to `/admin`
2. **Verify**: "Dashboard" title visible
3. **Verify**: Welcome message with user name
4. **Verify**: Proper spacing and typography

### Test 4.2: Stats Grid

1. Check stats cards
2. **Verify**: Three cards displayed
   - Total Dinners: 0
   - Active Seats: 0
   - Total Guests: 0
3. **Verify**: Cards have white background
4. **Verify**: Proper spacing between cards

### Test 4.3: Quick Actions

1. Check quick actions section
2. **Verify**: Two action cards visible
   - Create Dinner
   - Update Restaurant
3. **Verify**: Icons displayed
4. **Verify**: Hover states work

### Test 4.4: Recent Activity

1. Check recent activity section
2. **Verify**: Empty state displayed
3. **Verify**: "No recent activity" message
4. **Verify**: Chart icon visible

## Test 5: Restaurant Profile Page

### Test 5.1: Page Header

1. Navigate to `/admin/restaurant`
2. **Verify**: "Restaurant Profile" title
3. **Verify**: Description text
4. **Verify**: "Edit Profile" button

### Test 5.2: Basic Information

1. Check basic info section
2. **Verify**: Hero image placeholder
3. **Verify**: All fields show "Not set"
   - Restaurant Name
   - Cuisine Type
   - City
   - Phone
   - Description
   - Address

### Test 5.3: Location Section

1. Check location section
2. **Verify**: Map placeholder visible
3. **Verify**: Location icon and message

### Test 5.4: Contact Information

1. Check contact section
2. **Verify**: Website field shows "Not set"
3. **Verify**: Phone field shows "Not set"

## Test 6: Dinners Page

### Test 6.1: Page Header

1. Navigate to `/admin/dinners`
2. **Verify**: "Dinners" title
3. **Verify**: Description text
4. **Verify**: "Create Dinner" button

### Test 6.2: Filters

1. Check filter section
2. **Verify**: Search input visible (disabled)
3. **Verify**: Status dropdown visible (disabled)
4. **Verify**: Proper styling

### Test 6.3: Empty State

1. Check dinners list
2. **Verify**: Empty state displayed
3. **Verify**: Fork/knife icon visible
4. **Verify**: "No dinners yet" message
5. **Verify**: "Create Your First Dinner" button

### Test 6.4: Stats Cards

1. Check stats section
2. **Verify**: Three cards displayed
   - Upcoming: 0
   - Total Guests: 0
   - Completed: 0
3. **Verify**: Icons displayed
4. **Verify**: Proper spacing

## Test 7: Responsive Design

### Test 7.1: Desktop (1920px)

1. View at full desktop width
2. **Verify**: All elements properly spaced
3. **Verify**: Grid layouts use full width
4. **Verify**: No horizontal scroll

### Test 7.2: Laptop (1366px)

1. Resize to laptop width
2. **Verify**: Layout remains intact
3. **Verify**: Sidebar visible
4. **Verify**: Content readable

### Test 7.3: Tablet (768px)

1. Resize to tablet width
2. **Verify**: Grid layouts stack properly
3. **Verify**: Sidebar may need adjustment (future work)
4. **Verify**: Content remains accessible

### Test 7.4: Mobile (375px)

1. Resize to mobile width
2. **Verify**: Content stacks vertically
3. **Verify**: Text remains readable
4. **Note**: Mobile sidebar needs future work

## Test 8: Performance

### Test 8.1: Initial Load

1. Clear cache and reload
2. **Verify**: Page loads quickly
3. **Verify**: No layout shift
4. **Verify**: Smooth rendering

### Test 8.2: Navigation Speed

1. Click between pages rapidly
2. **Verify**: Instant navigation
3. **Verify**: No loading states needed
4. **Verify**: Smooth transitions

## Test 9: Browser Compatibility

### Test 9.1: Chrome

1. Open in Chrome
2. **Verify**: All features work
3. **Verify**: Styling correct

### Test 9.2: Firefox

1. Open in Firefox
2. **Verify**: All features work
3. **Verify**: Styling correct

### Test 9.3: Safari

1. Open in Safari
2. **Verify**: All features work
3. **Verify**: Styling correct

### Test 9.4: Edge

1. Open in Edge
2. **Verify**: All features work
3. **Verify**: Styling correct

## Test 10: Error Handling

### Test 10.1: Unauthorized Access

1. Sign out
2. Navigate to `/admin`
3. **Expected**: Redirected to sign-in
4. **Verify**: Cannot access without auth

### Test 10.2: Invalid Routes

1. Navigate to `/admin/invalid-page`
2. **Expected**: 404 page
3. **Verify**: Proper error handling

## Quick Test Checklist

Use this for rapid testing:

- [ ] Access control works (DINER denied, ADMIN allowed)
- [ ] All three pages load correctly
- [ ] Sidebar navigation works
- [ ] Active states highlight correctly
- [ ] Hover states work smoothly
- [ ] All empty states display properly
- [ ] Layout is clean and minimal
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Responsive on different screen sizes

## Common Issues

### Issue: Redirected to unauthorized
**Solution**: Check user role in database, must be RESTAURANT_ADMIN or PLATFORM_ADMIN

### Issue: Sidebar not highlighting
**Solution**: Check pathname matching in admin-sidebar.tsx

### Issue: Icons not showing
**Solution**: Verify lucide-react is installed

### Issue: Styles not applying
**Solution**: Check Tailwind CSS is configured correctly

## SQL Helper Commands

```sql
-- Check your user role
SELECT email, role FROM users WHERE email = 'your@email.com';

-- Update to RESTAURANT_ADMIN
UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'your@email.com';

-- Update to PLATFORM_ADMIN
UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'your@email.com';

-- Reset to DINER
UPDATE users SET role = 'DINER' WHERE email = 'your@email.com';
```

## Success Criteria

All tests pass when:
- ✅ Access control enforced correctly
- ✅ All pages load without errors
- ✅ Navigation works smoothly
- ✅ Visual design matches Apple-native aesthetic
- ✅ Empty states display properly
- ✅ No TypeScript or console errors
- ✅ Responsive on multiple screen sizes
- ✅ Performance is fast and smooth
