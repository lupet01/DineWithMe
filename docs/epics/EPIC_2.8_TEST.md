# EPIC 2.8: Testing Audit Trail

## Setup Complete ✅

- Database schema synced
- Prisma client generated
- audit_logs table created

---

## Test the Audit Trail

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Perform Admin Actions

Go through these actions to generate audit logs:

#### Test Restaurant Update
1. Go to: http://localhost:3001/admin/restaurant
2. Update any field (name, description, etc.)
3. Click "Update Restaurant"
4. This should log: `restaurant_updated`

#### Test Dinner Status Change
1. Go to: http://localhost:3001/admin/dinners
2. Click "Mark Live" on a SCHEDULED dinner
3. This should log: `dinner_status_changed`

#### Test Dinner Cancellation
1. On dinners page
2. Click "Cancel" on a dinner
3. This should log: `dinner_cancelled`

#### Test Restaurant Approval (if PLATFORM_ADMIN)
1. Go to: http://localhost:3001/admin/ops/restaurants
2. Click "Approve" on a PENDING restaurant
3. This should log: `restaurant_approved`

### 3. Check Audit Logs

After performing actions, check the database:

```bash
# Count audit logs
psql -U postgres -d dinewithme -c "SELECT COUNT(*) FROM audit_logs;"

# View recent logs (simple)
psql -U postgres -d dinewithme -c "SELECT id, \"actionType\", \"entityType\", \"entityId\" FROM audit_logs LIMIT 10;"

# View with actor info
psql -U postgres -d dinewithme -c "SELECT al.\"actionType\", al.\"entityType\", u.email, al.\"createdAt\" FROM audit_logs al JOIN users u ON al.\"actorUserId\" = u.id ORDER BY al.\"createdAt\" DESC LIMIT 10;"

# View metadata
psql -U postgres -d dinewithme -c "SELECT \"actionType\", metadata FROM audit_logs LIMIT 5;"
```

---

## Expected Results

After performing actions, you should see:

### Restaurant Update
```
actionType: restaurant_updated
entityType: restaurant
metadata: {"fields": ["name"], "changes": {...}}
```

### Dinner Status Change
```
actionType: dinner_status_changed
entityType: dinner
metadata: {"oldStatus": "SCHEDULED", "newStatus": "LIVE", ...}
```

### Dinner Cancellation
```
actionType: dinner_cancelled
entityType: dinner
metadata: {"releasedSeats": 6, "theme": "...", ...}
```

### Restaurant Approval
```
actionType: restaurant_approved
entityType: restaurant
metadata: {"restaurantName": "...", "previousStatus": "PENDING"}
```

---

## Verify Audit Trail

### Check Actor is Correct
```bash
psql -U postgres -d dinewithme -c "SELECT al.\"actionType\", u.email FROM audit_logs al JOIN users u ON al.\"actorUserId\" = u.id;"
```

Should show your email for all actions.

### Check Timestamps
```bash
psql -U postgres -d dinewithme -c "SELECT \"actionType\", \"createdAt\" FROM audit_logs ORDER BY \"createdAt\" DESC;"
```

Should show recent timestamps.

### Check Metadata
```bash
psql -U postgres -d dinewithme -c "SELECT \"actionType\", metadata::text FROM audit_logs WHERE \"actionType\" = 'dinner_cancelled';"
```

Should show JSON metadata with relevant info.

---

## Troubleshooting

### No Audit Logs Created

**Check**:
1. Did the action succeed? (Check for success message)
2. Any errors in server console?
3. Is auditLogger imported correctly?

**Debug**:
```bash
# Check if table exists
psql -U postgres -d dinewithme -c "\d audit_logs"

# Check user exists
psql -U postgres -d dinewithme -c "SELECT id, email FROM users;"
```

### Audit Logging Errors

Check server console for errors like:
```
[AuditLogger] Failed to log action: ...
```

These are caught and logged but don't break the main flow.

---

## Success Criteria

✅ audit_logs table exists  
✅ Audit logs created for each action  
✅ Actor user ID is correct  
✅ Action type matches the action  
✅ Entity type and ID are correct  
✅ Metadata contains relevant info  
✅ Timestamps are recent  
✅ Main actions still work (audit logging doesn't break flow)  

---

## Next Steps

Once audit trail is working:

1. **View Audit Logs in UI** (future enhancement)
   - Create admin page to view logs
   - Filter by user, action, entity
   - Export to CSV

2. **Set Up Retention Policy**
   - Automatically delete old logs
   - Archive to cold storage

3. **Add Notifications**
   - Alert on critical actions
   - Slack/email integration

---

## Quick Test Commands

```bash
# Start server
npm run dev

# After performing actions, check logs
psql -U postgres -d dinewithme -c "SELECT COUNT(*) FROM audit_logs;"

# View recent actions
psql -U postgres -d dinewithme -c "SELECT \"actionType\", \"entityType\" FROM audit_logs ORDER BY \"createdAt\" DESC LIMIT 5;"

# View with actor
psql -U postgres -d dinewithme -c "SELECT al.\"actionType\", u.email FROM audit_logs al JOIN users u ON al.\"actorUserId\" = u.id LIMIT 5;"
```

---

## Summary

The audit trail is ready to use! Every admin action will now be logged with:
- Who did it (actor)
- What they did (action type)
- What was affected (entity type and ID)
- Additional context (metadata)
- When it happened (timestamp)

Start the dev server and perform some actions to see the audit trail in action!
