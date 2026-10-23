CREATE TYPE "RecordedPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED');
ALTER TYPE "RecordedPaymentMethod" ADD VALUE 'MOZA_POS_DEMO';
ALTER TABLE "RecordedPayment" ALTER COLUMN "staffUserId" DROP NOT NULL;
ALTER TABLE "RecordedPayment" ADD COLUMN "status" "RecordedPaymentStatus" NOT NULL DEFAULT 'CONFIRMED';
