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
 *   DATABASE_URL - Required: PostgreSQL connection string
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  // Allow skipping via env var
  if (process.env.SKIP_MIGRATION_FIX === 'true') {
    console.log('⏭️  SKIP_MIGRATION_FIX=true - Skipping migration fix');
    return;
  }

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   This script requires DATABASE_URL to connect to the database');
    process.exit(1);
  }

  console.log('🔍 Checking for failed migrations...');

  let prisma: PrismaClient | undefined;
  
  try {
    // Initialize PrismaClient with PostgreSQL adapter
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    
    // Check for any failed migrations (not finished and not rolled back)
    const failedMigrations = await prisma.$queryRaw<Array<{ migration_name: string; started_at: Date; finished_at: Date | null; rolled_back_at: Date | null }>>`
      SELECT migration_name, started_at, finished_at, rolled_back_at
      FROM _prisma_migrations
      WHERE finished_at IS NULL AND rolled_back_at IS NULL
    `;

    if (failedMigrations.length === 0) {
      console.log('✅ No failed migrations found');
      return;
    }

    console.log(`❌ Found ${failedMigrations.length} failed migration(s):`);
    for (const m of failedMigrations) {
      console.log(`   - ${m.migration_name} (started ${m.started_at})`);
    }
    console.log('🔧 Marking as rolled back...');

    // Mark all failed migrations as rolled back
    await prisma.$executeRaw`
      UPDATE _prisma_migrations
      SET rolled_back_at = NOW(),
          finished_at = NOW()
      WHERE finished_at IS NULL AND rolled_back_at IS NULL
    `;

    console.log('✅ All failed migrations marked as rolled back');
    console.log('');
    console.log('Next steps:');
    console.log('1. Clean migrations will now be applied');
    console.log('2. Database will reach consistent state');
    console.log('3. Application will deploy successfully');
    
  } catch (error) {
    console.error('❌ Error connecting to database or executing query:', error);
    throw error;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e.message);
    process.exit(1);
  });
