import { afterEach, vi } from "vitest"

import { clearRateLimitStore } from "@/lib/security/rate-limit"
import { loadTestEnvironment } from "../scripts/test-env"

loadTestEnvironment()
vi.mock("server-only", () => ({}))

afterEach(() => {
  clearRateLimitStore()
})
