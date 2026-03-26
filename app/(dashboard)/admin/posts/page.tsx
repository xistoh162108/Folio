import { redirect } from "next/navigation"

import { AdminPostsManagementShell } from "@/components/admin/posts-management-shell"
import { createDraftPost } from "@/lib/actions/post.actions"
import { getAdminPosts } from "@/lib/data/posts"

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = await searchParams
  const data = await getAdminPosts(query)

  async function handleCreateDraft() {
    "use server"

    const result = await createDraftPost()

    if (!result.success) {
      throw new Error(result.error)
    }

    redirect(`/admin/posts/${result.id}`)
  }

  return (
    <AdminPostsManagementShell
      basePath="/admin/posts"
      eyebrow="Posts"
      title="Post operations"
      description="Search, filter, and paginate the canonical post list without leaving the admin shell."
      data={data}
      onCreateDraft={handleCreateDraft}
    />
  )
}
