import { EditorScreen } from "@/components/v0/admin/editor-screen"
import { getAdminPostEditorState } from "@/lib/data/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function EditorScreenBound({
  postId,
  brandLabel = "xistoh.log",
}: {
  postId: string
  brandLabel?: string
}) {
  const [post, isDarkMode] = await Promise.all([getAdminPostEditorState(postId), getV0ThemeIsDark()])

  return <EditorScreen brandLabel={brandLabel} isDarkMode={isDarkMode} post={post} />
}
