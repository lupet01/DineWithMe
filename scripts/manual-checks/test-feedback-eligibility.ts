/**
 * Test script for feedback eligibility endpoint
 * 
 * Tests:
 * 1. Eligible user (CONFIRMED seat, COMPLETED dinner, no feedback yet)
 * 2. Not eligible - dinner not completed
 * 3. Not eligible - user didn't attend
 * 4. Not eligible - already submitted feedback
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testFeedbackEligibility() {
  console.log("=".repeat(60));
  console.log("Testing Feedback Eligibility Endpoint");
  console.log("=".repeat(60));
  console.log();

  try {
    // Find a test user
    const testUser = await prisma.user.findFirst({
      where: {
        email: "luupetros@gmail.com",
      },
    });

    if (!testUser) {
      console.error("❌ Test user not found. Please create a user first.");
      return;
    }

    console.log(`✓ Found test user: ${testUser.email} (${testUser.id})`);
    console.log();

    // Find a completed dinner with the user's seat
    const completedDinner = await prisma.dinner.findFirst({
      where: {
        status: "COMPLETED",
        seats: {
          some: {
            confirmedByUserId: testUser.id,
            status: {
              in: ["CONFIRMED", "ATTENDED", "COMPLETED"],
            },
          },
        },
      },
      include: {
        restaurant: {
          select: {
            name: true,
          },
        },
        seats: {
          where: {
            confirmedByUserId: testUser.id,
          },
        },
      },
    });

    if (completedDinner) {
      console.log("Test Case 1: Eligible User");
      console.log("-".repeat(60));
      console.log(`Dinner: ${completedDinner.theme || "Untitled"}`);
      console.log(`Restaurant: ${completedDinner.restaurant.name}`);
      console.log(`Status: ${completedDinner.status}`);
      console.log(`Seat Status: ${completedDinner.seats[0]?.status}`);
      console.log();
      console.log("Expected: eligible = true");
      console.log(`Test URL: http://localhost:3001/api/feedback/eligibility?dinnerId=${completedDinner.id}`);
      console.log();
    } else {
      console.log("⚠️  No completed dinner found for test user");
      console.log();
    }

    // Find a scheduled/live dinner
    const upcomingDinner = await prisma.dinner.findFirst({
      where: {
        status: {
          in: ["SCHEDULED", "LIVE"],
        },
        seats: {
          some: {
            confirmedByUserId: testUser.id,
            status: "CONFIRMED",
          },
        },
      },
      include: {
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    if (upcomingDinner) {
      console.log("Test Case 2: Not Eligible - Dinner Not Completed");
      console.log("-".repeat(60));
      console.log(`Dinner: ${upcomingDinner.theme || "Untitled"}`);
      console.log(`Restaurant: ${upcomingDinner.restaurant.name}`);
      console.log(`Status: ${upcomingDinner.status}`);
      console.log();
      console.log("Expected: eligible = false, reason = 'Dinner is not completed yet'");
      console.log(`Test URL: http://localhost:3001/api/feedback/eligibility?dinnerId=${upcomingDinner.id}`);
      console.log();
    } else {
      console.log("⚠️  No upcoming dinner found for test user");
      console.log();
    }

    // Find a completed dinner where user didn't attend
    const dinnerWithoutUser = await prisma.dinner.findFirst({
      where: {
        status: "COMPLETED",
        seats: {
          none: {
            confirmedByUserId: testUser.id,
          },
        },
      },
      include: {
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    if (dinnerWithoutUser) {
      console.log("Test Case 3: Not Eligible - User Didn't Attend");
      console.log("-".repeat(60));
      console.log(`Dinner: ${dinnerWithoutUser.theme || "Untitled"}`);
      console.log(`Restaurant: ${dinnerWithoutUser.restaurant.name}`);
      console.log(`Status: ${dinnerWithoutUser.status}`);
      console.log();
      console.log("Expected: eligible = false, reason = 'You did not attend this dinner'");
      console.log(`Test URL: http://localhost:3001/api/feedback/eligibility?dinnerId=${dinnerWithoutUser.id}`);
      console.log();
    } else {
      console.log("⚠️  No completed dinner without user found");
      console.log();
    }

    // Check if user has already submitted feedback
    const feedbackExists = await prisma.feedback.findFirst({
      where: {
        authorId: testUser.id,
      },
      include: {
        dinner: {
          include: {
            restaurant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (feedbackExists) {
      console.log("Test Case 4: Not Eligible - Already Submitted Feedback");
      console.log("-".repeat(60));
      console.log(`Dinner: ${feedbackExists.dinner.theme || "Untitled"}`);
      console.log(`Restaurant: ${feedbackExists.dinner.restaurant.name}`);
      console.log(`Feedback Sentiment: ${feedbackExists.overallSentiment}`);
      console.log();
      console.log("Expected: eligible = false, reason = 'You have already submitted feedback for this dinner'");
      console.log(`Test URL: http://localhost:3001/api/feedback/eligibility?dinnerId=${feedbackExists.dinnerId}`);
      console.log();
    } else {
      console.log("⚠️  No existing feedback found for test user");
      console.log();
    }

    console.log("=".repeat(60));
    console.log("Testing Instructions:");
    console.log("=".repeat(60));
    console.log("1. Start the dev server: npm run dev");
    console.log("2. Sign in as: luupetros@gmail.com");
    console.log("3. Use the test URLs above in your browser or curl");
    console.log();
    console.log("Example curl command:");
    console.log('curl -H "Cookie: <your-session-cookie>" \\');
    console.log('  "http://localhost:3001/api/feedback/eligibility?dinnerId=<dinner-id>"');
    console.log();

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFeedbackEligibility();
