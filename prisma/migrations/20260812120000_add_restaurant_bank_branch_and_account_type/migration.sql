-- Branch code and account type for the restaurant's payout destination
-- (wireframe §sec-payouts / §sec-update-bank-details). Both are non-sensitive
-- plaintext, unlike the encrypted bankAccountNumber. IF NOT EXISTS keeps this
-- idempotent if applied out-of-band via `prisma db execute`.
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "bankBranchCode" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "bankAccountType" TEXT;
