CREATE TYPE "DemoMovementType" AS ENUM ('LOAD', 'PAYMENT', 'POINTS_EARNED');

CREATE TABLE "DemoWallet" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "balanceMzn" INTEGER NOT NULL DEFAULT 0,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DemoWallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DemoMovement" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" "DemoMovementType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemoMovement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DemoWallet_customerId_key" ON "DemoWallet"("customerId");
CREATE UNIQUE INDEX "DemoMovement_idempotencyKey_key" ON "DemoMovement"("idempotencyKey");
CREATE UNIQUE INDEX "DemoMovement_bookingId_type_key" ON "DemoMovement"("bookingId", "type");
CREATE INDEX "DemoMovement_walletId_createdAt_idx" ON "DemoMovement"("walletId", "createdAt");
ALTER TABLE "DemoWallet" ADD CONSTRAINT "DemoWallet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemoMovement" ADD CONSTRAINT "DemoMovement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "DemoWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemoMovement" ADD CONSTRAINT "DemoMovement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DemoMovement" ADD CONSTRAINT "DemoMovement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
