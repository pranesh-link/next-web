/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,featureId]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_type_featureId_key" ON "notifications"("userId", "type", "featureId");
