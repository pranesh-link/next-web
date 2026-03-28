-- Rename AccountType enum values: BANK → SAVINGS_ACCOUNT, CASH → SAVINGS_ACCOUNT (migrate all to savings)
-- Add new enum values: CREDIT_ACCOUNT, RECURRING_DEPOSIT, FIXED_DEPOSIT

-- Step 1: Rename old enum and create new one with all values
ALTER TYPE "AccountType" RENAME TO "AccountType_old";

CREATE TYPE "AccountType" AS ENUM ('SAVINGS_ACCOUNT', 'CREDIT_ACCOUNT', 'CREDIT_CARD', 'RECURRING_DEPOSIT', 'FIXED_DEPOSIT');

-- Step 2: Migrate column, mapping old values to new
ALTER TABLE "financial_accounts" ALTER COLUMN "type" TYPE "AccountType" USING (
  CASE
    WHEN "type"::text IN ('BANK', 'CASH') THEN 'SAVINGS_ACCOUNT'
    ELSE "type"::text
  END
)::"AccountType";

-- Step 3: Drop old enum
DROP TYPE "AccountType_old";
