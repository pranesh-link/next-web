-- CreateEnum
CREATE TYPE "DepositInstallmentFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- AlterTable
ALTER TABLE "deposit_instruments" ADD COLUMN     "installmentFrequency" "DepositInstallmentFrequency" NOT NULL DEFAULT 'MONTHLY';
