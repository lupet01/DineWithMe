# 🧪 Testing the Booking Flow

**Date**: March 13, 2026  
**Status**: Ready for Testing

---

## ✅ Database Seeded

The database has been populated with test data:
- 3 themes (Tech Innovators, Creative Minds, Entrepreneurs)
- 1 test restaurant (The Test Kitchen)
- 5 upcoming dinners with available seats
- All dinners have R75 commitment fee

---

## 🚀 How to Test

### Prerequisites
1. Make sure the dev server is running:
   ```bash
   npm run dev
   ```

2. Make sure you're signed in to the app (create an account if needed)

### Test Scenario 1: Complete Booking Flow

1. **Visit Discover Page**
   - Go to: http://localhost:3000/discover
   - You should see 5 dinners listed

2. **Select a Dinner**
   - Click on any dinner card
   - You should see dinner details page

3. **Reserve a Seat**
   - Click the "Reserve Seat" button at the bottom
   - Should show "Reserving..." loading state

4. **Payment Redirect**
   - Should automatically redirect to Paystack payment page
   - URL will be: https://checkout.paystack.com/...

5. **Complete Payment (Test Mode)**
   - Use Paystack test card: `4084 0840 8408 4081`
   - CVV: Any 3 digits (e.g., `408`)
   - Expiry: Any future date (e.g., `12/25`)
   - PIN: `0000`
   - OTP: `123456`

6. **Confirmation**
   - After payment, should redirect back to: `/dinner/[id]/callback`
   - Should see success message
   - Seat status should be CONFIRMED in database

### Test Scenario 2: Check Seat Status

1. **Visit My Dinners**
   - Go to: http://localhost:3000/my-dinners
   - Should see your confirmed booking

2. **Check Database**
   ```sql
   SELECT id, status, "heldByUserId", "confirmedByUserId", "holdExpiresAt"
   FROM "Seat"
   WHERE "confirmedByUserId" IS NOT NULL
   ORDER BY "updatedAt" DESC
   LIMIT 5;
   ```

3. **Check Payment Intent**
   ```sql
   SELECT id, status, amount, "providerReference", "createdAt"
   FROM "PaymentIntent"
   ORDER BY "createdAt" DESC
   LIMIT 5;
   ```

### Test Scenario 3: Error Cases

1. **Expired Hold**
   - Hold a seat (don't complete payment)
   - Wait 10 minutes
   - Try to complete payment
   - Should show error

2. **No Available Seats**
   - Book all seats for a dinner
   - Try to book another seat
   - Should show "Sold out"

3. **Cancelled Payment**
   - Start booking flow
   - Cancel on Paystack page
   - Should return to dinner page

---

## 🔍 What to Check

### Frontend
- [ ] Discover page shows all dinners
- [ ] Dinner detail page displays correctly
- [ ] "Reserve Seat" button works
- [ ] Loading states show correctly
- [ ] Redirect to Paystack happens
- [ ] Callback page shows success
- [ ] Error messages display properly

### Backend
- [ ] `/api/bookings/create` endpoint works
- [ ] Seat is held (status = HELD)
- [ ] Payment intent is created
- [ ] Paystack authorization URL is returned
- [ ] Payment verification works
- [ ] Seat is confirmed (status = CONFIRMED)
- [ ] Analytics events are tracked

### Database
- [ ] Seat status transitions: AVAILABLE → HELD → CONFIRMED
- [ ] Hold expiry time is set (10 minutes)
- [ ] Payment intent has correct amount (7500 cents = R75)
- [ ] Payment intent has provider reference
- [ ] Audit logs are created
- [ ] Analytics events are recorded

---

## 🐛 Common Issues

### Issue: "User not found in database"
**Solution**: Sign in to the app first. Clerk creates the user on first sign-in.

### Issue: "PAYSTACK_SECRET_KEY not configured"
**Solution**: Check your `.env` file has:
```bash
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
```

### Issue: "Seat hold has expired"
**Solution**: The hold is only valid for 10 minutes. Start a new booking.

### Issue: Payment verification fails
**Solution**: 
1. Check Paystack webhook is configured (for production)
2. For testing, the callback page handles verification
3. Check Paystack dashboard for transaction status

### Issue: Redirect loop
**Solution**: Clear browser cache and cookies, try again.

---

## 📊 Expected Flow

### Successful Booking
```
User clicks "Reserve Seat"
  ↓
POST /api/bookings/create
  ↓
Seat status: AVAILABLE → HELD
  ↓
Payment intent created (status: CREATED)
  ↓
Paystack transaction initialized
  ↓
Redirect to Paystack
  ↓
User completes payment
  ↓
Redirect to /dinner/[id]/callback
  ↓
POST /api/payments/verify
  ↓
Payment intent status: CREATED → SUCCEEDED
  ↓
POST /api/seats/[seatId]/confirm
  ↓
Seat status: HELD → CONFIRMED
  ↓
Success page displayed
```

### Database State After Successful Booking
```sql
-- Seat
status: CONFIRMED
heldByUserId: [user_id]
confirmedByUserId: [user_id]
holdExpiresAt: [timestamp]

-- PaymentIntent
status: SUCCEEDED
amount: 7500 (R75)
providerReference: [paystack_reference]

-- Analytics
Events: seat_hold_requested, seat_held_success, seat_confirmed

-- AuditLog
Actions: seat_held, seat_confirmed
```

---

## 🎯 Success Criteria

### Must Work
- ✅ User can discover dinners
- ✅ User can view dinner details
- ✅ User can reserve a seat
- ✅ User is redirected to Paystack
- ✅ User can complete payment
- ✅ User sees confirmation page
- ✅ Seat is confirmed in database
- ✅ Payment is recorded

### Should Work
- ✅ Hold expires after 10 minutes
- ✅ Error messages are clear
- ✅ Loading states are shown
- ✅ Analytics are tracked
- ✅ Audit logs are created

### Nice to Have
- ⏳ Email confirmation (not implemented yet)
- ⏳ SMS notification (not implemented yet)
- ⏳ Calendar invite (not implemented yet)

---

## 🔄 Re-seeding Data

If you need fresh test data:

```bash
# Clear existing dinners (optional)
npx prisma studio
# Delete dinners and seats manually

# Re-run seed
npx tsx scripts/seed-test-data.ts

# Or with your email to become restaurant owner
npx tsx scripts/seed-test-data.ts your@email.com
```

---

## 📝 Test Checklist

### Basic Flow
- [ ] Can view dinners on discover page
- [ ] Can click on a dinner
- [ ] Can see dinner details
- [ ] Can click "Reserve Seat"
- [ ] Redirects to Paystack
- [ ] Can complete payment
- [ ] Redirects to confirmation
- [ ] Sees success message

### Edge Cases
- [ ] Sold out dinners show "Join Waitlist"
- [ ] Hold expires after 10 minutes
- [ ] Can't book same dinner twice
- [ ] Payment failure shows error
- [ ] Cancelled payment returns to dinner

### Admin Features (if you're restaurant owner)
- [ ] Can view bookings in admin panel
- [ ] Can see seat statuses
- [ ] Can see payment intents
- [ ] Can manage dinners

---

## 🎉 Next Steps After Testing

Once the booking flow is confirmed working:

1. **Test with real Paystack account** (use live keys)
2. **Set up Paystack webhook** for production
3. **Add email notifications** for booking confirmation
4. **Implement refund flow** for cancellations
5. **Add booking reminders** (24h before dinner)
6. **Test QR code check-in** at dinner time

---

**Happy Testing! 🚀**

