-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Room_deletedAt_idx" ON "Room"("deletedAt");
