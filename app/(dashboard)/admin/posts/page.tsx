import { ManagePostsScreenBound } from "@/components/v0/admin/manage-posts-screen-bound"

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <ManagePostsScreenBound searchParams={searchParams} />
}
