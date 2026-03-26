-- CreateEnum
CREATE TYPE "PostLinkType" AS ENUM ('GITHUB', 'WEBSITE', 'YOUTUBE', 'DOCS', 'OTHER');

-- CreateEnum
CREATE TYPE "PreviewFetchStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "PostLink" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "type" "PostLinkType" NOT NULL DEFAULT 'OTHER',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkPreviewCache" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "siteName" TEXT,
    "embedUrl" TEXT,
    "previewStatus" "PreviewFetchStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkPreviewCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostLink_postId_sortOrder_createdAt_idx" ON "PostLink"("postId", "sortOrder", "createdAt");

-- CreateIndex
CREATE INDEX "PostLink_normalizedUrl_idx" ON "PostLink"("normalizedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "LinkPreviewCache_normalizedUrl_key" ON "LinkPreviewCache"("normalizedUrl");

-- AddForeignKey
ALTER TABLE "PostLink" ADD CONSTRAINT "PostLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
