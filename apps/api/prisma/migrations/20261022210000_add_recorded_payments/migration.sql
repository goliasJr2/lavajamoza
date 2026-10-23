CREATE TYPE "RecordedPaymentMethod" AS ENUM ('CASH', 'OTHER');
CREATE TABLE "RecordedPayment" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "staffUserId" TEXT NOT NULL,
  "amountMzn" INTEGER NOT NULL,
  "method" "RecordedPaymentMethod" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecordedPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecordedPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RecordedPayment_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RecordedPayment_bookingId_key" ON "RecordedPayment"("bookingId");
CREATE INDEX "RecordedPayment_createdAt_idx" ON "RecordedPayment"("createdAt");
