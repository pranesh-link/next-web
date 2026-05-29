-- CreateIndex: partial index to efficiently find unencrypted messages per couple/sender
CREATE INDEX idx_couple_messages_unencrypted
ON "CoupleMessage" ("coupleId", "senderId", "createdAt")
WHERE encrypted = false;
