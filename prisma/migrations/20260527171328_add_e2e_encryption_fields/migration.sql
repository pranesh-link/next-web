-- AlterTable
ALTER TABLE "couple_chat_messages" ADD COLUMN     "encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "iv" TEXT;

-- AlterTable
ALTER TABLE "couple_messages" ADD COLUMN     "encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "iv" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "publicKey" TEXT;
