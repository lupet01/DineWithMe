-- Dinner cancellation requests: a restaurant admin files a review request to
-- cancel a dinner (releasing paid seats + refunding guests is admin-mediated,
-- mirroring restaurant_closure_requests). Platform Ops approves or rejects.
DO $$ BEGIN
  CREATE TYPE "DinnerCancellationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "dinner_cancellation_requests" (
    "id" TEXT NOT NULL,
    "dinnerId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DinnerCancellationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dinner_cancellation_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dinner_cancellation_requests_dinnerId_idx" ON "dinner_cancellation_requests"("dinnerId");
CREATE INDEX IF NOT EXISTS "dinner_cancellation_requests_status_idx" ON "dinner_cancellation_requests"("status");

ALTER TABLE "dinner_cancellation_requests" ADD CONSTRAINT "dinner_cancellation_requests_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "dinners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dinner_cancellation_requests" ADD CONSTRAINT "dinner_cancellation_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dinner_cancellation_requests" ADD CONSTRAINT "dinner_cancellation_requests_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
