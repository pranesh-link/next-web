-- Add pinnedAt to couple_messages for message pinning feature
ALTER TABLE "couple_messages" ADD COLUMN "pinnedAt" TIMESTAMP(3);
