DO $$ BEGIN
  CREATE TYPE "LoyaltyRewardType" AS ENUM ('PARTNER_FOOD', 'WASH_DISCOUNT', 'AUTO_PARTNER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "DemoMovementType" ADD VALUE IF NOT EXISTS 'MOZA_BONUS_CREDIT';

ALTER TABLE "DemoWallet" ADD COLUMN IF NOT EXISTS "mozaCreditBalanceMzn" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DemoMovement" ADD COLUMN IF NOT EXISTS "mozaCreditAmountMzn" INTEGER NOT NULL DEFAULT 0;
DROP INDEX IF EXISTS "DemoMovement_bookingId_type_key";

CREATE TABLE IF NOT EXISTS "RewardRedemption" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "rewardType" "LoyaltyRewardType" NOT NULL,
  "pointsSpent" INTEGER NOT NULL,
  "promoCreditGrantedMzn" INTEGER NOT NULL DEFAULT 0,
  "code" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RewardRedemption_code_key" ON "RewardRedemption"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "RewardRedemption_idempotencyKey_key" ON "RewardRedemption"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "RewardRedemption_customerId_createdAt_idx" ON "RewardRedemption"("customerId", "createdAt");
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "DemoWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
