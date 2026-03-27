import { redirect } from "next/navigation"

import { createDraftPost } from "@/lib/actions/post.actions"

export default async function AdminContentPage() {
  const result = await createDraftPost()

  if (!result.success) {
    throw new Error(result.error)
  }

  redirect(`/admin/posts/${result.id}`)
}
