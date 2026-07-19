# EPIC 3.8: Dinner List and Detail APIs - ✅ COMPLETE

## What Was Built

### 1. Analytics Events
**File:** `packages/analytics/src/events.ts`

#### New Events:
- ✅ `DINNER_LIST_VIEWED` - When user views dinner list
- ✅ `DINNER_DETAIL_VIEWED` - When user views dinner details

**Event Payloads:**
```typescript
interface DinnerListViewedEvent {
  userId?: string;
  filters: {
    city?: string;
    from?: string;
    to?: string;
  };
  resultCount: number;
  timestamp: string;
}

interface DinnerDetailViewedEvent {
  userId?: string;
  dinnerId: string;
  restaurantId: string;
  theme: string;
  seatsAvailable: number;
  timestamp: string;
}
```

### 2. Repository Methods
**File:** `packages/db/src/repositories/dinner.repository.ts`

#### Method: `findPublicDinners()`
```typescript
async findPublicDinners(filters?: {
  city?: string;
  from?: Date;
  to?: Date;
}): Promise<Array<DinnerWithRestaurant & {
  _count: { seats: number };
  seats: Array<{ status: string }>;
}>>
```

**Features:**
- ✅ Efficient single query (no N+1)
- ✅ Includes seat counts via `_count`
- ✅ Includes all seat statuses for calculation
- ✅ Filters by city (case-insensitive)
- ✅ Filters by date range
- ✅ Only returns SCHEDULED or LIVE dinners
- ✅ Only returns dinners from ACTIVE restaurants
- ✅ Ordered by start time (ascending)

#### Method: `findByIdWithDetails()`
```typescript
async findByIdWithDetails(id: string): Promise<(DinnerWithRestaurant & {
  _count: { seats: number };
  seats: Array<{ status: string }>;
}) | null>
```

**Features:**
- ✅ Efficient single query
- ✅ Includes full restaurant details
- ✅ Includes seat counts and statuses
- ✅ Returns null if not found

### 3. Shared Response Types
**File:** `packages/shared/src/types/dinner.ts`

#### Types:
```typescript
interface DinnerListItem {
  id: string;
  theme: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  restaurant: {
    id: string;
    name: string;
    city: string | null;
    cuisine: string | null;
    heroImageUrl: string | null;
  };
  seats: {
    total: number;
    available: number;
    confirmed: number;
  };
}

interface DinnerDetail {
  id: string;
  theme: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  seatCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
    description: string | null;
    cuisine: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    website: string | null;
    heroImageUrl: string | null;
  };
  seats: {
    total: number;
    available: number;
    confirmed: number;
    held: number;
    attended: number;
  };
}
```

### 4. API Endpoints

#### GET /api/dinners
**File:** `apps/web/src/app/api/dinners/route.ts`

**Query Parameters:**
- `city` - Filter by city (optional, case-insensitive)
- `from` - Start date filter (optional, ISO string)
- `to` - End date filter (optional, ISO string)

**Response:**
```json
{
  "success": true,
  "data": {
    "dinners": [
      {
        "id": "cmm7xxx...",
        "theme": "Italian Night",
        "description": "Authentic Italian cuisine",
        "startsAt": "2026-03-05T19:00:00.000Z",
        "endsAt": "2026-03-05T21:00:00.000Z",
        "status": "SCHEDULED",
        "restaurant": {
          "id": "cmm7xxx...",
          "name": "Bella Italia",
          "city": "Cape Town",
          "cuisine": "Italian",
          "heroImageUrl": "https://..."
        },
        "seats": {
          "total": 12,
          "available": 8,
          "confirmed": 4
        }
      }
    ],
    "count": 1,
    "filters": {
      "city": "Cape Town"
    }
  }
}
```

**Features:**
- ✅ Public endpoint (no authentication required)
- ✅ Optional user tracking (if logged in)
- ✅ Efficient queries (no N+1)
- ✅ Live seat availability calculation
- ✅ Analytics tracking
- ✅ Error handling

