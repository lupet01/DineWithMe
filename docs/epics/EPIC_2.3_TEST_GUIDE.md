# EPIC 2.3: Test Guide

## Prerequisites

1. Database running with migrations applied
2. Dev server running: `npm run dev`
3. User account with RESTAURANT_ADMIN role
4. No existing restaurant for onboarding tests

## Test 1: Onboarding Flow (Create Restaurant)

### Test 1.1: Access Onboarding Page

1. Sign in as RESTAURANT_ADMIN
2. Navigate to: `http://localhost:3001/admin/restaurant`
3. **Expected**: See onboarding view
   - Welcome emoji (🍽️)
   - "Welcome to DineWithMe" heading
   - Onboarding message
   - Create form

### Test 1.2: Form Validation - Required Fields

1. Leave "Restaurant Name" empty
2. Click "Create Restaurant"
3. **Expected**: Error message "Restaurant name is required"
4. **Verify**: Form not submitted
5. **Verify**: Error displayed below name field

### Test 1.3: Form Validation - Invalid URL

1. Fill in restaurant name: "Test Restaurant"
2. Fill in website: "not-a-url"
3. Click "Create Restaurant"
4. **Expected**: Error message "Invalid website URL"
5. **Verify**: Error displayed below website field

### Test 1.4: Successful Restaurant Creation

1. Fill in form:
   - Name: "Test Restaurant"
   - Description: "A test restaurant for EPIC 2.3"
   - Cuisine: "International"
   - City: "Cape Town"
   - Address: "123 Test Street"
   - Phone: "+27 21 123 4567"
   - Website: "https://test-restaurant.com"
2. Click "Create Restaurant"
3. **Expected**: 
   - Button shows "Saving..."
   - Form submits successfully
   - Page refreshes
   - Now shows edit form with data
4. **Verify**: Restaurant created in database
5. **Verify**: RestaurantMember created with OWNER role

### Test 1.5: Verify Database Records

```sql
-- Check restaurant
SELECT * FROM restaurants WHERE name = 'Test Restaurant';

-- Check restaurant member
SELECT rm.*, u.email 
FROM restaurant_members rm
JOIN users u ON rm."userId" = u.id
WHERE rm.role = 'OWNER';
```

**Expected**: 
- Restaurant record exists
- RestaurantMember record exists with OWNER role
- User is linked correctly

### Test 1.6: Verify Analytics Event

1. Check analytics dashboard (PostHog)
2. Look for `restaurant_created` event
3. **Verify** event properties:
   - restaurantId
   - restaurantName: "Test Restaurant"
   - userId
   - email
   - timestamp

## Test 2: Edit Flow (Update Restaurant)

### Test 2.1: Access Edit Page

1. Have existing restaurant
2. Navigate to: `http://localhost:3001/admin/restaurant`
3. **Expected**: See edit view
   - "Restaurant Profile" heading
   - Form pre-filled with existing data
   - "Save Changes" button

### Test 2.2: Verify Pre-filled Data

1. Check all form fields
2. **Expected**: All fields show current restaurant data
   - Name matches database
   - Description matches
   - All other fields match

### Test 2.3: Update Single Field

1. Change name to: "Updated Test Restaurant"
2. Click "Save Changes"
3. **Expected**:
   - Button shows "Saving..."
   - Form submits successfully
   - Page refreshes
   - Name updated in form
4. **Verify**: Database updated

### Test 2.4: Update Multiple Fields

1. Update:
   - Description: "Updated description"
   - Cuisine: "French"
   - Phone: "+27 21 999 8888"
2. Click "Save Changes"
3. **Expected**: All fields updated
4. **Verify**: Database reflects changes

### Test 2.5: Clear Optional Field

1. Clear the website field (make it empty)
2. Click "Save Changes"
3. **Expected**: Website saved as null
4. **Verify**: Database shows null for website

### Test 2.6: Verify Analytics Event

1. Check analytics dashboard
2. Look for `restaurant_profile_updated` event
3. **Verify** event properties:
   - restaurantId
   - restaurantName
   - userId
   - fields: array of updated field names
   - timestamp

## Test 3: Validation Edge Cases

### Test 3.1: Empty String Handling

1. Fill in optional fields with spaces only
2. Click "Save Changes"
3. **Expected**: Saved as null in database
4. **Verify**: No validation errors

### Test 3.2: URL Validation - Empty String

1. Leave website empty
2. Click "Save Changes"
3. **Expected**: No validation error
4. **Verify**: Saved successfully

### Test 3.3: URL Validation - Valid URL

1. Enter website: "https://example.com"
2. Click "Save Changes"
3. **Expected**: Saved successfully
4. **Verify**: URL stored correctly

### Test 3.4: URL Validation - Invalid URL

1. Enter website: "htp://invalid"
2. Click "Save Changes"
3. **Expected**: Validation error
4. **Verify**: Form not submitted

## Test 4: Permission Checks

### Test 4.1: Prevent Duplicate Restaurant

1. Have existing restaurant
2. Try to create another via direct action call
3. **Expected**: Error "You already have a restaurant"
4. **Verify**: No duplicate created

### Test 4.2: Owner Verification (Manual Test)

1. Create restaurant as User A
2. Get restaurant ID
3. Try to update as User B (different user)
4. **Expected**: Error "You do not have permission"
5. **Verify**: Restaurant not updated

## Test 5: UI/UX

### Test 5.1: Loading States

1. Fill in form
2. Click submit
3. **Expected**:
   - Button text changes to "Saving..."
   - Button disabled during save
   - Form inputs disabled during save
4. **Verify**: No double-submission possible

### Test 5.2: Error Display

1. Trigger validation error
2. **Expected**:
   - Error alert at top of form
   - Field-specific error below input
   - Red text for errors
   - Warning emoji in alert

