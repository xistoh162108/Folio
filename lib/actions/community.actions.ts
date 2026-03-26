"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function deleteCommentAsAdmin(formData: FormData) {
  await requireUser()

  const commentId = String(formData.get("commentId") ?? "").trim()
  if (!commentId) return

  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      deletedAt: true,
      post: {
        select: {
          slug: true,
          type: true,
        },
      },
    },
  })

  if (!comment || comment.deletedAt) {
    return
  }

  await prisma.postComment.update({
    where: { id: commentId },
    data: {
      deletedAt: new Date(),
    },
  })

  const detailPath = comment.post.type === "NOTE" ? `/notes/${comment.post.slug}` : `/projects/${comment.post.slug}`
  revalidatePath(detailPath)
  revalidatePath("/admin/community")
}

export async function deleteGuestbookEntryAsAdmin(formData: FormData) {
  await requireUser()

  const entryId = String(formData.get("entryId") ?? "").trim()
  if (!entryId) return

  await prisma.guestbookEntry.updateMany({
    where: {
      id: entryId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  })

  revalidatePath("/guestbook")
  revalidatePath("/admin/community")
}
