CREATE TYPE "CustomerAccountType" AS ENUM ('INDIVIDUAL', 'BUSINESS');
CREATE TYPE "CustomerAccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');

ALTER TABLE "Customer"
  ADD COLUMN "accountType" "CustomerAccountType" NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN "accountStatus" "CustomerAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "businessName" TEXT,
  ADD COLUMN "nuit" TEXT,
  ADD COLUMN "businessReviewedAt" TIMESTAMP(3),
  ADD COLUMN "businessReviewedById" TEXT;

CREATE UNIQUE INDEX "Customer_nuit_key" ON "Customer"("nuit");
CREATE INDEX "Customer_accountType_accountStatus_createdAt_idx" ON "Customer"("accountType", "accountStatus", "createdAt");
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessReviewedById_fkey"
  FOREIGN KEY ("businessReviewedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Vehicle" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "BookingRating" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "comment" VARCHAR(1000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingRating_bookingId_key" ON "BookingRating"("bookingId");
CREATE INDEX "BookingRating_createdAt_idx" ON "BookingRating"("createdAt");
CREATE INDEX "BookingRating_customerId_createdAt_idx" ON "BookingRating"("customerId", "createdAt");
ALTER TABLE "BookingRating" ADD CONSTRAINT "BookingRating_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRating" ADD CONSTRAINT "BookingRating_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
