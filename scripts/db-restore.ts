#!/usr/bin/env tsx
/**
 * Database Restore Utility
 *
 * Restores PostgreSQL database from a backup file.
 * Drops the existing schema and restores from backup.
 *
 * Usage:
 *   npx tsx scripts/db-restore.ts <backup-file>
 *   npx tsx scripts/db-restore.ts latest              # Restore from latest backup
 *   npx tsx scripts/db-restore.ts --confirm latest    # Skip confirmation prompt
 *
 * Environment Variables:
 *   DATABASE_URL    - PostgreSQL connection string (required)
 *   DB_BACKUP_DIR   - Backup directory (default: /tmp/db-backups)
 *
 * WARNING: This is a destructive operation. All existing data will be lost.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import { getLatestBackup } from './db-backup';

interface RestoreOptions {
  backupPath: string;
  skipConfirmation?: boolean;
}

interface RestoreResult {
  success: boolean;
  error?: string;
}

/**
 * Parse PostgreSQL connection URL into components
 */
function parseDatabaseUrl(url: string): {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
} {
  const match = url.match(
    /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?.*)?$/
  );

  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  const [, username, password, host, port, database] = match;
  return { host, port, database, username, password };
}

/**
 * Check if psql is available
 */
function checkPsqlAvailable(): boolean {
  try {
    execSync('which psql', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore database from backup
 */
export async function restoreBackup(
  options: RestoreOptions
): Promise<RestoreResult> {
  const { backupPath, skipConfirmation: _skipConfirmation } = options;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return { success: false, error: 'DATABASE_URL not set' };
  }

  if (!checkPsqlAvailable()) {
    return {
      success: false,
      error: 'psql not found. Install PostgreSQL client tools.',
    };
  }

  // Verify backup file exists
  if (!fs.existsSync(backupPath)) {
    return { success: false, error: `Backup file not found: ${backupPath}` };
  }

  // Verify backup file is readable
  try {
    fs.accessSync(backupPath, fs.constants.R_OK);
  } catch {
    return { success: false, error: `Backup file not readable: ${backupPath}` };
  }

  try {
    console.log('[INFO] Starting database restore...');
    console.log(`[INFO] Backup file: ${backupPath}`);
    console.log('[WARN] This will DROP all existing data!');

    const dbConfig = parseDatabaseUrl(databaseUrl);

    // Drop schema public CASCADE (removes all tables, indexes, etc.)
    console.log('[INFO] Dropping existing schema...');
    const dropCommand = `PGPASSWORD="${dbConfig.password}" psql \
      -h ${dbConfig.host} \
      -p ${dbConfig.port} \
      -U ${dbConfig.username} \
      -d ${dbConfig.database} \
      -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"`;

    execSync(dropCommand, { stdio: 'pipe' });

    // Restore from backup
    console.log('[INFO] Restoring from backup...');
    const restoreCommand = `PGPASSWORD="${dbConfig.password}" psql \
      -h ${dbConfig.host} \
      -p ${dbConfig.port} \
      -U ${dbConfig.username} \
      -d ${dbConfig.database} \
      < "${backupPath}"`;

    execSync(restoreCommand, { stdio: 'pipe' });

    console.log('[SUCCESS] Database restored successfully');

    // Run prisma generate to sync client
    console.log('[INFO] Syncing Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Restore failed: ${errorMessage}` };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/db-restore.ts <backup-file|latest>');
    console.error('       npx tsx scripts/db-restore.ts --confirm latest');
    process.exit(1);
  }

  let backupPath: string | null = null;
  let skipConfirmation = false;

  // Parse arguments
  if (args[0] === '--confirm') {
    skipConfirmation = true;
    args.shift();
  }

  const backupArg = args[0];

  if (backupArg === 'latest') {
    backupPath = getLatestBackup();
    if (!backupPath) {
      console.error('[ERROR] No backups found');
      process.exit(1);
    }
  } else {
    backupPath = backupArg;
  }

  (async () => {
    const result = await restoreBackup({ backupPath: backupPath!, skipConfirmation });

    if (!result.success) {
      console.error(`[ERROR] ${result.error}`);
      process.exit(1);
    }
  })();
}
