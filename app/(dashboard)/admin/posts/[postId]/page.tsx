import { PostEditor } from "@/components/admin/post-editor"
import { getAdminPostEditorState } from "@/lib/data/posts"

export default async function AdminPostEditorPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const post = await getAdminPostEditorState(postId)

  return <PostEditor initialPost={post} />
}
