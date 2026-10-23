ALTER TABLE "Customer" ADD COLUMN "cardCode" TEXT NOT NULL DEFAULT ('card_' || md5(random()::text || clock_timestamp()::text));
CREATE UNIQUE INDEX "Customer_cardCode_key" ON "Customer"("cardCode");
