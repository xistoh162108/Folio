import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { readTestStorageAsset } from "@/lib/storage/supabase"

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
}

function getContentType(storagePath: string) {
  const match = storagePath.toLowerCase().match(/\.[^.]+$/)
  if (!match) {
    return "application/octet-stream"
  }

  return MIME_BY_EXTENSION[match[0]] ?? "application/octet-stream"
}

export async function GET(request: Request) {
  if (env.STORAGE_DRIVER !== "test") {
    return NextResponse.json({ error: "Test storage route is unavailable." }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const bucket = searchParams.get("bucket")
  const storagePath = searchParams.get("path")

  if (!bucket || !storagePath) {
    return NextResponse.json({ error: "Missing test storage target." }, { status: 400 })
  }

  try {
    const buffer = await readTestStorageAsset(bucket, storagePath)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getContentType(storagePath),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to read test storage object." },
      { status: 404 },
    )
  }
}
