-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "isEmergencyFund" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;
