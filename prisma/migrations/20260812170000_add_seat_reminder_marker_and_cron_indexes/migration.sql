-- send-reminders idempotency marker: set once the 24h reminder for a seat has
-- been emailed, so a cron re-run within the same window skips already-reminded
-- seats rather than double-emailing the guest.
ALTER TABLE "seats" ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);

-- Cron-serving indexes (audit finding M3): expire-holds scans
-- (status='HELD' AND holdExpiresAt <= now) and mark-no-shows scans
-- (status='CONFIRMED' AND checkedInAt IS NULL) were previously served by no
-- index (only [dinnerId, status] existed).
CREATE INDEX IF NOT EXISTS "seats_status_holdExpiresAt_idx" ON "seats"("status", "holdExpiresAt");
CREATE INDEX IF NOT EXISTS "seats_status_checkedInAt_idx" ON "seats"("status", "checkedInAt");