#### GET /api/dinners/:id
**File:** `apps/web/src/app/api/dinners/[id]/route.ts`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmm7xxx...",
    "theme": "Italian Night",
    "description": "Authentic Italian cuisine",
    "startsAt": "2026-03-05T19:00:00.000Z",
    "endsAt": "2026-03-05T21:00:00.000Z",
    "seatCount": 12,
    "status": "SCHEDULED",
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-01T10:00:00.000Z",
    "restaurant": {
      "id": "cmm7xxx...",
      "name": "Bella Italia",
      "description": "Family-owned Italian restaurant",
      "cuisine": "Italian",
      "city": "Cape Town",
      "address": "123 Main St",
      "phone": "+27 21 123 4567",
      "website": "https://bellaitalia.com",
      "heroImageUrl": "https://..."
    },
    "seats": {
      "total": 12,
      "available": 8,
      "confirmed": 4,
      "held": 0,
      "attended": 0
    }
  }
}
```

**Features:**
- ✅ Public endpoint (no authentication required)
- ✅ Optional user tracking (if logged in)
- ✅ Full restaurant details
- ✅ Detailed seat breakdown
- ✅ Analytics tracking
- ✅ 404 if dinner not found

## Seat Availability Calculation

### Efficient Query Strategy

Instead of separate queries for each seat status, we:
1. Fetch all seats with their status in a single query
2. Calculate counts in application code
3. Avoid N+1 query problem

**Before (N+1 Problem):**
```typescript
// ❌ Bad: Multiple queries
const dinner = await prisma.dinner.findUnique({ where: { id } });
const available = await prisma.seat.count({ where: { dinnerId: id, status: "AVAILABLE" } });
const confirmed = await prisma.seat.count({ where: { dinnerId: id, status: "CONFIRMED" } });
// 3 queries per dinner!
```

**After (Single Query):**
```typescript
// ✅ Good: Single query
const dinner = await prisma.dinner.findUnique({
  where: { id },
  include: {
    seats: { select: { status: true } },
    _count: { select: { seats: true } }
  }
});

// Calculate in code
const available = dinner.seats.filter(s => s.status === "AVAILABLE").length;
const confirmed = dinner.seats.filter(s => s.status === "CONFIRMED").length;
// 1 query total!
```

### Seat Status Breakdown

```typescript
seats: {
  total: 12,        // Total seats created
  available: 8,     // Status = AVAILABLE
  confirmed: 4,     // Status = CONFIRMED
  held: 0,          // Status = HELD
  attended: 0       // Status = ATTENDED
}
```

## API Usage Examples

### List All Dinners

```typescript
const response = await fetch("/api/dinners");
const data = await response.json();

console.log(`Found ${data.data.count} dinners`);
data.data.dinners.forEach(dinner => {
  console.log(`${dinner.theme} at ${dinner.restaurant.name}`);
  console.log(`  ${dinner.seats.available}/${dinner.seats.total} seats available`);
});
```

### Filter by City

```typescript
const response = await fetch("/api/dinners?city=Cape Town");
const data = await response.json();

console.log(`Dinners in Cape Town: ${data.data.count}`);
```

### Filter by Date Range

```typescript
const from = new Date("2026-03-01").toISOString();
const to = new Date("2026-03-31").toISOString();

const response = await fetch(`/api/dinners?from=${from}&to=${to}`);
const data = await response.json();

console.log(`Dinners in March: ${data.data.count}`);
```

### Combined Filters

```typescript
const response = await fetch(
  "/api/dinners?city=Cape Town&from=2026-03-01T00:00:00Z&to=2026-03-31T23:59:59Z"
);
const data = await response.json();

console.log(`Dinners in Cape Town in March: ${data.data.count}`);
```

### Get Dinner Details

```typescript
const response = await fetch("/api/dinners/cmm7xxx...");
const data = await response.json();

if (data.success) {
  const dinner = data.data;
  console.log(`${dinner.theme} at ${dinner.restaurant.name}`);
  console.log(`Starts: ${new Date(dinner.startsAt).toLocaleString()}`);
  console.log(`Available seats: ${dinner.seats.available}`);
  console.log(`Restaurant: ${dinner.restaurant.address}`);
} else {
  console.error("Dinner not found");
}
```

## Query Performance

### Indexes

Ensure these indexes exist for optimal performance:

```sql
-- Dinner queries
CREATE INDEX IF NOT EXISTS "dinners_status_startsAt_idx" 
ON dinners (status, "startsAt");

CREATE INDEX IF NOT EXISTS "dinners_restaurantId_status_idx" 
ON dinners ("restaurantId", status);

-- Restaurant queries
CREATE INDEX IF NOT EXISTS "restaurants_status_city_idx" 
ON restaurants (status, city);

-- Seat queries
CREATE INDEX IF NOT EXISTS "seats_dinnerId_status_idx" 
ON seats ("dinnerId", status);
```

### Query Execution Plan

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT d.*, r.name, r.city
FROM dinners d
JOIN restaurants r ON d."restaurantId" = r.id
WHERE d.status IN ('SCHEDULED', 'LIVE')
  AND d."startsAt" >= NOW()
  AND r.status = 'ACTIVE'
  AND r.city ILIKE 'cape town'
ORDER BY d."startsAt" ASC;
```

## Analytics Tracking

### Metrics to Monitor

1. **List View Frequency**
   - Track `DINNER_LIST_VIEWED` events
   - Group by filters used
   - Identify popular cities/dates

2. **Detail View Rate**
   - `DINNER_DETAIL_VIEWED` / `DINNER_LIST_VIEWED`
   - Shows engagement with listings

3. **Conversion Rate**
   - `SEAT_HELD_SUCCESS` / `DINNER_DETAIL_VIEWED`
   - Shows booking conversion

### Analytics Queries

