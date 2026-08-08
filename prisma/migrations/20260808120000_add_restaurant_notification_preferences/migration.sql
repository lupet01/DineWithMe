-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "notifyNewBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyCancellation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyLowFillRateWarning" BOOLEAN NOT NULL DEFAULT true;
