# Fix Failed Migration

## Problem
The migration `20260527185953_add_notification_unique_constraint` failed in production because there were duplicate notifications in the database. This migration is now stuck in a failed state, preventing new migrations from being applied.

## Solution

### Step 1: Mark the Failed Migration as Resolved

You need to mark the failed migration as "rolled back" in the production database. Choose one of these methods:

#### Option A: Using Prisma Studio (Recommended)
```bash
# Connect to production database
npx prisma studio

# Navigate to the _prisma_migrations table
# Find the row where migration_name = '20260527185953_add_notification_unique_constraint'
# Set:
#   - finished_at = NOW()
#   - rolled_back_at = NOW()
```

#### Option B: Using Direct SQL
Run the SQL script:
```bash
# If you have production DB connection string
psql <your-production-db-url> < scripts/fix-failed-migration.sql
```

Or manually execute:
```sql
UPDATE _prisma_migrations
SET rolled_back_at = NOW(),
    finished_at = NOW()
WHERE migration_name = '20260527185953_add_notification_unique_constraint'
  AND finished_at IS NULL;
```

#### Option C: Using TypeScript Script
```bash
# Make sure DATABASE_URL points to production
npx tsx scripts/fix-failed-migration.ts
```

### Step 2: Deploy the Fix

After marking the migration as resolved, deploy the branch. The build will now succeed because:

1. The failed migration folder has been deleted ✅
2. The database entry is marked as rolled back ✅
3. Three new migrations will apply successfully:
   - `20260527195144_remove_notification_unique_constraint_temporarily`
   - `20260527195230_cleanup_duplicate_notifications`
   - `20260527195331_add_notification_unique_constraint`

## What These Migrations Do

1. **Remove constraint**: Temporarily drops the unique index
2. **Cleanup duplicates**: Deletes duplicate notifications (keeps most recent)
3. **Re-add constraint**: Successfully creates the unique index

## Verification

After deployment, verify in production:
```sql
SELECT * FROM _prisma_migrations
WHERE migration_name LIKE '%notification%'
ORDER BY started_at DESC;
```

You should see all migrations marked as successfully finished.
