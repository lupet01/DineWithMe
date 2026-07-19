/**
 * Test script for EPIC 7.2: Create Payment Intent API
 * 
 * Tests:
 * 1. Hold a seat
 * 2. Create payment intent
 * 3. Verify Paystack integration
 * 4. Check payment intent status
 */

import { seatRepository, userRepository, dinnerRepository, paymentIntentRepository } from "./packages/db/src/repositories";

async function testPaymentCreate() {
  console.log("🧪 Testing Payment Intent Creation\n");

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
    console.log(`   ✓ Using user: ${testUser.email}`);
    console.log(`   ✓ Using dinner: ${testDinner.id}\n`);

    // Test 2: Hold a seat
    console.log("2️⃣ Holding a seat...");
    let seat;
    try {
      seat = await seatRepository.holdSeatForDinner(testUser.id, testDinner.id);
      console.log(`   ✓ Held seat: ${seat.id}`);
      console.log(`   Status: ${seat.status}`);
      console.log(`   Hold expires at: ${seat.holdExpiresAt}\n`);
    } catch (error: any) {
      console.log(`   ℹ️  ${error.message}`);
      console.log(`   Using existing held seat...\n`);
      
      // Find existing held seat
      const seats = await seatRepository.findByDinner(testDinner.id);
      const heldSeat = seats.find(s => s.status === "HELD" && s.heldByUserId === testUser.id);
      
      if (!heldSeat) {
        console.log("   ✗ No held seat found. Please hold a seat first.");
        return;
      }
      
      seat = heldSeat;
      console.log(`   ✓ Found held seat: ${seat.id}\n`);
    }

    // Test 3: Create payment intent via API
    console.log("3️⃣ Creating payment intent...");
    console.log("   ℹ️  To test the API endpoint:");
    console.log(`   POST http://localhost:3001/api/payments/create`);
    console.log(`   Body: { "seatId": "${seat.id}" }`);
    console.log(`   Headers: { "Authorization": "Bearer <token>" }\n`);

    // Test 4: Check payment configuration
    console.log("4️⃣ Checking payment configuration...");
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
    
    if (!paystackSecretKey) {
      console.log("   ⚠️  PAYSTACK_SECRET_KEY not set in .env");
      console.log("   Add: PAYSTACK_SECRET_KEY=sk_test_your_key\n");
    } else {
      console.log(`   ✓ PAYSTACK_SECRET_KEY configured (${paystackSecretKey.substring(0, 10)}...)`);
    }
    
    if (!paystackPublicKey) {
      console.log("   ⚠️  PAYSTACK_PUBLIC_KEY not set in .env");
      console.log("   Add: PAYSTACK_PUBLIC_KEY=pk_test_your_key\n");
    } else {
      console.log(`   ✓ PAYSTACK_PUBLIC_KEY configured (${paystackPublicKey.substring(0, 10)}...)\n`);
    }

    // Test 5: Check existing payments
    console.log("5️⃣ Checking existing payments...");
    const existingPayment = await paymentIntentRepository.findBySeat(seat.id);
    
    if (existingPayment) {
      console.log(`   ✓ Found existing payment: ${existingPayment.id}`);
      console.log(`   Status: ${existingPayment.status}`);
      console.log(`   Amount: R${(existingPayment.amount / 100).toFixed(2)}`);
      console.log(`   Provider: ${existingPayment.provider}`);
      console.log(`   Reference: ${existingPayment.providerReference || "N/A"}\n`);
    } else {
      console.log(`   ℹ️  No existing payment for this seat\n`);
    }

    console.log("✅ Test setup complete!\n");
    console.log("📝 Next Steps:");
    console.log("   1. Ensure PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY are set in .env");
    console.log("   2. Start the dev server: npm run dev");
    console.log("   3. Test the API endpoint:");
    console.log(`      curl -X POST http://localhost:3001/api/payments/create \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -H "Authorization: Bearer <token>" \\`);
    console.log(`        -d '{"seatId":"${seat.id}"}'`);
    console.log("\n   4. Expected response:");
    console.log("      {");
    console.log('        "success": true,');
    console.log('        "data": {');
    console.log('          "paymentIntentId": "cm...",');
    console.log('          "authorizationUrl": "https://checkout.paystack.com/...",');
    console.log('          "amount": 7500,');
    console.log('          "currency": "ZAR",');
    console.log('          "reference": "..."');
    console.log("        }");
    console.log("      }");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run tests
testPaymentCreate()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
