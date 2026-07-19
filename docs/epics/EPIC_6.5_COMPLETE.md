# EPIC 6.5: Theme Performance Analytics - COMPLETE ✅

## Status: COMPLETED

All requirements for EPIC 6.5 have been implemented.

## ✅ Completed Requirements

### 1. Analytics Repository

**File**: `packages/db/src/repositories/analytics.repository.ts`

Created `AnalyticsRepository` with methods:

#### `getThemeAnalytics()`
Returns aggregated metrics for all active themes:
- `themeId` - Theme identifier
- `themeKey` - Theme key (e.g., "social")
- `themeTitle` - Theme display name
- `totalDinners` - Number of dinners using this theme
- `totalSeats` - Total seats across all dinners
- `seatsConfirmed` - Seats in CONFIRMED, ATTENDED, COMPLETED, NO_SHOW, LEFT_EARLY status
- `seatsAttended` - Seats in ATTENDED or COMPLETED status
- `seatsNoShow` - Seats marked as NO_SHOW
- `confirmationRate` - seatsConfirmed / totalSeats (0-1)
- `attendanceRate` - seatsAttended / seatsConfirmed (0-1)
- `averageComfortScore` - Average comfort level from table-level feedback (1-3 scale, or null)
- `totalFeedback` - Count of table-level feedback
- `reportCount` - Count of UNCOMFORTABLE feedback
- `reportRate` - reportCount / totalFeedback (0-1)

#### `getThemeAnalyticsById(themeId)`
Returns analytics for a specific theme by ID.

#### `getThemeAnalyticsByKey(themeKey)`
Returns analytics for a specific theme by key.

### 2. Metrics Tracked Per Dinner

The analytics aggregate data from:

**Seat Status Tracking**:
- AVAILABLE - Not yet booked
- HELD - Temporarily reserved
- CONFIRMED - Booking confirmed ✓
- ATTENDED - User checked in ✓
- COMPLETED - Dinner finished ✓
- NO_SHOW - User didn't attend ✗
- LEFT_EARLY - User left before end
- CANCELLED - Booking cancelled
- EXPIRED - Hold expired

**Feedback Tracking**:
- `overallSentiment` - GREAT, GOOD, NEUTRAL, UNCOMFORTABLE
- `comfortLevel` - FULL (3), MOSTLY (2), LOW (1)
- Only table-level feedback (targetUserId = null) is included

### 3. API Endpoint

**Endpoint**: `GET /api/analytics/themes`

**Authorization**: Platform admin only (role = PLATFORM_ADMIN)

**Response**:
```json
{
  "success": true,
  "data": {
    "themes": [
      {
        "themeId": "cm...",
        "themeKey": "social",
        "themeTitle": "Social Table",
        "totalDinners": 15,
        "totalSeats": 90,
        "seatsConfirmed": 85,
        "seatsAttended": 80,
        "seatsNoShow": 5,
        "confirmationRate": 0.94,
        "attendanceRate": 0.94,
        "averageComfortScore": 2.8,
        "totalFeedback": 75,
        "reportCount": 2,
        "reportRate": 0.03
      }
    ],
    "generatedAt": "2026-03-02T..."
  }
}
```

**Error Responses**:
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Not platform admin

### 4. Repository Export

**File**: `packages/db/src/repositories/index.ts`

Exported:
- `analyticsRepository` - Repository instance
- `AnalyticsRepository` - Class export
- `ThemeAnalytics` - Type export

## 📁 Files Created

1. `packages/db/src/repositories/analytics.repository.ts` - Analytics repository
2. `apps/web/src/app/api/analytics/themes/route.ts` - API endpoint
3. `test-theme-analytics.ts` - Test script
4. `EPIC_6.5_COMPLETE.md` - This document

## 📝 Files Modified

1. `packages/db/src/repositories/index.ts` - Added analytics repository export

## 📊 Metrics Calculation

### Confirmation Rate
```
confirmationRate = seatsConfirmed / totalSeats
```

