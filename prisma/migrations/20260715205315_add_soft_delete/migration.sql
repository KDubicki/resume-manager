-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Resume_userId_deletedAt_idx" ON "Resume"("userId", "deletedAt");
