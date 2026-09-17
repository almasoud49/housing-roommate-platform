-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");
