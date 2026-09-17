-- AlterTable
ALTER TABLE "RoommateMatch" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RoommatePreference" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RoommateMatch_deletedAt_idx" ON "RoommateMatch"("deletedAt");

-- CreateIndex
CREATE INDEX "RoommatePreference_deletedAt_idx" ON "RoommatePreference"("deletedAt");
