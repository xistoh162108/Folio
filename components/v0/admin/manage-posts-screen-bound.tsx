import { redirect } from "next/navigation"

import { ManagePostsScreen } from "@/components/v0/admin/manage-posts-screen"
import { createDraftPost } from "@/lib/actions/post.actions"
import { getAdminPosts } from "@/lib/data/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function ManagePostsScreenBound({
  searchParams = Promise.resolve({}),
  brandLabel = "xistoh.log",
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
  brandLabel?: string
} = {}) {
  const query = await searchParams
  const [data, isDarkMode] = await Promise.all([getAdminPosts(query), getV0ThemeIsDark()])

  async function handleCreateDraft() {
    "use server"

    const result = await createDraftPost()

    if (!result.success) {
      throw new Error(result.error)
    }

    redirect(`/admin/posts/${result.id}`)
  }

  return (
    <ManagePostsScreen
      basePath="/admin/posts"
      brandLabel={brandLabel}
      data={data}
      isDarkMode={isDarkMode}
      onCreateDraft={handleCreateDraft}
    />
  )
}
