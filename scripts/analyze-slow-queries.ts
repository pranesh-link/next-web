/**
 * Analyze slow database queries and recommend indexes.
 *
 * This script tests common query patterns used in the LuvVerse application
 * and identifies queries that take longer than 100ms. It provides specific
 * index recommendations to optimize performance.
 *
 * Usage:
 *   npx tsx scripts/analyze-slow-queries.ts
 *
 * Requirements:
 *   - DATABASE_URL environment variable must be set
 *   - Database must be populated with test data for accurate results
 *
 * @module scripts/analyze-slow-queries
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

interface SlowQuery {
  query: string;
  duration: number;
  model?: string;
  operation?: string;
}

const SLOW_QUERY_THRESHOLD_MS = 100;
const slowQueries: SlowQuery[] = [];

/**
 * Initialize Prisma client with query logging enabled.
 *
 * @return {PrismaClient} Configured Prisma client instance.
 */
function initializePrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: [
      {
        emit: 'event',
        level: 'query',
      },
    ],
  });

  // Listen for query events and track slow queries
  prisma.$on('query' as never, (e: any) => {
    const duration = e.duration;
    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      slowQueries.push({
        query: e.query,
        duration,
        model: e.target,
      });
    }
  });

  return prisma;
}

/**
 * Test common finance query patterns.
 *
 * @param {PrismaClient} prisma - The Prisma client instance.
 * @return {Promise<void>} Promise that resolves when all tests complete.
 */
