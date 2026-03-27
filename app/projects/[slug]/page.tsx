import type { Metadata } from "next"

import { DetailProjectScreenBound } from "@/components/v0/public/detail-project-screen-bound"
import { getPublishedPostDetail } from "@/lib/data/posts"
import { buildArticleMetadata, buildPostStructuredData, getPostSeoDescription, getPostSeoImages } from "@/lib/seo/metadata"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPostDetail("PROJECT", slug)

  return buildArticleMetadata({
    title: post.title,
    description: getPostSeoDescription(post),
    path: `/projects/${post.slug}`,
    publishedTime: post.publishedAt ?? post.updatedAt,
    modifiedTime: post.updatedAt,
    tags: post.tags,
    images: getPostSeoImages(post),
  })
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPostDetail("PROJECT", slug)

  return (
    <>
      <DetailProjectScreenBound slug={slug} post={post} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPostStructuredData(post)) }}
      />
    </>
  )
}
