CREATE TYPE "CustomerNotificationType" AS ENUM ('BOOKING', 'REMINDER', 'PROMOTION', 'MARKETPLACE');
CREATE TYPE "PromotionCampaignStatus" AS ENUM ('SCHEDULED', 'SENT', 'CANCELLED');

CREATE TABLE "PromotionCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "PromotionCampaignStatus" NOT NULL DEFAULT 'SCHEDULED',
    "actionUrl" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromotionCampaign_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CustomerNotification"
    ADD COLUMN "campaignId" TEXT,
    ADD COLUMN "type" "CustomerNotificationType" NOT NULL DEFAULT 'BOOKING',
    ADD COLUMN "actionUrl" TEXT,
    ADD COLUMN "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP INDEX "CustomerNotification_customerId_createdAt_idx";
CREATE INDEX "CustomerNotification_customerId_availableAt_createdAt_idx"
    ON "CustomerNotification"("customerId", "availableAt", "createdAt");
CREATE INDEX "PromotionCampaign_status_scheduledAt_idx"
    ON "PromotionCampaign"("status", "scheduledAt");
ALTER TABLE "CustomerNotification"
    ADD CONSTRAINT "CustomerNotification_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "PromotionCampaign"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
