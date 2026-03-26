DO $$
BEGIN
  IF to_regclass('"PostAsset"') IS NOT NULL THEN
    ALTER TABLE "PostAsset"
      ADD COLUMN IF NOT EXISTS "pendingDeleteAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "deleteAttempts" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lastDeleteError" TEXT;

    IF to_regclass('"PostAsset_pendingDeleteAt_createdAt_idx"') IS NULL THEN
      EXECUTE 'CREATE INDEX "PostAsset_pendingDeleteAt_createdAt_idx" ON "PostAsset"("pendingDeleteAt", "createdAt")';
    END IF;
  END IF;
END $$;
