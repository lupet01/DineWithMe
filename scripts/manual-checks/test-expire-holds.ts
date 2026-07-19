import { config } from "dotenv";

// Load environment variables
config();

async function testExpireHolds() {
  const token = process.env.CRON_SECRET;
  
  if (!token) {
    console.error("❌ CRON_SECRET not found in environment");
    console.log("Add CRON_SECRET to your .env file");
    return;
  }

  const url = `http://localhost:3001/api/cron/expire-holds?token=${token}`;
  
  console.log("Testing hold expiration cron job...\n");
  console.log(`URL: ${url.replace(token, "***")}\n`);

  try {
    console.log("Triggering cron job...");
    const startTime = Date.now();
    
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Duration: ${duration}ms\n`);

    const data = await response.json();

    if (data.success) {
      console.log("✅ Success!");
      console.log(`   Expired seats: ${data.data.expiredCount}`);
      console.log(`   Job duration: ${data.data.duration}`);
      console.log(`   Timestamp: ${data.data.timestamp}\n`);

      if (data.data.expiredSeats.length > 0) {
        console.log("Expired seats details:");
        data.data.expiredSeats.forEach((seat: any, index: number) => {
          console.log(`   ${index + 1}. Seat: ${seat.seatId.substring(0, 8)}...`);
          console.log(`      Dinner: ${seat.dinnerId.substring(0, 8)}...`);
          console.log(`      User: ${seat.userId ? seat.userId.substring(0, 8) + "..." : "none"}`);
        });
      } else {
        console.log("No expired seats found (this is normal if no holds have expired)");
      }
    } else {
      console.log("❌ Error!");
      console.log(`   Message: ${data.error.message}`);
      console.log(`   Code: ${data.error.code}`);
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
    console.log("\nMake sure:");
    console.log("1. Dev server is running (npm run dev)");
    console.log("2. CRON_SECRET is set in .env");
    console.log("3. Database is accessible");
  }
}

async function main() {
  await testExpireHolds();
}

main();
