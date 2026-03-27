import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginScreenBound } from "@/components/v0/admin/login-screen-bound"
import { getSession } from "@/lib/auth"
import { buildAdminMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildAdminMetadata("System Access")

export default async function AdminLoginPage() {
  const session = await getSession()

  if (session?.user?.id) {
    redirect("/admin/analytics")
  }

  return <LoginScreenBound />
}
