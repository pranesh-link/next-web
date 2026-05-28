/**
 * Script to resolve the failed notification unique constraint migration.
 * 
 * This script marks the failed migration as rolled back so new migrations can proceed.
 * Safe to run multiple times - will skip if already resolved.
 * 
 * Usage:
 *   npx tsx scripts/fix-failed-migration.ts
 * 
 * Environment:
 *   SKIP_MIGRATION_FIX=true - Skip fix (not recommended)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Allow skipping via env var
  if (process.env.SKIP_MIGRATION_FIX === 'true') {
    console.log('⏭️  SKIP_MIGRATION_FIX=true - Skipping migration fix');
    return;
  }

  console.log('🔍 Checking for failed migration...');

  // Check if the failed migration exists
  const failedMigration = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
    SELECT migration_name, finished_at, rolled_back_at
    FROM _prisma_migrations
    WHERE migration_name = '20260527185953_add_notification_unique_constraint'
  `;

  if (failedMigration.length === 0) {
    console.log('✅ Migration not found - never existed or already cleaned up');
    return;
  }

  if (failedMigration[0].finished_at !== null || failedMigration[0].rolled_back_at !== null) {
    console.log('✅ Migration already resolved');
    return;
  }

  console.log('❌ Found failed migration:', failedMigration[0].migration_name);
  console.log('🔧 Marking as rolled back...');

  // Mark the migration as rolled back
  await prisma.$executeRaw`
    UPDATE _prisma_migrations
    SET rolled_back_at = NOW(),
        finished_at = NOW()
    WHERE migration_name = '20260527185953_add_notification_unique_constraint'
      AND finished_at IS NULL
  `;

  console.log('✅ Failed migration marked as rolled back');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy the new code with the 3 fix migrations');
  console.log('2. Vercel will run prisma migrate deploy automatically');
  console.log('3. The cleanup and constraint will be applied successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
