-- CreateEnum
CREATE TYPE "InvestmentAssetType" AS ENUM ('GOLD', 'SILVER', 'STOCK', 'MUTUAL_FUND');

-- CreateEnum
CREATE TYPE "InvestmentMode" AS ENUM ('LUMPSUM', 'SIP');

-- CreateEnum
CREATE TYPE "StockExchange" AS ENUM ('NSE', 'BSE');

-- CreateEnum
CREATE TYPE "DepositType" AS ENUM ('RECURRING_DEPOSIT', 'FIXED_DEPOSIT');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('ACTIVE', 'MATURED');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'MISSED');

-- CreateTable
CREATE TABLE "investment_holdings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT,
    "name" TEXT NOT NULL,
    "assetType" "InvestmentAssetType" NOT NULL,
    "mode" "InvestmentMode" NOT NULL DEFAULT 'LUMPSUM',
    "ticker" TEXT,
    "exchange" "StockExchange",
    "quantity" DOUBLE PRECISION,
    "quantityGrams" DOUBLE PRECISION,
    "investedAmount" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "sipAmount" DOUBLE PRECISION,
    "sipDayOfMonth" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextSipDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_instruments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "type" "DepositType" NOT NULL,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "installmentAmount" DOUBLE PRECISION,
    "paidInstallments" INTEGER NOT NULL DEFAULT 0,
    "totalInstallments" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "maturityAmount" DOUBLE PRECISION NOT NULL,
    "nextInstallmentDate" TIMESTAMP(3),
    "status" "DepositStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_installments" (
    "id" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_installments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investment_holdings_userId_idx" ON "investment_holdings"("userId");

-- CreateIndex
CREATE INDEX "investment_holdings_assetType_idx" ON "investment_holdings"("assetType");

-- CreateIndex
CREATE INDEX "investment_holdings_nextSipDate_idx" ON "investment_holdings"("nextSipDate");

-- CreateIndex
CREATE INDEX "deposit_instruments_userId_idx" ON "deposit_instruments"("userId");

-- CreateIndex
CREATE INDEX "deposit_instruments_type_idx" ON "deposit_instruments"("type");

-- CreateIndex
CREATE INDEX "deposit_instruments_maturityDate_idx" ON "deposit_instruments"("maturityDate");

-- CreateIndex
CREATE INDEX "deposit_instruments_nextInstallmentDate_idx" ON "deposit_instruments"("nextInstallmentDate");

-- CreateIndex
CREATE INDEX "deposit_instruments_sourceAccountId_idx" ON "deposit_instruments"("sourceAccountId");

-- CreateIndex
CREATE INDEX "deposit_installments_depositId_idx" ON "deposit_installments"("depositId");

-- CreateIndex
CREATE INDEX "deposit_installments_dueDate_idx" ON "deposit_installments"("dueDate");

-- AddForeignKey
ALTER TABLE "investment_holdings" ADD CONSTRAINT "investment_holdings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_instruments" ADD CONSTRAINT "deposit_instruments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_installments" ADD CONSTRAINT "deposit_installments_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "deposit_instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
