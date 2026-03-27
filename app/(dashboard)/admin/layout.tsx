import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth"
import { buildAdminMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildAdminMetadata("Admin")

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/admin/login")
  }

  return children
}
