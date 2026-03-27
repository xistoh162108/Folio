import { EditorScreenBound } from "@/components/v0/admin/editor-screen-bound"

export default async function AdminPostEditorPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params

  return <EditorScreenBound postId={postId} />
}
