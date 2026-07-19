# EPIC 5.2: Feedback Eligibility - Quick Reference

## API Endpoint

```
GET /api/feedback/eligibility?dinnerId={dinnerId}
```

### Authentication
Required - Clerk session cookie

### Response
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "dinnerId": "cmm7ir2y800171og34rcnrp5q",
    "dinnerTheme": "French Bistro"
  }
}
```

Or if not eligible:
```json
{
  "success": true,
  "data": {
    "eligible": false,
    "reason": "Dinner is not completed yet",
    "dinnerId": "cmm7ir2y800171og34rcnrp5q",
    "dinnerTheme": "French Bistro"
  }
}
```

## Eligibility Rules

User is eligible if:
1. ✅ Dinner status = COMPLETED
2. ✅ User has CONFIRMED/ATTENDED/COMPLETED seat
3. ✅ User hasn't submitted feedback yet

## Ineligibility Reasons

| Reason | Meaning |
|--------|---------|
| "Dinner is not completed yet" | Dinner status is SCHEDULED or LIVE |
| "You did not attend this dinner" | User has no eligible seat |
| "You have already submitted feedback for this dinner" | Feedback exists |

## Frontend Integration

### Check Eligibility
```typescript
async function checkFeedbackEligibility(dinnerId: string) {
  const response = await fetch(
    `/api/feedback/eligibility?dinnerId=${dinnerId}`
  );
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
}
```

### Usage in My Dinners
```typescript
// In past dinners list
{pastDinners.map(async (dinner) => {
  const eligibility = await checkFeedbackEligibility(dinner.id);
  
  return (
    <DinnerCard key={dinner.id} dinner={dinner}>
      {eligibility.eligible ? (
        <Button onClick={() => openFeedbackForm(dinner.id)}>
          Leave Feedback
        </Button>
      ) : (
        <Text>{eligibility.reason}</Text>
      )}
    </DinnerCard>
  );
})}
```

## Analytics Events

### feedback_prompt_eligible
```typescript
{
  userId: "cmm7ipjcm0006104en4khu0f3",
  dinnerId: "cmm7ir2y800171og34rcnrp5q",
  dinnerTheme: "French Bistro",
  timestamp: "2026-03-02T10:30:00.000Z"
}
```

### feedback_prompt_not_eligible
```typescript
{
  userId: "cmm7ipjcm0006104en4khu0f3",
  dinnerId: "cmm7ir2y800171og34rcnrp5q",
  dinnerTheme: "French Bistro",
  reason: "Dinner is not completed yet",
  timestamp: "2026-03-02T10:30:00.000Z"
}
```

## Testing

### Run Test Script
```bash
npx tsx test-feedback-eligibility.ts
```

### Manual Test
```bash
# 1. Start dev server
npm run dev

# 2. Sign in as test user
# Visit: http://localhost:3001/sign-in
# Email: luupetros@gmail.com

# 3. Test in browser
http://localhost:3001/api/feedback/eligibility?dinnerId=<dinner-id>

# 4. Or use curl
curl -H "Cookie: <session-cookie>" \
  "http://localhost:3001/api/feedback/eligibility?dinnerId=<dinner-id>"
```

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| UNAUTHORIZED | 401 | Not authenticated |
| USER_NOT_FOUND | 404 | User not in database |
| MISSING_DINNER_ID | 400 | No dinnerId parameter |
| DINNER_NOT_FOUND | 404 | Dinner doesn't exist |

## Database Queries

The endpoint makes 3 queries:
1. Find dinner by ID
2. Find user's seats for dinner
3. Check if feedback exists

## Next Steps

1. Implement feedback submission API (POST /api/feedback)
2. Create feedback form UI component
3. Integrate with My Dinners page
4. Add feedback display/viewing

