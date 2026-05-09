/*
  Make BudgetPlan a couple-shared row.

  All statements are idempotent so a partially-applied run can be safely retried.

  Steps:
    1. Add `last_updated_by_id` column + FK (if not exist).
    2. Backfill `last_updated_by_id = userId` for any null rows.
    3. Deduplicate: for each (coupleId, monthAndYear, mode) group, keep the
       most-recently-updated row and delete the rest.
    4. Drop old unique [userId, monthAndYear, mode].
    5. Add partial unique indexes (couple-scoped vs solo).
    6. Add helper indexes on coupleId and last_updated_by_id.
*/

-- 1. Add column + FK (idempotent)
ALTER TABLE "budget_plans"
  ADD COLUMN IF NOT EXISTS "last_updated_by_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'budget_plans_last_updated_by_id_fkey'
  ) THEN
    ALTER TABLE "budget_plans"
      ADD CONSTRAINT "budget_plans_last_updated_by_id_fkey"
      FOREIGN KEY ("last_updated_by_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 2. Backfill: assume creator was last editor
UPDATE "budget_plans" SET "last_updated_by_id" = "userId" WHERE "last_updated_by_id" IS NULL;

-- 3. Dedupe couple-shared rows: keep most recent per (coupleId, month, mode)
DELETE FROM "budget_plans" bp
USING "budget_plans" bp2
WHERE bp."coupleId" IS NOT NULL
  AND bp."coupleId" = bp2."coupleId"
  AND bp."month_and_year" = bp2."month_and_year"
  AND bp."mode" = bp2."mode"
  AND bp."updatedAt" < bp2."updatedAt";

-- 4. Drop old unique constraint (try both possible names)
ALTER TABLE "budget_plans" DROP CONSTRAINT IF EXISTS "budget_plans_userId_monthAndYear_mode_key";
ALTER TABLE "budget_plans" DROP CONSTRAINT IF EXISTS "budget_plans_userId_month_and_year_mode_key";

-- 5. Partial unique indexes (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "budget_plans_couple_month_mode_key"
  ON "budget_plans" ("coupleId", "month_and_year", "mode")
  WHERE "coupleId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "budget_plans_user_month_mode_solo_key"
  ON "budget_plans" ("userId", "month_and_year", "mode")
  WHERE "coupleId" IS NULL;

-- 6. Helper indexes
CREATE INDEX IF NOT EXISTS "budget_plans_coupleId_idx" ON "budget_plans" ("coupleId");
CREATE INDEX IF NOT EXISTS "budget_plans_last_updated_by_id_idx" ON "budget_plans" ("last_updated_by_id");
