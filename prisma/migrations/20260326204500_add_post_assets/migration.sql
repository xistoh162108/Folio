-- CreateEnum
CREATE TYPE "PostAssetKind" AS ENUM ('IMAGE', 'FILE');

-- CreateTable
CREATE TABLE "PostAsset" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "kind" "PostAssetKind" NOT NULL,
    "bucket" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "publicUrl" TEXT,
    "pendingDeleteAt" TIMESTAMP(3),
    "deleteAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastDeleteError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostAsset_storagePath_key" ON "PostAsset"("storagePath");

-- CreateIndex
CREATE INDEX "PostAsset_postId_kind_createdAt_idx" ON "PostAsset"("postId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "PostAsset_pendingDeleteAt_createdAt_idx" ON "PostAsset"("pendingDeleteAt", "createdAt");

-- AddForeignKey
ALTER TABLE "PostAsset" ADD CONSTRAINT "PostAsset_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
