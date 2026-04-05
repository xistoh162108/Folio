ALTER TABLE "Post"
ADD COLUMN "previousNoteId" TEXT;

CREATE UNIQUE INDEX "Post_previousNoteId_key" ON "Post"("previousNoteId");

ALTER TABLE "Post"
ADD CONSTRAINT "Post_previousNoteId_fkey" FOREIGN KEY ("previousNoteId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
