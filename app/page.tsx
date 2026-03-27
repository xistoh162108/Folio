import type { Metadata } from "next"

import { HomeScreenBound } from "@/components/v0/public/home-screen-bound"
import { getPrimaryProfileSnapshot } from "@/lib/data/profile"
import { buildPublicMetadata } from "@/lib/seo/metadata"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPrimaryProfileSnapshot()

  return buildPublicMetadata({
    title: profile.displayName,
    description: profile.summary,
    path: "/",
  })
}

export default async function HomePage() {
  return <HomeScreenBound />
}
