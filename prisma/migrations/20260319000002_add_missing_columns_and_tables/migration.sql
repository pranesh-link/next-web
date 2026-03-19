-- Add missing coupleId column to all financial tables
ALTER TABLE "financial_accounts" ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
ALTER TABLE "transactions"       ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
ALTER TABLE "budgets"            ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
ALTER TABLE "loans"              ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
ALTER TABLE "savings_goals"      ADD COLUMN IF NOT EXISTS "coupleId" TEXT;

-- CreateTable: Couple (no @@map, so Prisma uses exact model name)
CREATE TABLE IF NOT EXISTS "Couple" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

-- CreateTable: couple_members
CREATE TABLE IF NOT EXISTS "couple_members" (
    "id"       TEXT         NOT NULL,
    "coupleId" TEXT         NOT NULL,
    "userId"   TEXT         NOT NULL,
    "role"     TEXT         NOT NULL DEFAULT 'OWNER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "couple_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: couple_invites
CREATE TABLE IF NOT EXISTS "couple_invites" (
    "id"        TEXT         NOT NULL,
    "coupleId"  TEXT         NOT NULL,
    "email"     TEXT         NOT NULL,
    "invitedBy" TEXT         NOT NULL,
    "token"     TEXT         NOT NULL,
    "status"    TEXT         NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "couple_invites_pkey" PRIMARY KEY ("id")
);

-- Unique index on couple_invites.token
DO $$ BEGIN
  CREATE UNIQUE INDEX "couple_invites_token_key" ON "couple_invites"("token");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Unique index on couple_members(coupleId, userId)
DO $$ BEGIN
  CREATE UNIQUE INDEX "couple_members_coupleId_userId_key" ON "couple_members"("coupleId", "userId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- FKs for couple_members
DO $$ BEGIN
  ALTER TABLE "couple_members" ADD CONSTRAINT "couple_members_coupleId_fkey"
    FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "couple_members" ADD CONSTRAINT "couple_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FKs for couple_invites
DO $$ BEGIN
  ALTER TABLE "couple_invites" ADD CONSTRAINT "couple_invites_coupleId_fkey"
    FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
