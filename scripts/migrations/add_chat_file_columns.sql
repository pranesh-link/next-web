-- Migration: add fileStoragePath and fileDownloadedBy to couple_messages
-- Run once against the production DB (Supabase direct connection).
-- Safe to run multiple times — uses IF NOT EXISTS pattern via DO block.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'couple_messages' AND column_name = 'fileStoragePath'
  ) THEN
    ALTER TABLE couple_messages ADD COLUMN "fileStoragePath" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'couple_messages' AND column_name = 'fileDownloadedBy'
  ) THEN
    ALTER TABLE couple_messages ADD COLUMN "fileDownloadedBy" TEXT[] NOT NULL DEFAULT '{}';
  END IF;
END $$;
