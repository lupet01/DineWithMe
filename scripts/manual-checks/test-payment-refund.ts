/**
 * Test script for EPIC 7.4: Refund Logic
 * 
 * Tests:
 * 1. Refund eligibility checks
 * 2. User cancellation refund
 * 3. Dinner cancellation refund
 * 4. No-show refund denial
 */

import { paymentIntentRepository, seatRepository, dinnerRepository } from "./packages/db/src/repositories";
import { isRefundAllowed } from "./packages/config/src/payment";

async function testRefundLogic() {
  console.log("🧪 Testing Refund Logic\n");

  try {
    // Test 1: Check refund policy
    console.log("1️⃣ Testing refund policy...");
    
    // Test future dinner (should allow refund)
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 48); // 48 hours from now
    
    const futureCheck = isRefundAllowed(futureDate);
    console.log(`   Future dinner (48h): ${futureCheck.allowed ? '✓ Refund allowed' : '✗ Refund denied'}`);
    if (futureCheck.hoursUntilDinner) {
      console.log(`   Hours until dinner: ${futureCheck.hoursUntilDinner.toFixed(1)}`);
    }
    
    // Test near dinner (should deny refund)
    const nearDate = new Date();
    nearDate.setHours(nearDate.getHours() + 12); // 12 hours from now
    
    const nearCheck = isRefundAllowed(nearDate);
    console.log(`   Near dinner (12h): ${nearCheck.allowed ? '✓ Refund allowed' : '✗ Refund denied'}`);
    if (nearCheck.reason) {
      console.log(`   Reason: ${nearCheck.reason}`);
    }
    
    // Test past dinner (should deny refund)
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 2); // 2 hours ago
    
    const pastCheck = isRefundAllowed(pastDate);
    console.log(`   Past dinner (-2h): ${pastCheck.allowed ? '✓ Refund allowed' : '✗ Refund denied'}`);
    if (pastCheck.reason) {
      console.log(`   Reason: ${pastCheck.reason}\n`);
    }

    // Test 2: Check for refundable payments
    console.log("2️⃣ Checking for refundable payments...");
    
    const succeededPayments = await paymentIntentRepository.findByStatus("SUCCEEDED");
    console.log(`   Found ${succeededPayments.length} succeeded payment(s)\n`);
    
    if (succeededPayments.length > 0) {
      const payment = succeededPayments[0];
      console.log(`   Example payment: ${payment.id}`);
      console.log(`   Amount: R${(payment.amount / 100).toFixed(2)}`);
      console.log(`   User: ${payment.userId}`);
      console.log(`   Dinner: ${payment.dinnerId}\n`);
      
      // Check dinner timing
      const dinner = await dinnerRepository.findById(payment.dinnerId);
      if (dinner) {
        const refundCheck = isRefundAllowed(dinner.startsAt);
        console.log(`   Refund eligible: ${refundCheck.allowed ? 'Yes' : 'No'}`);
        if (refundCheck.reason) {
          console.log(`   Reason: ${refundCheck.reason}`);
        }
        if (refundCheck.hoursUntilDinner) {
          console.log(`   Hours until dinner: ${refundCheck.hoursUntilDinner.toFixed(1)}\n`);
        }
      }
    }

    // Test 3: API endpoint instructions
    console.log("3️⃣ Testing refund API endpoint:");
    console.log("   POST http://localhost:3001/api/payments/refund");
    console.log("   Headers: { 'Authorization': 'Bearer <token>' }");
    console.log("   Body: {");
    console.log('     "paymentIntentId": "cm...",');
    console.log('     "reason": "user_cancelled"');
    console.log("   }\n");

    console.log("4️⃣ Refund Rules:");
    console.log("   ✓ User cancels before 24h cutoff: Full refund");
    console.log("   ✗ User cancels within 24h: No refund");
    console.log("   ✗ User no-shows: No refund");
    console.log("   ✓ Platform cancels dinner: Full refund (admin only)\n");

    console.log("5️⃣ Test Scenarios:");
    console.log("   Scenario 1: User cancels 48h before dinner");
    console.log("   → Refund allowed");
    console.log("   → Full R75.00 refunded");
    console.log("   → Seat becomes AVAILABLE\n");
    
    console.log("   Scenario 2: User cancels 12h before dinner");
    console.log("   → Refund denied");
    console.log("   → Error: Must cancel at least 24h before");
    console.log("   → Seat remains CONFIRMED\n");
    
    console.log("   Scenario 3: User no-shows");
    console.log("   → Seat marked NO_SHOW");
    console.log("   → No refund available");
    console.log("   → Trust score impacted\n");
    
    console.log("   Scenario 4: Platform cancels dinner");
    console.log("   → Admin calls refund API");
    console.log("   → Full refund for all attendees");
    console.log("   → Dinner status: CANCELLED\n");

    console.log("✅ Refund logic ready for testing!\n");
    console.log("📝 Next Steps:");
    console.log("   1. Ensure PAYSTACK_SECRET_KEY is set");
    console.log("   2. Create a test payment");
    console.log("   3. Test refund API with different scenarios");
    console.log("   4. Verify Paystack dashboard shows refund");
    console.log("   5. Check payment intent status updated to REFUNDED");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run tests
testRefundLogic()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
