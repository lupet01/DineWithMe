-- Add DRAFT to DinnerStatus enum (a dinner is created as DRAFT and stays
-- editable until Publish flips it to SCHEDULED, at which point its content
-- locks). Postgres requires ALTER TYPE ... ADD VALUE to run outside a
-- transaction block when the new value might be used later in the same
-- transaction, so this migration is split into its own statement.
ALTER TYPE "DinnerStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

-- Business-level contact email for the restaurant itself, distinct from
-- any individual Team member's personal login email.
ALTER TABLE "restaurants" ADD COLUMN "contactEmail" TEXT;
