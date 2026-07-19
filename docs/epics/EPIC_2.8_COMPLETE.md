# EPIC 2.8: Admin Action Audit Trail - Complete ✅

## Overview
Implemented comprehensive audit logging system to track all admin actions for compliance, debugging, and accountability.

---

## What Was Implemented

### 1. Database Schema
**File**: `prisma/schema.prisma`

Added `AuditLog` model:
- `id` - Unique identifier
- `actorUserId` - User who performed the action
- `actionType` - Type of action (e.g., "restaurant_created")
- `entityType` - Type of entity (e.g., "restaurant", "dinner")
- `entityId` - ID of the affected entity
- `metadata` - JSON field for additional context
- `createdAt` - Timestamp of action

Indexes for efficient querying:
- `actorUserId` - Find actions by user
- `entityType + entityId` - Find actions for specific entity
- `actionType` - Find actions by type
- `createdAt` - Sort by time

### 2. Audit Log Repository
**File**: `packages/db/src/repositories/audit-log.repository.ts`

Methods:
- `findById()` - Get single audit log
- `findMany()` - Get recent audit logs with actor info
- `findByActor()` - Get all actions by a user
- `findByEntity()` - Get all actions for an entity
- `findByActionType()` - Get all actions of a type
- `log()` - Create audit log entry
- `deleteOlderThan()` - Cleanup old logs

### 3. Audit Logger Utility
**File**: `packages/db/src/utils/audit-logger.ts`

Simple, readable API for logging actions:

```typescript
// Generic log
await auditLogger.log(userId, actionType, entityType, entityId, metadata);

// Convenience methods
await auditLogger.restaurantCreated(userId, restaurantId, metadata);
await auditLogger.restaurantUpdated(userId, restaurantId, metadata);
await auditLogger.restaurantApproved(userId, restaurantId, metadata);
await auditLogger.restaurantPaused(userId, restaurantId, metadata);
await auditLogger.mediaUploaded(userId, mediaId, metadata);
await auditLogger.mediaDeleted(userId, mediaId, metadata);
await auditLogger.dinnerCreated(userId, dinnerId, metadata);
await auditLogger.dinnerCancelled(userId, dinnerId, metadata);
await auditLogger.dinnerStatusChanged(userId, dinnerId, metadata);
```

