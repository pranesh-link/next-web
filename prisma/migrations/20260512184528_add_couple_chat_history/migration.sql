-- CreateTable
CREATE TABLE "couple_chats" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couple_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couple_chat_messages" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "couple_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "couple_chats_coupleId_idx" ON "couple_chats"("coupleId");

-- CreateIndex
CREATE INDEX "couple_chat_messages_chatId_idx" ON "couple_chat_messages"("chatId");

-- AddForeignKey
ALTER TABLE "couple_chat_messages" ADD CONSTRAINT "couple_chat_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "couple_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