Where `seatsConfirmed` includes seats in:
- CONFIRMED
- ATTENDED
- COMPLETED
- NO_SHOW (confirmed but didn't attend)
- LEFT_EARLY

### Attendance Rate
```
attendanceRate = seatsAttended / seatsConfirmed
```

Where `seatsAttended` includes seats in:
- ATTENDED
- COMPLETED

### Average Comfort Score
```
averageComfortScore = sum(comfortScores) / totalFeedback
```

Comfort level mapping:
- FULL = 3
- MOSTLY = 2
- LOW = 1

Only table-level feedback (targetUserId = null) is included.

### Report Rate
```
reportRate = reportCount / totalFeedback
```

Where `reportCount` is the number of feedback entries with:
- overallSentiment = UNCOMFORTABLE

## 🧪 Testing

### Manual Testing

```bash
# Run test script
npx tsx test-theme-analytics.ts

# Expected output:
# ✓ Found analytics for 4 themes
# ✓ Retrieved analytics for each theme
# ✓ All metrics within valid ranges
# ✓ Summary statistics displayed
```

### API Testing

```bash
# Test API endpoint (requires platform admin auth)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/analytics/themes

# Expected response:
# {
#   "success": true,
#   "data": {
#     "themes": [...],
#     "generatedAt": "2026-03-02T..."
#   }
# }
```

### Test with Different Scenarios

1. **No dinners yet**:
   - All metrics should be 0
   - Rates should be 0
   - averageComfortScore should be null

2. **Dinners with no feedback**:
   - Seat metrics should be accurate
   - averageComfortScore should be null
   - reportRate should be 0

3. **Dinners with feedback**:
   - All metrics should be calculated
   - Comfort score should be between 1-3
   - Report rate should be between 0-1

## 📈 Use Cases

### Platform Analytics Dashboard
```typescript
import { analyticsRepository } from "@dinewithme/db";

const analytics = await analyticsRepository.getThemeAnalytics();

// Display theme performance
analytics.forEach(theme => {
  console.log(`${theme.themeTitle}:`);
  console.log(`  Confirmation Rate: ${(theme.confirmationRate * 100).toFixed(1)}%`);
  console.log(`  Attendance Rate: ${(theme.attendanceRate * 100).toFixed(1)}%`);
  console.log(`  Comfort Score: ${theme.averageComfortScore?.toFixed(2) || 'N/A'}`);
});
```

### Theme Performance Comparison
```typescript
// Find best performing theme by attendance
const bestAttendance = analytics.reduce((best, theme) => 
  theme.attendanceRate > best.attendanceRate ? theme : best
);

// Find theme with highest comfort score
const mostComfortable = analytics.reduce((best, theme) => 
  (theme.averageComfortScore || 0) > (best.averageComfortScore || 0) ? theme : best
);

// Find theme with lowest report rate
const safest = analytics.reduce((best, theme) => 
  theme.reportRate < best.reportRate ? theme : best
);
```

### API Integration
```typescript
// Fetch analytics from API
const response = await fetch('/api/analytics/themes', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { data } = await response.json();
const themes = data.themes;

// Display in admin dashboard
themes.forEach(theme => {
  renderThemeCard({
    title: theme.themeTitle,
    dinners: theme.totalDinners,
    confirmationRate: theme.confirmationRate,
    attendanceRate: theme.attendanceRate,
    comfortScore: theme.averageComfortScore,
  });
});
```

## 🔒 Security & Authorization

### Platform Admin Only
- Only users with role = PLATFORM_ADMIN can access analytics
- Regular users and restaurant admins cannot view analytics
- Unauthorized requests return 401 or 403

### Data Privacy
- Only aggregated metrics are exposed
- No individual user data is included
- No personally identifiable information (PII)
- Table-level feedback only (no person-specific feedback)

## 📊 Example Analytics Output

### Social Table
```json
{
  "themeId": "cm...",
  "themeKey": "social",
  "themeTitle": "Social Table",
  "totalDinners": 25,
  "totalSeats": 150,
  "seatsConfirmed": 140,
  "seatsAttended": 135,
  "seatsNoShow": 5,
  "confirmationRate": 0.93,
  "attendanceRate": 0.96,
  "averageComfortScore": 2.85,
  "totalFeedback": 120,
  "reportCount": 3,
  "reportRate": 0.03
}
```

**Interpretation**:
- 93% of seats get confirmed (high demand)
- 96% of confirmed seats attend (excellent reliability)
- Average comfort score of 2.85/3 (very comfortable)
- 3% report rate (very low safety concerns)

### Professional Conversation
```json
{
  "themeId": "cm...",
  "themeKey": "professional-conversation",
  "themeTitle": "Professional Conversation",
  "totalDinners": 18,
  "totalSeats": 108,
  "seatsConfirmed": 95,
  "seatsAttended": 88,
  "seatsNoShow": 7,
  "confirmationRate": 0.88,
  "attendanceRate": 0.93,
  "averageComfortScore": 2.65,
  "totalFeedback": 80,
  "reportCount": 5,
  "reportRate": 0.06
}
```

**Interpretation**:
- 88% confirmation rate (good but lower than Social)
- 93% attendance rate (reliable)
- Average comfort score of 2.65/3 (comfortable)
- 6% report rate (slightly higher, may need boundary reinforcement)

## 🎯 Success Metrics

Track these metrics to measure theme success:

1. **Confirmation Rate**: Target >85%
   - Indicates theme appeal and demand
   - Low rate may indicate unclear expectations

2. **Attendance Rate**: Target >90%
   - Indicates commitment and follow-through
   - Low rate may indicate booking friction

3. **Average Comfort Score**: Target >2.5
   - Indicates positive experience
   - Low score may indicate boundary issues

4. **Report Rate**: Target <10%
   - Indicates safety and comfort
   - High rate requires immediate investigation

## 🚀 Future Enhancements (Non-Goals for MVP)

- ❌ Recommendation engine (not in scope)
- ❌ Predictive analytics (not in scope)
- ❌ Real-time analytics dashboard (not in scope)
- ❌ Theme A/B testing (not in scope)
- ❌ User-level analytics (privacy concerns)

Potential future features:
- Time-series analytics (trends over time)
- Restaurant-specific theme performance
- Geographic theme preferences
- Demographic theme preferences (with consent)
- Theme recommendation based on user history

## 📚 Related Documentation

- `EPIC_6.1_COMPLETE.md` - Theme schema implementation
- `EPIC_6.2_COMPLETE.md` - Restaurant theme enablement
- `EPIC_6.3_COMPLETE.md` - Dinner creation with themes
- `EPIC_6.4_COMPLETE.md` - Theme rendering in UI
- `EPIC_6_THEME_ENGINE.md` - Full theme engine strategy

## 🎯 Requirements Checklist

- [x] Track themeId per dinner
- [x] Track seat_confirmed count
- [x] Calculate attendance_rate
- [x] Calculate average comfort score
- [x] Calculate report rate
- [x] Create analytics repository
- [x] Create GET /api/analytics/themes endpoint
- [x] Return aggregated metrics
- [x] Platform admin authorization
- [x] Test script provided
- [x] No recommendation engine (non-goal)

---

**EPIC 6.5 Status**: ✅ COMPLETE
**Date Completed**: March 2, 2026
**Repository**: AnalyticsRepository implemented
**API Endpoint**: GET /api/analytics/themes (platform admin only)
**Testing**: Test script provided
**Authorization**: Platform admin required

