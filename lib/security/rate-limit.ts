type HeaderSource = Pick<Headers, "get">

type RateLimitInput = {
  namespace: string
  identifier: string
  limit: number
  windowMs: number
}

type RateLimitRecord = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

export class RateLimitExceededError extends Error {
  status = 429 as const

  constructor(message = "Too many requests. Please try again later.") {
    super(message)
    this.name = "RateLimitExceededError"
  }
}

function buildStoreKey(namespace: string, identifier: string) {
  return `${namespace}:${identifier}`
}

export function getClientIp(headers: HeaderSource) {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) {
      return first
    }
  }

  const realIp = headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  return "127.0.0.1"
}

export function assertRateLimit(input: RateLimitInput) {
  const key = buildStoreKey(input.namespace, input.identifier)
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + input.windowMs,
    })
    return
  }

  record.count += 1

  if (record.count > input.limit) {
    throw new RateLimitExceededError()
  }
}

export function clearRateLimitStore() {
  rateLimitStore.clear()
}
