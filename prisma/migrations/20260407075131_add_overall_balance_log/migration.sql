-- CreateEnum
CREATE TYPE "BalanceChangeReason" AS ENUM ('ACCOUNT_ADDED', 'ACCOUNT_REMOVED', 'BALANCE_UPDATED');

-- CreateTable
CREATE TABLE "overall_balance_log" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "accountName" TEXT NOT NULL,
    "reason" "BalanceChangeReason" NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "totalBalance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overall_balance_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "overall_balance_log_coupleId_idx" ON "overall_balance_log"("coupleId");

-- CreateIndex
CREATE INDEX "overall_balance_log_userId_idx" ON "overall_balance_log"("userId");
