CREATE TYPE "LocalPlaceCategory" AS ENUM ('SHOPS', 'FOOD', 'ENTERTAINMENT');

CREATE TABLE "LocalPlace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LocalPlaceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LocalPlace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerNotification" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocalPlace_name_key" ON "LocalPlace"("name");
CREATE INDEX "LocalPlace_isActive_category_idx" ON "LocalPlace"("isActive", "category");
CREATE INDEX "CustomerNotification_customerId_createdAt_idx" ON "CustomerNotification"("customerId", "createdAt");
CREATE INDEX "CustomerNotification_customerId_readAt_idx" ON "CustomerNotification"("customerId", "readAt");
ALTER TABLE "CustomerNotification" ADD CONSTRAINT "CustomerNotification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerNotification" ADD CONSTRAINT "CustomerNotification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