Features:
- Type-safe action and entity types
- Automatic error handling (doesn't break main flow)
- Consistent metadata structure
- Easy to extend

### 4. Integration Points

Audit logging added to all admin actions:

#### Restaurant Actions
**File**: `apps/web/src/app/admin/restaurant/actions.ts`

- `createRestaurant()` - Logs restaurant creation with name, cuisine, city
- `updateRestaurant()` - Logs updates with changed fields

#### Dinner Actions
**File**: `apps/web/src/app/admin/dinners/actions.ts`

- `updateDinnerStatus()` - Logs status changes with old/new status
- `cancelDinner()` - Logs cancellation with released seats

#### Ops Actions
**File**: `apps/web/src/app/admin/ops/restaurants/actions.ts`

- `approveRestaurant()` - Logs approval with previous status
- `pauseRestaurant()` - Logs pause with reason

#### Media Actions
**File**: `apps/web/src/app/admin/restaurant/media-actions.ts`

- `saveMediaRecord()` - Logs media upload with type and key
- `deleteMedia()` - Logs media deletion with type and key

---

## Action Types Logged

### Restaurant Actions
- `restaurant_created` - New restaurant registered
- `restaurant_updated` - Restaurant profile updated
- `restaurant_approved` - Restaurant approved by platform admin
- `restaurant_paused` - Restaurant paused by platform admin

### Media Actions
- `media_uploaded` - Image uploaded (hero or gallery)
- `media_deleted` - Image deleted

### Dinner Actions
- `dinner_created` - New dinner created
- `dinner_updated` - Dinner details updated
- `dinner_cancelled` - Dinner cancelled
- `dinner_status_changed` - Dinner status changed (SCHEDULED → LIVE → COMPLETED)

---

## Entity Types

- `restaurant` - Restaurant entities
- `media` - Media/image entities
- `dinner` - Dinner event entities
- `user` - User entities

---

## Metadata Examples

### Restaurant Created
```json
{
  "name": "Nolz Kitchen",
  "cuisine": "Italian",
  "city": "Cape Town"
}
```

### Restaurant Updated
```json
{
  "fields": ["name", "description", "phone"],
  "changes": {
    "name": "New Name",
    "description": "Updated description"
  }
}
```

### Dinner Status Changed
```json
{
  "oldStatus": "SCHEDULED",
  "newStatus": "LIVE",
  "restaurantId": "...",
  "theme": "Italian Night"
}
```

### Dinner Cancelled
```json
{
  "restaurantId": "...",
  "theme": "Sushi Experience",
  "scheduledAt": "2026-03-05T19:00:00Z",
  "releasedSeats": 6
}
```

### Media Uploaded
```json
{
  "restaurantId": "...",
  "type": "HERO",
  "key": "restaurants/.../hero/image.png"
}
```

### Restaurant Approved
```json
{
  "restaurantName": "Nolz Kitchen",
  "previousStatus": "PENDING"
}
```

### Restaurant Paused
```json
{
  "restaurantName": "Nolz Kitchen",
  "previousStatus": "ACTIVE",
  "reason": "Quality concerns"
}
```

---

## Querying Audit Logs

### Get Recent Actions
```typescript
const logs = await auditLogRepository.findMany(50);
// Returns 50 most recent actions with actor info
```

### Get Actions by User
```typescript
const userActions = await auditLogRepository.findByActor(userId, 100);
// Returns all actions by this user
```

### Get Actions for Entity
```typescript
const restaurantHistory = await auditLogRepository.findByEntity(
  "restaurant",
  restaurantId,
  100
);
// Returns all actions for this restaurant
```

### Get Actions by Type
```typescript
const approvals = await auditLogRepository.findByActionType(
  "restaurant_approved",
  50
);
// Returns all restaurant approvals
```

---

## Files Created

1. `packages/db/src/repositories/audit-log.repository.ts`
2. `packages/db/src/utils/audit-logger.ts`

## Files Modified

1. `prisma/schema.prisma` - Added AuditLog model
2. `packages/db/src/repositories/index.ts` - Exported audit log repository
3. `packages/db/src/index.ts` - Exported audit logger utility
4. `apps/web/src/app/admin/restaurant/actions.ts` - Added audit logging
5. `apps/web/src/app/admin/dinners/actions.ts` - Added audit logging
6. `apps/web/src/app/admin/ops/restaurants/actions.ts` - Added audit logging
7. `apps/web/src/app/admin/restaurant/media-actions.ts` - Added audit logging

---

## Setup Instructions

### 1. Sync Database Schema

Stop dev server, then:
```bash
cd prisma
npx prisma db push
npx prisma generate
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Test Audit Logging

Perform any admin action (create restaurant, update dinner, etc.) and check the database:

```bash
psql -U postgres -d dinewithme -c "SELECT * FROM audit_logs ORDER BY \"createdAt\" DESC LIMIT 10;"
```

You should see audit log entries with:
- Actor user ID
- Action type
- Entity type and ID
- Metadata JSON
- Timestamp

---

## Usage Examples

### In Server Actions

```typescript
import { auditLogger } from "@dinewithme/db";

// After performing an action
await auditLogger.restaurantCreated(user.id, restaurant.id, {
  name: restaurant.name,
  cuisine: restaurant.cuisine,
});
```

### Custom Actions

```typescript
import { auditLogger, AuditAction, AuditEntity } from "@dinewithme/db";

await auditLogger.log(
  userId,
  AuditAction.RESTAURANT_UPDATED,
  AuditEntity.RESTAURANT,
  restaurantId,
  {
    customField: "value",
    anotherField: 123,
  }
);
```

---

## Benefits

### Compliance
- Track all admin actions for regulatory compliance
- Audit trail for financial transactions
- Proof of who did what and when

### Debugging
- Trace issues back to specific actions
- Understand sequence of events
- Identify problematic patterns

### Accountability
- Know who made changes
- Prevent unauthorized actions
- Resolve disputes

### Analytics
- Understand admin behavior
- Identify bottlenecks
- Optimize workflows

---

## Future Enhancements

1. **Audit Log Viewer UI**
   - Admin page to view audit logs
   - Filter by user, action, entity, date
   - Export to CSV

2. **Real-time Notifications**
   - Alert on critical actions
   - Slack/email notifications
   - Webhook integrations

3. **Retention Policies**
   - Automatic cleanup of old logs
   - Archive to cold storage
   - Compliance with data retention laws

4. **Advanced Querying**
   - Full-text search in metadata
   - Date range filters
   - Aggregations and reports

5. **Rollback Capability**
   - Undo actions based on audit log
   - Restore previous state
   - Conflict resolution

---

## Security Considerations

✅ Audit logs are immutable (no update/delete methods)  
✅ Actor ID always recorded  
✅ Timestamps automatically set  
✅ Metadata stored as JSON for flexibility  
✅ Indexes for efficient querying  
✅ Error handling doesn't break main flow  
✅ Cascade delete when user is deleted  

---

## Performance Notes

- Audit logging is async and doesn't block main flow
- Errors in audit logging are caught and logged
- Indexes on common query patterns
- JSON metadata for flexible storage
- Cleanup method for old logs

---

## Summary

EPIC 2.8 is complete with a comprehensive audit logging system. All admin actions are now tracked with:
- Who performed the action (actor)
- What action was performed (action type)
- What entity was affected (entity type and ID)
- Additional context (metadata)
- When it happened (timestamp)

The system is simple, readable, and easy to extend. Audit logs provide accountability, debugging capability, and compliance support for the platform.
