import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { createSignedDownloadUrl } from "@/lib/storage/supabase"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params

  try {
    const asset = await prisma.postAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        kind: true,
        bucket: true,
        storagePath: true,
        pendingDeleteAt: true,
        post: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!asset || asset.kind !== "FILE" || asset.pendingDeleteAt) {
      return NextResponse.json({ error: "File asset not found." }, { status: 404 })
    }

    const session = await getSession()
    const isAdmin = Boolean(session?.user?.id)
    const isPubliclyAccessible = asset.post.status === "PUBLISHED"

    if (!isAdmin && !isPubliclyAccessible) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const signedUrl = await createSignedDownloadUrl(asset.bucket, asset.storagePath, 600)
    return NextResponse.redirect(signedUrl, 302)
  } catch (error) {
    if (isMissingTableError(error, "PostAsset")) {
      return NextResponse.json(
        { error: "PostAsset migration has not been applied yet. Run the latest Prisma migrations first." },
        { status: 503 },
      )
    }

    const message = error instanceof Error ? error.message : "Could not issue a download URL."
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
