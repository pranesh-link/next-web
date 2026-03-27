-- CreateTable
CREATE TABLE "balance_history" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balance_history_accountId_idx" ON "balance_history"("accountId");

-- CreateIndex
CREATE INDEX "balance_history_userId_idx" ON "balance_history"("userId");

-- AddForeignKey
ALTER TABLE "balance_history" ADD CONSTRAINT "balance_history_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