async function testFinanceQueries(prisma: PrismaClient): Promise<void> {
  console.log('Testing common finance queries...\n');

  // Get a sample user ID (or use a specific test user)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('⚠️  No users found in database. Skipping query tests.');
    return;
  }

  const userId = user.id;
  const startDate = new Date('2024-01-01');

  // Test 1: Account lookup by userId
  console.log('📊 Test 1: Account.findMany by userId');
  await prisma.account.findMany({
    where: { userId },
  });

  // Test 2: Recent transactions with date filter
  console.log('📊 Test 2: Transaction.findMany with date filter and ordering');
  await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'desc' },
    take: 50,
  });

  // Test 3: Recent budget plans
  console.log('📊 Test 3: BudgetPlan.findMany with ordering');
  await prisma.budgetPlan.findMany({
    where: { userId },
    orderBy: { monthAndYear: 'desc' },
    take: 12,
  });

  // Test 4: Loans ordered by creation
  console.log('📊 Test 4: Loan.findMany with ordering');
  await prisma.loan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Test 5: Active notifications
  console.log('📊 Test 5: Notification.findMany with null filter and ordering');
  await prisma.notification.findMany({
    where: {
      userId,
      archivedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log('');
}

/**
 * Generate index recommendations based on slow queries.
 *
 * @param {SlowQuery[]} queries - Array of slow queries detected.
 * @return {string[]} Array of index recommendations.
 */
function generateRecommendations(queries: SlowQuery[]): string[] {
  const recommendations: string[] = [];
  const indexPatterns = new Map<string, Set<string>>();

  for (const query of queries) {
    const sql = query.query.toLowerCase();

    // Analyze WHERE clauses for index opportunities
    if (sql.includes('where')) {
      // Account queries
      if (sql.includes('"account"') && sql.includes('"userid"')) {
        const key = 'Account.userId';
        if (!indexPatterns.has(key)) {
          indexPatterns.set(key, new Set());
          recommendations.push('@@index([userId]) on Account model');
        }
      }

      // Transaction queries
      if (sql.includes('"transaction"')) {
        if (sql.includes('"userid"') && sql.includes('"date"')) {
          const key = 'Transaction.userId+date';
          if (!indexPatterns.has(key)) {
            indexPatterns.set(key, new Set());
            recommendations.push('@@index([userId, date]) on Transaction model');
          }
        } else if (sql.includes('"userid"')) {
          const key = 'Transaction.userId';
          if (!indexPatterns.has(key)) {
            indexPatterns.set(key, new Set());
            recommendations.push('@@index([userId]) on Transaction model');
          }
        }
      }

      // BudgetPlan queries
      if (sql.includes('"budgetplan"')) {
        if (sql.includes('"userid"') && sql.includes('order by')) {
          const key = 'BudgetPlan.userId+month';
          if (!indexPatterns.has(key)) {
            indexPatterns.set(key, new Set());
            recommendations.push('@@index([userId, month]) on BudgetPlan model');
          }
        } else if (sql.includes('"userid"')) {
          const key = 'BudgetPlan.userId';
          if (!indexPatterns.has(key)) {
            indexPatterns.set(key, new Set());
            recommendations.push('@@index([userId]) on BudgetPlan model');
          }
        }
      }

      // Loan queries
      if (sql.includes('"loan"') && sql.includes('"userid"')) {
        const key = 'Loan.userId';
        if (!indexPatterns.has(key)) {
          indexPatterns.set(key, new Set());
          recommendations.push('@@index([userId]) on Loan model');
        }
      }

      // PaymentSchedule queries
      if (sql.includes('"paymentschedule"')) {
        if (sql.includes('"loanid"') && sql.includes('"status"')) {
          const key = 'PaymentSchedule.loanId+status';
          if (!indexPatterns.has(key)) {
            indexPatterns.set(key, new Set());
            recommendations.push('@@index([loanId, status]) on PaymentSchedule model');
          }
        }
      }

      // Notification queries
      if (sql.includes('"notification"')) {
        if (sql.includes('"userid"') && sql.includes('"archivedat"')) {
          const key = 'Notification.userId+archivedAt';
          if (!indexPatterns.has(key)) {
            indexPatterns.set(key, new Set());
            recommendations.push('@@index([userId, archivedAt]) on Notification model');
          }
        } else if (sql.includes('"userid"')) {
          const key = 'Notification.userId';
          if (!indexPatterns.has(key)) {
            indexPatterns.set(key, new Set());
            recommendations.push('@@index([userId]) on Notification model');
          }
        }
      }
    }
  }

  return recommendations;
}

/**
 * Print analysis results with slow queries and recommendations.
 *
 * @param {SlowQuery[]} queries - Array of slow queries detected.
 * @return {void}
 */
function printResults(queries: SlowQuery[]): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ANALYSIS RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (queries.length === 0) {
    console.log('✅ No slow queries detected! All queries completed in <100ms.\n');
    return;
  }

  console.log(`⚠️  Found ${queries.length} slow ${queries.length === 1 ? 'query' : 'queries'}:\n`);

  // Sort by duration (slowest first)
  const sortedQueries = [...queries].sort((a, b) => b.duration - a.duration);

  for (const slowQuery of sortedQueries) {
    console.log(`⚠️  Slow Query (${slowQuery.duration}ms):`);
    console.log(`   ${slowQuery.query.substring(0, 200)}${slowQuery.query.length > 200 ? '...' : ''}`);
    console.log('');
  }

  // Generate and print recommendations
  const recommendations = generateRecommendations(queries);

  if (recommendations.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDED INDEXES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Add these indexes to your schema.prisma file:\n');
    for (const recommendation of recommendations) {
      console.log(`  ${recommendation}`);
    }
    console.log('');
  }
}

/**
 * Main entry point for the slow query analysis script.
 *
 * @return {Promise<void>} Promise that resolves when analysis is complete.
 */
async function main(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 SLOW QUERY ANALYZER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Threshold: ${SLOW_QUERY_THRESHOLD_MS}ms\n`);

  const prisma = initializePrisma();

  try {
    await testFinanceQueries(prisma);
    printResults(slowQueries);

    console.log('✅ Analysis complete.\n');
    
    if (slowQueries.length > 0) {
      console.log('Next steps:');
      console.log('  1. Add recommended indexes to prisma/schema.prisma');
      console.log('  2. Run: npx prisma migrate dev --name add-performance-indexes');
      console.log('  3. Re-run this script to verify improvements\n');
    }
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
