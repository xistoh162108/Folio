import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authPostCache = new Map<string, { count: number; resetTime: number }>()
const MAX_AUTH_POSTS = 5
const AUTH_WINDOW_MS = 15 * 60 * 1000

export function middleware(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.next()
  }

  if (!request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
  const now = Date.now()
  const record = authPostCache.get(ip)

  if (record) {
    if (now > record.resetTime) {
      authPostCache.set(ip, { count: 1, resetTime: now + AUTH_WINDOW_MS })
    } else {
      record.count += 1
      if (record.count > MAX_AUTH_POSTS) {
        return new NextResponse("Too many login attempts. Please try again later.", { status: 429 })
      }
    }
  } else {
    authPostCache.set(ip, { count: 1, resetTime: now + AUTH_WINDOW_MS })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/auth/:path*"],
}
