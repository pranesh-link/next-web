-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notifications_userId_archived_idx" ON "notifications"("userId", "archived");
