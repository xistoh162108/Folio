CREATE TYPE "NewsletterRecipientMode" AS ENUM ('TOPICS', 'SELECTED_SUBSCRIBERS');

CREATE TYPE "NewsletterAssetKind" AS ENUM ('IMAGE', 'FILE');

ALTER TABLE "NewsletterCampaign"
ADD COLUMN "markdown" TEXT,
ADD COLUMN "recipientMode" "NewsletterRecipientMode" NOT NULL DEFAULT 'TOPICS',
ADD COLUMN "targetSubscriberIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "skipPreviouslySent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "queueOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered_campaigns AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, id ASC) - 1 AS queue_order
  FROM "NewsletterCampaign"
)
UPDATE "NewsletterCampaign"
SET "queueOrder" = ordered_campaigns.queue_order
FROM ordered_campaigns
WHERE ordered_campaigns.id = "NewsletterCampaign".id;

CREATE TABLE "NewsletterAsset" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "kind" "NewsletterAssetKind" NOT NULL,
  "bucket" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "publicUrl" TEXT,
  "sendAsAttachment" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NewsletterAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NewsletterCampaign_queueOrder_createdAt_idx" ON "NewsletterCampaign"("queueOrder", "createdAt");

CREATE INDEX "NewsletterAsset_campaignId_kind_createdAt_idx" ON "NewsletterAsset"("campaignId", "kind", "createdAt");

ALTER TABLE "NewsletterAsset"
ADD CONSTRAINT "NewsletterAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