```typescript
// Get most viewed dinners
const detailViews = await track.query(AnalyticsEvents.DINNER_DETAIL_VIEWED);
const viewCounts = detailViews.reduce((acc, event) => {
  acc[event.dinnerId] = (acc[event.dinnerId] || 0) + 1;
  return acc;
}, {});

console.log("Most viewed dinners:", viewCounts);

// Get popular cities
const listViews = await track.query(AnalyticsEvents.DINNER_LIST_VIEWED);
const cityCounts = listViews.reduce((acc, event) => {
  if (event.filters.city) {
    acc[event.filters.city] = (acc[event.filters.city] || 0) + 1;
  }
  return acc;
}, {});

console.log("Popular cities:", cityCounts);
```

## Testing

### Manual Testing

1. **List dinners:**
   ```bash
   curl "http://localhost:3001/api/dinners"
   ```

2. **Filter by city:**
   ```bash
   curl "http://localhost:3001/api/dinners?city=Cape%20Town"
   ```

3. **Filter by date:**
   ```bash
   curl "http://localhost:3001/api/dinners?from=2026-03-01T00:00:00Z"
   ```

4. **Get dinner details:**
   ```bash
   curl "http://localhost:3001/api/dinners/YOUR_DINNER_ID"
   ```

### Browser Console Testing

```javascript
// List dinners
const list = await fetch("/api/dinners").then(r => r.json());
console.log("Dinners:", list.data.dinners);

// Filter by city
const filtered = await fetch("/api/dinners?city=Cape Town").then(r => r.json());
console.log("Cape Town dinners:", filtered.data.count);

// Get details
const dinnerId = list.data.dinners[0].id;
const detail = await fetch(`/api/dinners/${dinnerId}`).then(r => r.json());
console.log("Details:", detail.data);
```

### Database Verification

```sql
-- Check dinners with seat counts
SELECT 
  d.id,
  d.theme,
  r.name AS restaurant,
  d."startsAt",
  COUNT(s.id) AS total_seats,
  COUNT(CASE WHEN s.status = 'AVAILABLE' THEN 1 END) AS available,
  COUNT(CASE WHEN s.status = 'CONFIRMED' THEN 1 END) AS confirmed
FROM dinners d
JOIN restaurants r ON d."restaurantId" = r.id
LEFT JOIN seats s ON d.id = s."dinnerId"
WHERE d.status IN ('SCHEDULED', 'LIVE')
  AND r.status = 'ACTIVE'
GROUP BY d.id, d.theme, r.name, d."startsAt"
ORDER BY d."startsAt" ASC;
```

## Error Handling

### Dinner Not Found

```json
{
  "success": false,
  "error": {
    "message": "Dinner not found",
    "code": "NOT_FOUND"
  }
}
```

**HTTP Status:** 404

### Invalid Date Format

```json
{
  "success": false,
  "error": {
    "message": "Invalid date format",
    "code": "VALIDATION_ERROR"
  }
}
```

**HTTP Status:** 400

### Server Error

```json
{
  "success": false,
  "error": {
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR"
  }
}
```

**HTTP Status:** 500

## Files Changed

### New Files:
- `packages/shared/src/types/dinner.ts` - Response types
- `EPIC_3.8_COMPLETE.md` - This document

### Modified Files:
- `packages/analytics/src/events.ts` - Added list/detail viewed events
- `packages/shared/src/types/index.ts` - Export dinner types
- `packages/db/src/repositories/dinner.repository.ts` - Added findPublicDinners and findByIdWithDetails
- `apps/web/src/app/api/dinners/route.ts` - Implemented GET endpoint
- `apps/web/src/app/api/dinners/[id]/route.ts` - Implemented GET endpoint

## Success Criteria ✅

- ✅ GET /api/dinners endpoint implemented
- ✅ GET /api/dinners/:id endpoint implemented
- ✅ Query parameters (city, from, to) working
- ✅ Efficient queries (no N+1 problem)
- ✅ Live seat availability calculation
- ✅ Repository layer used
- ✅ Shared response types defined
- ✅ Analytics events emitted
- ✅ Public access (no auth required)
- ✅ Optional user tracking
- ✅ Error handling
- ✅ Documentation complete

## Status: ✅ COMPLETE

The dinner list and detail APIs are complete and ready for use.

### Key Features:
- ✅ Efficient single-query approach
- ✅ Live seat availability
- ✅ Flexible filtering
- ✅ Public access
- ✅ Analytics tracking
- ✅ Type-safe responses

## Quick Test

```bash
# List all dinners
curl "http://localhost:3001/api/dinners"

# Filter by city
curl "http://localhost:3001/api/dinners?city=Cape%20Town"

# Get dinner details
curl "http://localhost:3001/api/dinners/YOUR_DINNER_ID"
```

## Next Steps

- EPIC 3.9: Dinner search with full-text search
- EPIC 3.10: Dinner recommendations based on user preferences
- EPIC 3.11: Dinner UI screens (list and detail pages)
- EPIC 3.12: Booking flow UI
