-- AlterTable
ALTER TABLE "Analytics"
ADD COLUMN "postId" TEXT,
ADD COLUMN "referrerHost" TEXT,
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "browser" TEXT,
ADD COLUMN "deviceType" TEXT,
ADD COLUMN "isBot" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Analytics_postId_createdAt_idx" ON "Analytics"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Analytics_eventType_createdAt_idx" ON "Analytics"("eventType", "createdAt");
