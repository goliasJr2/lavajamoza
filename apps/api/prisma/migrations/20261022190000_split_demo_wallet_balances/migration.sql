ALTER TYPE "DemoMovementType" ADD VALUE 'PROMO_CREDIT';

ALTER TABLE "DemoWallet"
  ADD COLUMN "loadedBalanceMzn" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "promoBalanceMzn" INTEGER NOT NULL DEFAULT 0;

-- Preserve existing totals. Earlier movements did not track their funding source,
-- so balances present at migration time are carried into the loaded bucket.
UPDATE "DemoWallet" SET "loadedBalanceMzn" = "balanceMzn";

ALTER TABLE "DemoMovement"
  ADD COLUMN "loadedAmountMzn" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "promoAmountMzn" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "DemoWallet" DROP COLUMN "balanceMzn";
