-- Drop bKash columns (SSLCommerz is now the sole payment gateway).
-- Indexes on these columns are dropped automatically with the columns.
ALTER TABLE "Payment" DROP COLUMN "bkashPaymentId",
DROP COLUMN "bkashCreateResponse",
DROP COLUMN "bkashExecuteResponse",
DROP COLUMN "gateway";
