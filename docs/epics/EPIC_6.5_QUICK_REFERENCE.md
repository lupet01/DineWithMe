# EPIC 6.5: Theme Performance Analytics - Quick Reference

## API Endpoint

```
GET /api/analytics/themes
```

**Authorization**: Platform admin only (role = PLATFORM_ADMIN)

## Response Format

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

## Metrics Explained

| Metric | Formula | Range | Description |
|--------|---------|-------|-------------|
| `confirmationRate` | seatsConfirmed / totalSeats | 0-1 | % of seats that get confirmed |
| `attendanceRate` | seatsAttended / seatsConfirmed | 0-1 | % of confirmed seats that attend |
| `averageComfortScore` | avg(comfortLevel) | 1-3 or null | Average comfort (FULL=3, MOSTLY=2, LOW=1) |
| `reportRate` | reportCount / totalFeedback | 0-1 | % of feedback marked UNCOMFORTABLE |

## Usage Examples

### Fetch Analytics (TypeScript)

```typescript
const response = await fetch('/api/analytics/themes', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { data } = await response.json();
const themes = data.themes;
```

### Repository Usage

```typescript
import { analyticsRepository } from "@dinewithme/db";

// Get all theme analytics
const analytics = await analyticsRepository.getThemeAnalytics();

// Get specific theme by ID
const themeAnalytics = await analyticsRepository.getThemeAnalyticsById(themeId);

// Get specific theme by key
const socialAnalytics = await analyticsRepository.getThemeAnalyticsByKey("social");
```

### Find Best Performing Theme

```typescript
// Highest attendance rate
const bestAttendance = analytics.reduce((best, theme) => 
  theme.attendanceRate > best.attendanceRate ? theme : best
);

// Highest comfort score
const mostComfortable = analytics.reduce((best, theme) => 
  (theme.averageComfortScore || 0) > (best.averageComfortScore || 0) ? theme : best
);

// Lowest report rate (safest)
const safest = analytics.reduce((best, theme) => 
  theme.reportRate < best.reportRate ? theme : best
);
```

## Testing

```bash
# Run test script
npx tsx test-theme-analytics.ts

# Test API endpoint (requires platform admin)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/analytics/themes
```

## Success Targets

- **Confirmation Rate**: >85%
- **Attendance Rate**: >90%
- **Average Comfort Score**: >2.5
- **Report Rate**: <10%

## Files

- **Repository**: `packages/db/src/repositories/analytics.repository.ts`
- **API**: `apps/web/src/app/api/analytics/themes/route.ts`
- **Test**: `test-theme-analytics.ts`
- **Docs**: `EPIC_6.5_COMPLETE.md`
