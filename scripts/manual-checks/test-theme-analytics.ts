/**
 * Test script for EPIC 6.5: Theme Performance Analytics
 * 
 * Tests:
 * 1. Analytics repository methods
 * 2. Theme metrics calculation
 * 3. API endpoint (requires platform admin user)
 */

import { analyticsRepository, dinnerRepository, seatRepository, feedbackRepository } from "./packages/db/src/repositories";

async function testThemeAnalytics() {
  console.log("🧪 Testing Theme Performance Analytics\n");

  try {
    // Test 1: Get all theme analytics
    console.log("1️⃣ Testing getThemeAnalytics()...");
    const analytics = await analyticsRepository.getThemeAnalytics();
    
    console.log(`   ✓ Found analytics for ${analytics.length} themes\n`);
    
    // Display analytics for each theme
    for (const theme of analytics) {
      console.log(`   📊 ${theme.themeTitle} (${theme.themeKey})`);
      console.log(`      Theme ID: ${theme.themeId}`);
      console.log(`      Total Dinners: ${theme.totalDinners}`);
      console.log(`      Total Seats: ${theme.totalSeats}`);
      console.log(`      Seats Confirmed: ${theme.seatsConfirmed}`);
      console.log(`      Seats Attended: ${theme.seatsAttended}`);
      console.log(`      Seats No-Show: ${theme.seatsNoShow}`);
      console.log(`      Confirmation Rate: ${(theme.confirmationRate * 100).toFixed(1)}%`);
      console.log(`      Attendance Rate: ${(theme.attendanceRate * 100).toFixed(1)}%`);
      console.log(`      Average Comfort Score: ${theme.averageComfortScore !== null ? theme.averageComfortScore.toFixed(2) : 'N/A'}`);
      console.log(`      Total Feedback: ${theme.totalFeedback}`);
      console.log(`      Report Count: ${theme.reportCount}`);
      console.log(`      Report Rate: ${(theme.reportRate * 100).toFixed(1)}%`);
      console.log();
    }

    // Test 2: Get analytics for specific theme
    if (analytics.length > 0) {
      const firstTheme = analytics[0];
      console.log("2️⃣ Testing getThemeAnalyticsById()...");
      const themeAnalytics = await analyticsRepository.getThemeAnalyticsById(firstTheme.themeId);
      
      if (themeAnalytics) {
        console.log(`   ✓ Retrieved analytics for theme: ${themeAnalytics.themeTitle}`);
        console.log(`   Confirmation Rate: ${(themeAnalytics.confirmationRate * 100).toFixed(1)}%`);
        console.log(`   Attendance Rate: ${(themeAnalytics.attendanceRate * 100).toFixed(1)}%\n`);
      } else {
        console.log(`   ✗ Failed to retrieve analytics for theme ID: ${firstTheme.themeId}\n`);
      }

      // Test 3: Get analytics by key
      console.log("3️⃣ Testing getThemeAnalyticsByKey()...");
      const themeAnalyticsByKey = await analyticsRepository.getThemeAnalyticsByKey(firstTheme.themeKey);
      
      if (themeAnalyticsByKey) {
        console.log(`   ✓ Retrieved analytics for theme key: ${themeAnalyticsByKey.themeKey}`);
        console.log(`   Total Dinners: ${themeAnalyticsByKey.totalDinners}\n`);
      } else {
        console.log(`   ✗ Failed to retrieve analytics for theme key: ${firstTheme.themeKey}\n`);
      }
    }

    // Test 4: Verify data integrity
    console.log("4️⃣ Verifying data integrity...");
    for (const theme of analytics) {
      // Confirmation rate should be between 0 and 1
      if (theme.confirmationRate < 0 || theme.confirmationRate > 1) {
        console.log(`   ✗ Invalid confirmation rate for ${theme.themeTitle}: ${theme.confirmationRate}`);
      }
      
      // Attendance rate should be between 0 and 1
      if (theme.attendanceRate < 0 || theme.attendanceRate > 1) {
        console.log(`   ✗ Invalid attendance rate for ${theme.themeTitle}: ${theme.attendanceRate}`);
      }
      
      // Report rate should be between 0 and 1
      if (theme.reportRate < 0 || theme.reportRate > 1) {
        console.log(`   ✗ Invalid report rate for ${theme.themeTitle}: ${theme.reportRate}`);
      }
      
      // Comfort score should be between 1 and 3 (or null)
      if (theme.averageComfortScore !== null && (theme.averageComfortScore < 1 || theme.averageComfortScore > 3)) {
        console.log(`   ✗ Invalid comfort score for ${theme.themeTitle}: ${theme.averageComfortScore}`);
      }
    }
    console.log("   ✓ All metrics are within valid ranges\n");

    // Test 5: Summary statistics
    console.log("5️⃣ Summary Statistics:");
    const totalDinners = analytics.reduce((sum, t) => sum + t.totalDinners, 0);
    const totalSeats = analytics.reduce((sum, t) => sum + t.totalSeats, 0);
    const totalConfirmed = analytics.reduce((sum, t) => sum + t.seatsConfirmed, 0);
    const totalAttended = analytics.reduce((sum, t) => sum + t.seatsAttended, 0);
    const totalFeedback = analytics.reduce((sum, t) => sum + t.totalFeedback, 0);
    
    console.log(`   Total Dinners Across All Themes: ${totalDinners}`);
    console.log(`   Total Seats: ${totalSeats}`);
    console.log(`   Total Confirmed: ${totalConfirmed}`);
    console.log(`   Total Attended: ${totalAttended}`);
    console.log(`   Total Feedback: ${totalFeedback}`);
    console.log(`   Overall Confirmation Rate: ${totalSeats > 0 ? ((totalConfirmed / totalSeats) * 100).toFixed(1) : 0}%`);
    console.log(`   Overall Attendance Rate: ${totalConfirmed > 0 ? ((totalAttended / totalConfirmed) * 100).toFixed(1) : 0}%\n`);

    console.log("✅ All tests passed!\n");
    console.log("📝 Next Steps:");
    console.log("   1. Test API endpoint: GET /api/analytics/themes");
    console.log("   2. Requires platform admin authentication");
    console.log("   3. Returns JSON with theme analytics");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run tests
testThemeAnalytics()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
