-- Rename AccountType enum values: BANK → SAVINGS_ACCOUNT, CASH → SAVINGS_ACCOUNT (migrate all to savings)
-- Add new enum values: CREDIT_ACCOUNT, RECURRING_DEPOSIT, FIXED_DEPOSIT

-- Step 1: Add new enum values
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'SAVINGS_ACCOUNT';
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'CREDIT_ACCOUNT';
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'RECURRING_DEPOSIT';
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'FIXED_DEPOSIT';

-- Step 2: Migrate existing accounts to SAVINGS_ACCOUNT
UPDATE "financial_accounts" SET "type" = 'SAVINGS_ACCOUNT' WHERE "type" IN ('BANK', 'CASH');

-- Step 3: Remove old enum values by recreating the enum
-- (PostgreSQL doesn't support DROP VALUE, so we recreate)
ALTER TYPE "AccountType" RENAME TO "AccountType_old";

CREATE TYPE "AccountType" AS ENUM ('SAVINGS_ACCOUNT', 'CREDIT_ACCOUNT', 'CREDIT_CARD', 'RECURRING_DEPOSIT', 'FIXED_DEPOSIT');

ALTER TABLE "financial_accounts" ALTER COLUMN "type" TYPE "AccountType" USING "type"::text::"AccountType";

DROP TYPE "AccountType_old";
