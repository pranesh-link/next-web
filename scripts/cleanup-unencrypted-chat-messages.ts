#!/usr/bin/env tsx
/**
 * One-time cleanup: removes any CoupleMessage rows with `encrypted = false`
 * left over from before E2E was enforced. Idempotent — re-running is a
 * no-op once the table is clean.
 *
 * REMOVE THIS SCRIPT and its `db:cleanup-unencrypted-chat-messages`
 * package.json wiring after one successful production deploy
 * post-PR-#<TBD> has confirmed the table is clean.
 *
 * Opt-out: set `SKIP_CHAT_CLEANUP=true` to bypass without code change.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main(): Promise<void> {
  console.log('[cleanup-unencrypted-chat] starting…');

  if (process.env.SKIP_CHAT_CLEANUP === 'true') {
    console.log('[cleanup-unencrypted-chat] SKIP_CHAT_CLEANUP=true — skipping.');
    await prisma.$disconnect();
    process.exit(0);
  }

  const count = await prisma.coupleMessage.count({ where: { encrypted: false } });

  if (count === 0) {
    console.log('[cleanup-unencrypted-chat] no unencrypted messages — skipping.');
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log(`[cleanup-unencrypted-chat] found ${count} unencrypted messages — deleting…`);
  await prisma.coupleMessage.deleteMany({ where: { encrypted: false } });
  console.log(`[cleanup-unencrypted-chat] deleted ${count} unencrypted messages.`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('[cleanup-unencrypted-chat] FAILED:', err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
