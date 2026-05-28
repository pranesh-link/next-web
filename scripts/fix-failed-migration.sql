-- Fix Failed Migration Script
-- Run this SQL against the production database to mark the failed migration as resolved
--
-- This allows the new cleanup migrations to proceed.
--
-- Execute via:
--   1. Prisma Studio: npx prisma studio (connect to production)
--   2. Direct connection: psql postgres://... < scripts/fix-failed-migration.sql
--   3. Database GUI (TablePlus, pgAdmin, etc.)

-- Mark the failed migration as rolled back
UPDATE _prisma_migrations
SET rolled_back_at = NOW(),
    finished_at = NOW()
WHERE migration_name = '20260527185953_add_notification_unique_constraint'
  AND finished_at IS NULL;

-- Verify the fix
SELECT migration_name, started_at, finished_at, rolled_back_at
FROM _prisma_migrations
WHERE migration_name LIKE '%notification%'
ORDER BY started_at DESC;
