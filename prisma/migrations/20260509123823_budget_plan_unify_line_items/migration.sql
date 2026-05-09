/*
  Unify estimated and paid items into a single `lineItems` array with a `paid: boolean` flag.

  Backfill steps (run BEFORE column drop):
    1. Tag every existing entry in `lineItems` with `paid: false`.
    2. Append every entry from `paidItems` (if any) into `lineItems` with `paid: true`.
    3. Drop the now-redundant `paidItems` column.
*/

-- 1. Tag existing lineItems entries with paid: false
UPDATE "budget_plans"
SET "lineItems" = (
  SELECT COALESCE(jsonb_agg(elem || jsonb_build_object('paid', false)), '[]'::jsonb)
  FROM jsonb_array_elements(COALESCE("lineItems"::jsonb, '[]'::jsonb)) AS elem
)
WHERE "lineItems" IS NOT NULL;

-- 2. Append paidItems entries with paid: true
UPDATE "budget_plans"
SET "lineItems" = "lineItems"::jsonb || (
  SELECT COALESCE(jsonb_agg(elem || jsonb_build_object('paid', true)), '[]'::jsonb)
  FROM jsonb_array_elements(COALESCE("paidItems"::jsonb, '[]'::jsonb)) AS elem
)
WHERE "paidItems" IS NOT NULL
  AND jsonb_array_length(COALESCE("paidItems"::jsonb, '[]'::jsonb)) > 0;

-- 3. Drop the redundant column
ALTER TABLE "budget_plans" DROP COLUMN "paidItems";
