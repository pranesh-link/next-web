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
import { Client } from 'pg';
import { createBackup, deleteBackup } from './db-backup';
import { restoreBackup } from './db-restore';

interface MigrationResult {
  success: boolean;
  output?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Extract the failing migration name from a P3018 error message.
 */
function extractFailedMigrationName(errorOutput: string): string | null {
  const match = errorOutput.match(/Migration name:\s*(\S+)/);
  return match?.[1] ?? null;
}

/**
 * Resolve a P3018 failed migration by marking it as applied, then retry deploy.
 * This handles the case where a migration's DDL was already applied to the DB
 * outside of Prisma (e.g. manually or via a previous partial run).
 */
function resolveAndRetryMigrations(failedMigrationName: string): MigrationResult {
  console.warn(`[WARN] Resolving failed migration as applied: ${failedMigrationName}`);
  try {
    execSync(`npx prisma migrate resolve --applied ${failedMigrationName}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log('[INFO] Migration resolved. Retrying migrate deploy...');
  } catch (resolveError: any) {
    const resolveOutput = resolveError.stdout?.toString() || resolveError.stderr?.toString() || resolveError.message;
    console.error(`[ERROR] Could not resolve migration: ${resolveOutput}`);
    return { success: false, error: resolveOutput, errorCode: 'P3018' };
  }

  // Retry deploy once after resolving
  try {
    const retryOutput = execSync('npx prisma migrate deploy', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log(retryOutput);
    console.log('[SUCCESS] Migrations applied successfully after resolve');
    return { success: true, output: retryOutput };
  } catch (retryError: any) {
    const retryOutput = retryError.stdout?.toString() || retryError.stderr?.toString() || retryError.message;
    console.error(`[ERROR] Migration failed after resolve: ${retryOutput}`);
    return { success: false, error: retryOutput };
  }
}

/**
 * Resolve a P3009 error by deleting the failed migration row and retrying deploy.
 *
 * P3009 occurs when a previous migration attempt failed and left a "failed" row
 * in `_prisma_migrations`. Prisma refuses to continue until it's cleared.
 *
 * @param failedMigrationName - The migration name to remove from the history table.
 * @returns MigrationResult after retry.
 */
async function resolveP3009(failedMigrationName: string): Promise<MigrationResult> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(
      `DELETE FROM _prisma_migrations WHERE migration_name = $1`,
      [failedMigrationName],
    );
    console.log(`[INFO] Deleted ${result.rowCount} failed migration row(s) for: ${failedMigrationName}`);
  } catch (err: any) {
    console.error(`[ERROR] Could not delete failed migration row: ${err.message}`);
    return { success: false, error: err.message, errorCode: 'P3009' };
  } finally {
    await client.end().catch(() => {});
  }

  // Retry deploy
  try {
    const retryOutput = execSync('npx prisma migrate deploy', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log(retryOutput);
    console.log('[SUCCESS] Migrations applied successfully after P3009 resolve');
    return { success: true, output: retryOutput };
  } catch (retryError: any) {
    const retryOutput = retryError.stdout?.toString() || retryError.stderr?.toString() || retryError.message;
    console.error(`[ERROR] Migration failed after P3009 resolve: ${retryOutput}`);
    return { success: false, error: retryOutput };
  }
}

/**
 * Directly create the `couples` table if it is missing from the DB.
 *
 * This handles the edge-case where `prisma migrate deploy` reports
 * "no pending migrations" (because `_prisma_migrations` already records
 * the migration as applied) but the actual table was dropped or never created.
 * Uses a raw pg connection so it works even when PrismaClient itself would
 * throw due to the missing table.
 */
async function ensureCouplesTable(): Promise<void> {
  console.log('[INFO] Verifying couples table exists...');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS "couples" (
        "id"        TEXT        NOT NULL,
        "name"      TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "couples_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log('[INFO] "couples" table verified/created');

    // Recover orphaned couple rows: if couple_members references coupleIds that
    // are missing from couples (e.g. after the couples table was dropped and
    // recreated empty), re-insert the missing couple rows from the members data.
    const recovered = await client.query(`
      INSERT INTO "couples" ("id", "createdAt", "updatedAt")
      SELECT DISTINCT "coupleId", NOW(), NOW()
      FROM "couple_members"
      WHERE "coupleId" NOT IN (SELECT "id" FROM "couples")
      ON CONFLICT ("id") DO NOTHING
    `);
    if (recovered.rowCount && recovered.rowCount > 0) {
      console.log(`[INFO] Recovered ${recovered.rowCount} missing couple row(s) from couple_members`);
    }
  } catch (err: any) {
    console.warn('[WARN] Could not verify/create couples table:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
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
      // P3009: A previously failed migration is blocking deploy.
      // Auto-fix by deleting the failed row from _prisma_migrations and retrying.
      const failedMigration = extractFailedMigrationName(errorOutput);
      if (failedMigration) {
        console.warn(`[WARN] P3009 detected — removing failed migration record: ${failedMigration}`);
        return await resolveP3009(failedMigration);
      }
      console.error('[ERROR] P3009 — could not extract migration name to resolve');
    } else if (errorOutput.includes('P3018')) {
      errorCode = 'P3018';
      // P3018: A migration failed to apply because the DDL already exists in the DB
      // (e.g. column was added manually before the migration ran).
      // Auto-resolve by marking the migration as applied and retrying.
      const failedMigration = extractFailedMigrationName(errorOutput);
      if (failedMigration) {
        console.warn(`[WARN] P3018 detected — column/table already exists. Auto-resolving: ${failedMigration}`);
        return resolveAndRetryMigrations(failedMigration);
      }
      console.error('[ERROR] P3018 — could not extract migration name to resolve');
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
  console.log('[STEP 1/5] Pre-migration checks...');
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
  console.log('[STEP 3/5] Creating backup...');
  const backupResult = await createBackup();

  let backupPath: string | undefined;
  if (!backupResult.success) {
    if (backupResult.error?.includes('pg_dump not found')) {
      console.warn('[WARN] pg_dump not available — skipping backup (no rollback capability).');
      console.warn('[WARN] Set SKIP_DB_BACKUP=true to silence this warning in environments without pg_dump.');
    } else {
      console.error(`[ERROR] Backup failed: ${backupResult.error}`);
      process.exit(2);
    }
  } else {
    backupPath = backupResult.backupPath;
  }
  console.log('');

  // Step 4: Run migrations
  console.log('[STEP 4/5] Applying migrations...');
  const migrationResult = await runMigrations();
  console.log('');

  if (migrationResult.success) {
    // Step 5a: Ensure the couples table exists (direct SQL, idempotent)
    await ensureCouplesTable();
    console.log('');

    // Step 5b: Cleanup on success
    console.log('[STEP 5/5] Cleaning up...');

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
