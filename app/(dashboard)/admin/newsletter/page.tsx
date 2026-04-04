import { NewsletterScreenBound } from "@/components/v0/admin/newsletter-screen-bound"

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <NewsletterScreenBound searchParams={searchParams} />
}
