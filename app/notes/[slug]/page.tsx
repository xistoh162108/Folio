import { PostDetailView } from "@/components/site/post-detail-view"
import { SiteHeader } from "@/components/site/site-header"
import { getSession } from "@/lib/auth"
import { getPublishedPostDetail } from "@/lib/data/posts"

export const dynamic = "force-dynamic"

export default async function NoteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [session, post] = await Promise.all([getSession(), getPublishedPostDetail("NOTE", slug)])

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <PostDetailView
          post={post}
          kindLabel="Note"
          backHref="/notes"
          backLabel="Back to notes"
          attachmentTitle="Attachments"
          canModerate={Boolean(session?.user?.id)}
        />
      </main>
    </div>
  )
}
