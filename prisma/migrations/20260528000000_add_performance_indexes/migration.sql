-- Add performance indexes based on common query patterns

-- Account indexes
CREATE INDEX IF NOT EXISTS "auth_accounts_userId_idx" ON "auth_accounts"("userId");

-- Transaction indexes  
CREATE INDEX IF NOT EXISTS "transactions_userId_date_desc_idx" ON "transactions"("userId", "date" DESC);
CREATE INDEX IF NOT EXISTS "transactions_accountId_date_idx" ON "transactions"("accountId", "date");
CREATE INDEX IF NOT EXISTS "transactions_userId_category_date_idx" ON "transactions"("userId", "category", "date");

-- BudgetPlan indexes
CREATE INDEX IF NOT EXISTS "budget_plans_userId_month_and_year_idx" ON "budget_plans"("userId", "month_and_year" DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS "notifications_userId_archivedAt_createdAt_idx" ON "notifications"("userId", "archivedAt", "createdAt" DESC);
