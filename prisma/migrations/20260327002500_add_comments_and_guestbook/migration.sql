CREATE TABLE "PostComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "pinHash" TEXT NOT NULL,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuestbookEntry" (
  "id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GuestbookEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostComment_postId_createdAt_idx" ON "PostComment"("postId", "createdAt");
CREATE INDEX "PostComment_deletedAt_createdAt_idx" ON "PostComment"("deletedAt", "createdAt");
CREATE INDEX "GuestbookEntry_deletedAt_createdAt_idx" ON "GuestbookEntry"("deletedAt", "createdAt");

ALTER TABLE "PostComment"
ADD CONSTRAINT "PostComment_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
