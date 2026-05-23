#!/usr/bin/env node
/**
 * Validates that all required environment variables are present before build.
 * Exits with code 1 if any are missing — prevents broken deployments.
 */

const required = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_REVALIDATE',
  'DATABASE_URL',
  'DIRECT_DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'AUTH_BASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CRON_SECRET',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n\x1b[31m✗ Missing required environment variables:\x1b[0m\n');
  missing.forEach((key) => console.error(`  • ${key}`));
  console.error('\n  See .env.example for reference.\n');
  process.exit(1);
}

console.log('\x1b[32m✓ All required environment variables present.\x1b[0m');
