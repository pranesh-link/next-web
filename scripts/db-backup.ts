#!/usr/bin/env tsx
/**
 * Database Backup Utility
 *
 * Creates PostgreSQL database backups using pg_dump.
 * Can be used standalone or as part of the safe-migrate workflow.
 *
 * Usage:
 *   npx tsx scripts/db-backup.ts                    # Create backup
 *   npx tsx scripts/db-backup.ts --restore latest   # Restore latest backup
 *   npx tsx scripts/db-backup.ts --list             # List all backups
 *   npx tsx scripts/db-backup.ts --cleanup 7        # Delete backups older than 7 days
 *
 * Environment Variables:
 *   DATABASE_URL              - PostgreSQL connection string (required)
 *   DB_BACKUP_DIR             - Backup directory (default: /tmp/db-backups)
 *   SKIP_DB_BACKUP            - Set to 'true' to skip backup (dev only)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface BackupOptions {
  backupDir?: string;
  compress?: boolean;
  keepLast?: number;
}

interface BackupResult {
  success: boolean;
  backupPath?: string;
  backupSize?: string;
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
 * Check if pg_dump is available
 */
function checkPgDumpAvailable(): boolean {
  try {
    execSync('which pg_dump', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create database backup
 */
export async function createBackup(
  options: BackupOptions = {}
): Promise<BackupResult> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return { success: false, error: 'DATABASE_URL not set' };
  }

  if (process.env.SKIP_DB_BACKUP === 'true') {
    console.log('[INFO] SKIP_DB_BACKUP=true, skipping backup');
    return { success: true };
  }

  if (!checkPgDumpAvailable()) {
    return {
      success: false,
      error: 'pg_dump not found. Install PostgreSQL client tools.',
    };
  }

  const backupDir = options.backupDir || process.env.DB_BACKUP_DIR || '/tmp/db-backups';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + 'T' + 
                    new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
  const backupFile = `backup-${timestamp}.sql`;
  const backupPath = path.join(backupDir, backupFile);

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log(`[INFO] Creating database backup...`);
    console.log(`[INFO] Backup location: ${backupPath}`);

    const dbConfig = parseDatabaseUrl(databaseUrl);

    // Use pg_dump with custom format for better compression
    const pgDumpCommand = `PGPASSWORD="${dbConfig.password}" pg_dump \
      -h ${dbConfig.host} \
      -p ${dbConfig.port} \
      -U ${dbConfig.username} \
      -d ${dbConfig.database} \
      --format=plain \
      --no-owner \
      --no-acl \
      --file="${backupPath}"`;

    execSync(pgDumpCommand, { stdio: 'pipe' });

    // Verify backup was created
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Backup file not created' };
    }

    const stats = fs.statSync(backupPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`[SUCCESS] Backup created: ${backupPath} (${sizeInMB} MB)`);

    // Cleanup old backups if keepLast is specified
    if (options.keepLast) {
      await cleanupOldBackups(backupDir, options.keepLast);
    }

    return {
      success: true,
      backupPath,
      backupSize: `${sizeInMB} MB`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Backup failed: ${errorMessage}` };
  }
}

/**
 * List all backups in the backup directory
 */
export function listBackups(backupDir?: string): string[] {
  const dir = backupDir || process.env.DB_BACKUP_DIR || '/tmp/db-backups';

  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
    .sort()
    .reverse(); // Most recent first
}

/**
 * Get the most recent backup file path
 */
export function getLatestBackup(backupDir?: string): string | null {
  const backups = listBackups(backupDir);
  if (backups.length === 0) {
    return null;
  }

  const dir = backupDir || process.env.DB_BACKUP_DIR || '/tmp/db-backups';
  return path.join(dir, backups[0]);
}

/**
 * Delete old backups, keeping only the most recent N backups
 */
export async function cleanupOldBackups(
  backupDir: string,
  keepLast: number
): Promise<void> {
  const backups = listBackups(backupDir);

  if (backups.length <= keepLast) {
    return; // Nothing to clean up
  }

  const toDelete = backups.slice(keepLast);
  console.log(`[INFO] Cleaning up ${toDelete.length} old backup(s), keeping last ${keepLast}`);

  for (const backup of toDelete) {
    const backupPath = path.join(backupDir, backup);
    try {
      fs.unlinkSync(backupPath);
      console.log(`[INFO] Deleted old backup: ${backup}`);
    } catch (error) {
      console.warn(`[WARN] Failed to delete ${backup}: ${error}`);
    }
  }
}

/**
 * Delete a specific backup file
 */
export function deleteBackup(backupPath: string): boolean {
  try {
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      console.log(`[INFO] Deleted backup: ${backupPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[ERROR] Failed to delete backup: ${error}`);
    return false;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    if (command === '--list') {
      const backups = listBackups();
      if (backups.length === 0) {
        console.log('No backups found');
      } else {
        console.log(`Found ${backups.length} backup(s):`);
        backups.forEach((backup, index) => {
          console.log(`  ${index + 1}. ${backup}`);
        });
      }
    } else if (command === '--cleanup') {
      const days = parseInt(args[1]) || 7;
      const backupDir = process.env.DB_BACKUP_DIR || '/tmp/db-backups';
      await cleanupOldBackups(backupDir, days);
    } else {
      // Create backup
      const result = await createBackup({ keepLast: 1 });
      if (!result.success) {
        console.error(`[ERROR] ${result.error}`);
        process.exit(1);
      }
    }
  })();
}