### Test 5.3: Error Clearing

1. Trigger field error (e.g., empty name)
2. Start typing in name field
3. **Expected**: Error clears immediately
4. **Verify**: No error shown while typing

### Test 5.4: Cancel Button

1. Fill in form
2. Click "Cancel"
3. **Expected**: Navigate back
4. **Verify**: Changes not saved

## Test 6: Form Behavior

### Test 6.1: Required Field Indicator

1. Check form labels
2. **Expected**: Name field has red asterisk (*)
3. **Verify**: Other fields don't have asterisk

### Test 6.2: Textarea Behavior

1. Type long description (multiple lines)
2. **Expected**: Textarea expands
3. **Verify**: No resize handle (resize-none)

### Test 6.3: Input Focus States

1. Click in each input
2. **Expected**: 
   - Blue ring appears (focus:ring-2)
   - Border color changes
3. **Verify**: Smooth transition

### Test 6.4: Placeholder Text

1. Check empty form
2. **Expected**: All inputs show helpful placeholders
   - Name: "e.g., The Gourmet Kitchen"
   - Description: Long helpful text
   - Cuisine: "e.g., Italian, French, Japanese"
   - etc.

## Test 7: Responsive Design

### Test 7.1: Desktop (1920px)

1. View form at full width
2. **Expected**:
   - Two-column grid for cuisine/city
   - Two-column grid for phone/website
   - Proper spacing

### Test 7.2: Tablet (768px)

1. Resize to tablet width
2. **Expected**:
   - Grid still shows two columns
   - Form remains usable

### Test 7.3: Mobile (375px)

1. Resize to mobile width
2. **Expected**:
   - Single column layout
   - Full-width inputs
   - Readable text

## Test 8: Data Persistence

### Test 8.1: Page Refresh

1. Fill in form (don't submit)
2. Refresh page
3. **Expected**: Form resets to saved data
4. **Verify**: Unsaved changes lost (expected)

### Test 8.2: Navigation Away

1. Fill in form (don't submit)
2. Navigate to different page
3. Return to restaurant page
4. **Expected**: Form shows saved data
5. **Verify**: Unsaved changes lost (expected)

### Test 8.3: Successful Save Persistence

1. Update restaurant
2. Navigate away
3. Return to restaurant page
4. **Expected**: Changes persisted
5. **Verify**: Form shows updated data

## Test 9: Error Scenarios

### Test 9.1: Network Error Simulation

1. Disconnect network
2. Try to submit form
3. **Expected**: Error message displayed
4. **Verify**: User informed of failure

### Test 9.2: Database Error

1. Stop database
2. Try to submit form
3. **Expected**: Error message displayed
4. **Verify**: Graceful error handling

### Test 9.3: Invalid Restaurant ID

1. Try to update non-existent restaurant
2. **Expected**: "Restaurant not found" error
3. **Verify**: Clear error message

## Test 10: Analytics Verification

### Test 10.1: Event Tracking

1. Create restaurant
2. Check analytics:
   ```javascript
   // Should see event
   {
     event: "restaurant_created",
     properties: {
       restaurantId: "...",
       restaurantName: "...",
       userId: "...",
       email: "...",
       timestamp: "..."
     }
   }
   ```

### Test 10.2: Update Tracking

1. Update restaurant (change 3 fields)
2. Check analytics:
   ```javascript
   // Should see event
   {
     event: "restaurant_profile_updated",
     properties: {
       restaurantId: "...",
       restaurantName: "...",
       userId: "...",
       fields: ["name", "description", "cuisine"],
       timestamp: "..."
     }
   }
   ```

## Quick Test Checklist

Use this for rapid testing:

- [ ] Onboarding view shows for new users
- [ ] Create form validates required fields
- [ ] Create form validates URL format
- [ ] Restaurant created successfully
- [ ] RestaurantMember created with OWNER role
- [ ] Edit view shows for existing users
- [ ] Edit form pre-fills with data
- [ ] Update saves successfully
- [ ] Field errors display correctly
- [ ] General errors display in alert
- [ ] Loading states work
- [ ] Cancel button works
- [ ] Analytics events emitted
- [ ] Database records correct
- [ ] Permission checks work
- [ ] Responsive on mobile

## SQL Helper Commands

```sql
-- Check user's restaurant
SELECT r.*, rm.role 
FROM restaurants r
JOIN restaurant_members rm ON r.id = rm."restaurantId"
JOIN users u ON rm."userId" = u.id
WHERE u.email = 'your@email.com';

-- Delete test restaurant
DELETE FROM restaurants WHERE name LIKE 'Test%';

-- Check restaurant members
SELECT rm.*, u.email, r.name
FROM restaurant_members rm
JOIN users u ON rm."userId" = u.id
JOIN restaurants r ON rm."restaurantId" = r.id;

-- Reset for onboarding test
DELETE FROM restaurant_members WHERE "userId" = 'your_user_id';
DELETE FROM restaurants WHERE id = 'your_restaurant_id';
```

## Common Issues

### Issue: "You already have a restaurant"
**Solution**: Delete existing restaurant to test onboarding

### Issue: Form not submitting
**Solution**: Check browser console for errors

### Issue: Validation not working
**Solution**: Verify Zod schema is correct

### Issue: Analytics not tracking
**Solution**: Check PostHog configuration in .env

## Success Criteria

All tests pass when:
- ✅ Onboarding flow works end-to-end
- ✅ Edit flow works end-to-end
- ✅ Validation catches all errors
- ✅ Database records created correctly
- ✅ Analytics events emitted
- ✅ Permission checks enforced
- ✅ UI/UX is smooth and responsive
- ✅ Error handling is graceful
