ALTER TABLE "Analytics"
ADD COLUMN IF NOT EXISTS "pageLoadMs" INTEGER;

CREATE INDEX IF NOT EXISTS "Analytics_createdAt_sessionId_idx" ON "Analytics"("createdAt", "sessionId");
