#!/usr/bin/env tsx
/**
 * Safe Migration Workflow
 *
 * Orchestrates database migrations with automatic backup and rollback.
 *
 * Flow:
 *   1. Pre-flight checks (DATABASE_URL, Prisma CLI)
 *   2. Check for pending migrations
 *   3. If no migrations → exit 0 (skip backup)
 *   4. If migrations exist → create backup
 *   5. Run prisma migrate deploy
 *   6. On success: delete backup, exit 0
 *   7. On failure: restore from backup, exit 1
 *
 * Usage:
 *   npx tsx scripts/safe-migrate.ts
 *   npm run db:safe-migrate
 *
 * Environment Variables:
 *   DATABASE_URL              - PostgreSQL connection string (required)
 *   SKIP_DB_BACKUP            - Set to 'true' to skip backup (dev only)
 *   KEEP_BACKUP_ON_SUCCESS    - Set to 'true' to preserve backups
 *   DB_BACKUP_DIR             - Backup directory (default: /tmp/db-backups)
 *
 * Exit Codes:
 *   0 - No migrations needed OR migration successful
 *   1 - Migration failed (after rollback)
 *   2 - Pre-migration checks failed
 */

import { execSync } from 'child_process';
import { createBackup, deleteBackup } from './db-backup';
import { restoreBackup } from './db-restore';

interface MigrationResult {
  success: boolean;
  output?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Run Prisma migrations
 */
async function runMigrations(): Promise<MigrationResult> {
  try {
    console.log('[INFO] Running prisma migrate deploy...');

    const output = execSync('npx prisma migrate deploy', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    console.log(output);

    // Check if migrations were applied
    if (output.includes('No pending migrations')) {
      console.log('[INFO] Database is already up to date');
      return { success: true, output };
    }

    if (
      output.includes('migration(s) have been applied') ||
      output.includes('Database schema is up to date')
    ) {
      console.log('[SUCCESS] Migrations applied successfully');
      return { success: true, output };
    }

    // If we get here, something unexpected happened
    console.warn('[WARN] Unexpected migration output');
    return { success: true, output };
  } catch (error: any) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;

    // Detect known Prisma error codes
    let errorCode: string | undefined;
    if (errorOutput.includes('P3009')) {
      errorCode = 'P3009';
      console.error('[ERROR] Migration failed (P3009): Failed migrations detected');
    } else if (errorOutput.includes('P3018')) {
      errorCode = 'P3018';
      console.error('[ERROR] Migration not found (P3018)');
    } else if (errorOutput.includes('P3005')) {
      errorCode = 'P3005';
      console.error('[ERROR] Database does not exist (P3005)');
    } else {
      console.error('[ERROR] Migration failed with unknown error');
    }

    console.error(errorOutput);

    return {
      success: false,
      error: errorOutput,
      errorCode,
    };
  }
}

/**
 * Verify pre-migration requirements
 */
function verifyPreMigrationChecks(): boolean {
  if (!process.env.DATABASE_URL) {
    console.error('[ERROR] DATABASE_URL not set');
    return false;
  }

  // Verify prisma is available
  try {
    execSync('which prisma', { stdio: 'pipe' });
  } catch {
    try {
      execSync('npx prisma --version', { stdio: 'pipe' });
    } catch {
      console.error('[ERROR] Prisma CLI not found');
      return false;
    }
  }

  return true;
}

/**
 * Check if there are pending migrations
 */
function hasPendingMigrations(): boolean {
  try {
    const output = execSync('npx prisma migrate status', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
5] Pre-migration checks...');
  if (!verifyPreMigrationChecks()) {
    console.error('[FAILED] Pre-migration checks failed');
    process.exit(2);
  }
  console.log('[SUCCESS] Pre-migration checks passed\n');

  // Step 2: Check for pending migrations
  console.log('[STEP 2/5] Checking for pending migrations...');
  const needsMigration = hasPendingMigrations();
  
  if (!needsMigration) {
    console.log('[INFO] No pending migrations found');
    console.log('[SUCCESS] Database is already up to date');
    console.log('\n========================================');
    console.log('✅ Migration check complete (no changes needed)');
    console.log('========================================\n');
    process.exit(0);
  }
  
  console.log('[INFO] Pending migrations detected\n');

  // Step 3: Create backup
  console.log('[STEP 3/5
    // Check for pending migrations indicators
    if (
      output.includes('migration(s) have not yet been applied') ||
      output.includes('migration(s) have not been applied')
    ) {
      return true;
    }

    // If unclear, assume there might be migrations (safer to backup)
    return true;
  } catch (error: any) {
    // If migrate status fails, assume we need to check (safer to backup)
    console.warn('[WARN] Could not determine migration status, proceeding with backup');
    return true;
  }
}

/**
 * Main workflow
 */
async function main() {
  console.log('========================================');
  console.log('🛡️  Safe Migration Workflow');
  console.log('========================================\n');

  // Step 1: Pre-migration checks
  console.log('[STEP 1/4] Pre-migration checks...');
  if (!verifyPreMigrationChecks()) {
    console.error('[FAILED] Pre-migration checks failed');
    process.exit(2);
  }4: Run migrations
  console.log('[STEP 4/5] Applying migrations...');
  const migrationResult = await runMigrations();
  console.log('');

  if (migrationResult.success) {
    // Step 5a: Cleanup on success
    console.log('[STEP 5/5s) {
    console.error(`[ERROR] Backup failed: ${backupResult.error}`);
    process.exit(2);
  }

  const backupPath = backupResult.backupPath;
  console.log('');

  // Step 3: Run migrations
  console.log('[STEP 3/4] Applying migrations...');
  const migrationResult = await runMigrations();
  console.log('');

  if (migrationResult.success) {
    // Step 4a: Cleanup on success
    console.log('[STEP 4/4] Cleaning up...');

    if (process.env.KEEP_BACKUP_ON_SUCCESS === 'true') {
      console.log('[INFO] KEEP_BACKUP_ON_SUCCESS=true, preserving backup');
    } else if (backupPath) {
      deleteBackup(backupPath);
    }

    console.log('\n========================================');
    console.log('✅ Migration completed successfully');
    console.log('========================================\n');
    process.exit(0);
  } else {
    // Step 5b: Rollback on failure
    console.log('[STEP 5/5] Rolling back...');

    if (!backupPath) {
      console.error('[ERROR] Cannot rollback: No backup available');
      console.error('[ERROR] Manual intervention required');
      process.exit(1);
    }

    console.log(`[INFO] Restoring database from backup: ${backupPath}`);
    const restoreResult = await restoreBackup({
      backupPath,
      skipConfirmation: true,
    });

    if (!restoreResult.success) {
      console.error(`[ERROR] Rollback failed: ${restoreResult.error}`);
      console.error('[ERROR] Manual restore required:');
      console.error(`       npx tsx scripts/db-restore.ts "${backupPath}"`);
      process.exit(1);
    }

    console.log('[SUCCESS] Database rolled back to pre-migration state');
    console.log(`[INFO] Backup preserved for debugging: ${backupPath}`);

    console.log('\n========================================');
    console.log('❌ Migration failed and rolled back');
    console.log('========================================\n');
    process.exit(1);
  }
}

// Run main workflow
main().catch((error) => {
  console.error('[FATAL]', error);
  process.exit(1);
});
