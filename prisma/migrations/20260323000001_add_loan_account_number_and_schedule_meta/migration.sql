-- Add loan_account_number and schedule_generated_on to loans table
ALTER TABLE "loans" ADD COLUMN "loan_account_number" TEXT;
ALTER TABLE "loans" ADD COLUMN "schedule_generated_on" TEXT;
