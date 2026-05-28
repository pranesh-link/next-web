/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,featureId]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex (safe - only if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_userId_type_featureId_key" ON "notifications"("userId", "type", "featureId");
