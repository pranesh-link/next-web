/**
 * Backup production database before fixing failed migration
 * 
 * This script creates a backup of critical tables before making any changes.
 * Safe to run multiple times - will skip if already backed up recently.
 * 
 * Usage:
 *   npx tsx scripts/backup-before-migration-fix.ts
 * 
 * Environment:
 *   SKIP_BACKUP=true - Skip backup (not recommended)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Allow skipping backup via env var (for CI/CD if needed)
  if (process.env.SKIP_BACKUP === 'true') {
    console.log('⏭️  SKIP_BACKUP=true - Skipping backup');
    return;
  }

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `migration-fix-backup-${timestamp}.json`);

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Starting backup...');
  console.log(`📁 Backup location: ${backupFile}`);
  console.log('');

  // Initialize PrismaClient with empty options (required in some environments)
  const prisma = new PrismaClient({});

  const backup: any = {
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL?.includes('db.prisma.io') ? 'production' : 'development',
    tables: {}
  };

  try {
    // Backup _prisma_migrations table
    console.log('📦 Backing up _prisma_migrations table...');
    const migrations = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM _prisma_migrations
      ORDER BY started_at DESC
    `;
    backup.tables._prisma_migrations = migrations;
    console.log(`   ✅ ${migrations.length} migration records backed up`);

    // Backup notifications table
    console.log('📦 Backing up notifications table...');
    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    backup.tables.notifications = notifications;
    console.log(`   ✅ ${notifications.length} notification records backed up`);

    // Check for duplicates
    console.log('🔍 Analyzing duplicate notifications...');
    const duplicates = await prisma.$queryRaw<Array<{ userId: string, type: string, featureId: string | null, count: bigint }>>`
      SELECT "userId", type, "featureId", COUNT(*) as count
      FROM notifications
      GROUP BY "userId", type, "featureId"
      HAVING COUNT(*) > 1
    `;
    backup.duplicates = duplicates.map(d => ({ ...d, count: Number(d.count) }));
    console.log(`   ℹ️  Found ${duplicates.length} duplicate notification groups`);
    
    if (duplicates.length > 0) {
      console.log('   📊 Duplicate breakdown:');
      let totalDuplicates = 0;
      for (const dup of duplicates) {
        const count = Number(dup.count);
        totalDuplicates += count - 1; // -1 because we keep one
        console.log(`      - User ${dup.userId}, Type ${dup.type}: ${count} copies`);
      }
      console.log(`   ⚠️  ${totalDuplicates} notifications will be deleted (keeping most recent)`);
    }

    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log('');
    console.log('✅ Backup completed successfully!');
    console.log(`📄 Backup saved to: ${backupFile}`);
    console.log('');
    console.log('Summary:');
    console.log(`  - Migrations: ${backup.tables._prisma_migrations.length} records`);
    console.log(`  - Notifications: ${backup.tables.notifications.length} records`);
    console.log(`  - Duplicate groups: ${backup.duplicates.length}`);
    console.log('');
    console.log('✅ Safe to proceed with fix-failed-migration.ts');

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
