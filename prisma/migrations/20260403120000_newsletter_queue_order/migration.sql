ALTER TABLE "NewsletterDelivery"
ADD COLUMN "queueOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "NewsletterDelivery"
SET "queueOrder" = seq.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "campaignId" ORDER BY "createdAt" ASC, id ASC) - 1 AS rn
  FROM "NewsletterDelivery"
) AS seq
WHERE seq.id = "NewsletterDelivery".id;

DROP INDEX IF EXISTS "NewsletterDelivery_campaignId_status_createdAt_id_idx";
CREATE INDEX "NewsletterDelivery_campaignId_status_queueOrder_createdAt_id_idx"
ON "NewsletterDelivery"("campaignId", "status", "queueOrder", "createdAt", id);
