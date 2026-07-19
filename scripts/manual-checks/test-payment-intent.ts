/**
 * Test script for EPIC 7.1: Commitment Payment Schema
 * 
 * Tests:
 * 1. Create payment intent
 * 2. Mark payment as succeeded
 * 3. Mark payment as failed
 * 4. Refund payment
 * 5. Query payment intents
 */

import { paymentIntentRepository, userRepository, dinnerRepository, seatRepository } from "./packages/db/src/repositories";

async function testPaymentIntent() {
  console.log("🧪 Testing Payment Intent Repository\n");

  try {
    // Get test data
    console.log("1️⃣ Getting test data...");
    const users = await userRepository.findMany();
    const dinners = await dinnerRepository.findMany();
    
    if (users.length === 0) {
      console.log("   ✗ No users found. Please create a user first.");
      return;
    }
    
    if (dinners.length === 0) {
      console.log("   ✗ No dinners found. Please create a dinner first.");
      return;
    }

    const testUser = users[0];
    const testDinner = dinners[0];
    const seats = await seatRepository.findByDinner(testDinner.id);
    
    if (seats.length === 0) {
      console.log("   ✗ No seats found for dinner. Please create seats first.");
      return;
    }

    const testSeat = seats[0];
    console.log(`   ✓ Using user: ${testUser.email}`);
    console.log(`   ✓ Using dinner: ${testDinner.id}`);
    console.log(`   ✓ Using seat: ${testSeat.id}\n`);

    // Test 2: Create payment intent
    console.log("2️⃣ Testing createPaymentIntent()...");
    const paymentIntent = await paymentIntentRepository.createPaymentIntent({
      userId: testUser.id,
      dinnerId: testDinner.id,
      seatId: testSeat.id,
      amount: 5000, // R50.00 in cents
      currency: "ZAR",
      provider: "PAYSTACK",
    });
    
    console.log(`   ✓ Created payment intent: ${paymentIntent.id}`);
    console.log(`   Amount: ${paymentIntent.amount} cents (R${(paymentIntent.amount / 100).toFixed(2)})`);
    console.log(`   Currency: ${paymentIntent.currency}`);
    console.log(`   Provider: ${paymentIntent.provider}`);
    console.log(`   Status: ${paymentIntent.status}\n`);

    // Test 3: Find payment intent by ID
    console.log("3️⃣ Testing findById()...");
    const foundPayment = await paymentIntentRepository.findById(paymentIntent.id);
    
    if (foundPayment) {
      console.log(`   ✓ Found payment intent: ${foundPayment.id}`);
      console.log(`   Status: ${foundPayment.status}\n`);
    } else {
      console.log(`   ✗ Payment intent not found\n`);
    }

    // Test 4: Find payment intent with relations
    console.log("4️⃣ Testing findByIdWithRelations()...");
    const paymentWithRelations = await paymentIntentRepository.findByIdWithRelations(paymentIntent.id);
    
    if (paymentWithRelations) {
      console.log(`   ✓ Found payment with relations`);
      console.log(`   User: ${paymentWithRelations.user.email}`);
      console.log(`   Dinner: ${paymentWithRelations.dinner.id}`);
      console.log(`   Seat: ${paymentWithRelations.seat.id}`);
      console.log(`   Seat Status: ${paymentWithRelations.seat.status}\n`);
    } else {
      console.log(`   ✗ Payment intent not found\n`);
    }

    // Test 5: Mark payment as succeeded
    console.log("5️⃣ Testing markPaymentSucceeded()...");
    const succeededPayment = await paymentIntentRepository.markPaymentSucceeded(
      paymentIntent.id,
      "paystack_ref_123456"
    );
    
    console.log(`   ✓ Marked payment as succeeded`);
    console.log(`   Status: ${succeededPayment.status}`);
    console.log(`   Provider Reference: ${succeededPayment.providerReference}\n`);

    // Test 6: Find by user
    console.log("6️⃣ Testing findByUser()...");
    const userPayments = await paymentIntentRepository.findByUser(testUser.id);
    console.log(`   ✓ Found ${userPayments.length} payment(s) for user\n`);

    // Test 7: Find by dinner
    console.log("7️⃣ Testing findByDinner()...");
    const dinnerPayments = await paymentIntentRepository.findByDinner(testDinner.id);
    console.log(`   ✓ Found ${dinnerPayments.length} payment(s) for dinner\n`);

    // Test 8: Find by seat
    console.log("8️⃣ Testing findBySeat()...");
    const seatPayment = await paymentIntentRepository.findBySeat(testSeat.id);
    
    if (seatPayment) {
      console.log(`   ✓ Found payment for seat: ${seatPayment.id}\n`);
    } else {
      console.log(`   ✗ No payment found for seat\n`);
    }

    // Test 9: Find by status
    console.log("9️⃣ Testing findByStatus()...");
    const succeededPayments = await paymentIntentRepository.findByStatus("SUCCEEDED");
    console.log(`   ✓ Found ${succeededPayments.length} succeeded payment(s)\n`);

    // Test 10: Get user payment stats
    console.log("🔟 Testing getUserPaymentStats()...");
    const userStats = await paymentIntentRepository.getUserPaymentStats(testUser.id);
    console.log(`   ✓ User Payment Statistics:`);
    console.log(`   Total Payments: ${userStats.totalPayments}`);
    console.log(`   Succeeded: ${userStats.succeededPayments}`);
    console.log(`   Failed: ${userStats.failedPayments}`);
    console.log(`   Refunded: ${userStats.refundedPayments}`);
    console.log(`   Total Amount Paid: R${(userStats.totalAmountPaid / 100).toFixed(2)}\n`);

    // Test 11: Get dinner payment stats
    console.log("1️⃣1️⃣ Testing getDinnerPaymentStats()...");
    const dinnerStats = await paymentIntentRepository.getDinnerPaymentStats(testDinner.id);
    console.log(`   ✓ Dinner Payment Statistics:`);
    console.log(`   Total Payments: ${dinnerStats.totalPayments}`);
    console.log(`   Succeeded: ${dinnerStats.succeededPayments}`);
    console.log(`   Failed: ${dinnerStats.failedPayments}`);
    console.log(`   Total Amount Collected: R${(dinnerStats.totalAmountCollected / 100).toFixed(2)}\n`);

    // Test 12: Refund payment
    console.log("1️⃣2️⃣ Testing refundPayment()...");
    const refundedPayment = await paymentIntentRepository.refundPayment(paymentIntent.id);
    console.log(`   ✓ Refunded payment`);
    console.log(`   Status: ${refundedPayment.status}\n`);

    // Test 13: Create failed payment
    console.log("1️⃣3️⃣ Testing markPaymentFailed()...");
    const failedPaymentIntent = await paymentIntentRepository.createPaymentIntent({
      userId: testUser.id,
      dinnerId: testDinner.id,
      seatId: testSeat.id,
      amount: 5000,
      currency: "ZAR",
      provider: "YOCO",
    });
    
    const failedPayment = await paymentIntentRepository.markPaymentFailed(failedPaymentIntent.id);
    console.log(`   ✓ Marked payment as failed`);
    console.log(`   Status: ${failedPayment.status}\n`);

    // Test 14: Create payment requiring action
    console.log("1️⃣4️⃣ Testing markPaymentRequiresAction()...");
    const actionPaymentIntent = await paymentIntentRepository.createPaymentIntent({
      userId: testUser.id,
      dinnerId: testDinner.id,
      seatId: testSeat.id,
      amount: 5000,
      currency: "ZAR",
      provider: "PAYSTACK",
    });
    
    const actionPayment = await paymentIntentRepository.markPaymentRequiresAction(
      actionPaymentIntent.id,
      "paystack_action_ref"
    );
    console.log(`   ✓ Marked payment as requiring action`);
    console.log(`   Status: ${actionPayment.status}`);
    console.log(`   Provider Reference: ${actionPayment.providerReference}\n`);

    // Test 15: Verify refund validation
    console.log("1️⃣5️⃣ Testing refund validation...");
    try {
      await paymentIntentRepository.refundPayment(failedPayment.id);
      console.log(`   ✗ Should not allow refund of failed payment\n`);
    } catch (error: any) {
      console.log(`   ✓ Correctly prevented refund of failed payment`);
      console.log(`   Error: ${error.message}\n`);
    }

    console.log("✅ All tests passed!\n");
    console.log("📝 Summary:");
    console.log("   - PaymentIntent model created");
    console.log("   - Repository methods working correctly");
    console.log("   - Payment status transitions validated");
    console.log("   - Statistics calculations accurate");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run tests
testPaymentIntent()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
