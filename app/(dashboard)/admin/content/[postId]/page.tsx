import { redirect } from "next/navigation"

export default async function AdminContentEditorPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  redirect(`/admin/posts/${postId}`)
}
