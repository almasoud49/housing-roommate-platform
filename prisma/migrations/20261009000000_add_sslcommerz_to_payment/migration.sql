-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "gateway" TEXT,
ADD COLUMN "sslCommerzTranId" TEXT,
ADD COLUMN "sslCommerzValId" TEXT,
ADD COLUMN "sslCommerzCreateResponse" JSONB,
ADD COLUMN "sslCommerzValidateResponse" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_sslCommerzTranId_key" ON "Payment"("sslCommerzTranId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_sslCommerzValId_key" ON "Payment"("sslCommerzValId");

-- CreateIndex
CREATE INDEX "Payment_sslCommerzTranId_idx" ON "Payment"("sslCommerzTranId");

-- CreateIndex
CREATE INDEX "Payment_sslCommerzValId_idx" ON "Payment"("sslCommerzValId");
