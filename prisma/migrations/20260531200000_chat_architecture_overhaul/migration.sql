-- Chat Architecture Overhaul
-- 1. Add encrypted key vault to users
-- 2. Add deliveredAt to couple_messages for ACK-based deletion
-- 3. Add index for efficient purge queries

ALTER TABLE "users" ADD COLUMN "encryptedKeyVault" BYTEA;

ALTER TABLE "couple_messages" ADD COLUMN "deliveredAt" TIMESTAMP(3);

CREATE INDEX "couple_messages_coupleId_deliveredAt_idx" ON "couple_messages"("coupleId", "deliveredAt");
