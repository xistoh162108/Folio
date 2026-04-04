import { afterEach, describe, expect, it, vi } from "vitest"

import {
  classifyWebhookDispatchError,
  dispatchWebhookRequest,
  isPlaceholderWebhookDestination,
  resolveWebhookDispatchTarget,
} from "@/lib/workers/webhook-delivery"

describe("webhook worker helpers", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("prefers the validated env destination over a stale stored placeholder destination", () => {
    const target = resolveWebhookDispatchTarget(
      "https://your-ops-endpoint.example/hooks/contact",
      "https://xistoh-ops-telegram.xistoh162108.workers.dev/telegram-contact/secret",
    )

    expect(target).toMatchObject({
      destination: "https://xistoh-ops-telegram.xistoh162108.workers.dev/telegram-contact/secret",
      source: "env",
      staleStoredDestination: "https://your-ops-endpoint.example/hooks/contact",
      configError: null,
    })
  })

  it("classifies placeholder destinations as configuration errors", () => {
    expect(isPlaceholderWebhookDestination("https://your-ops-endpoint.example/hooks/contact")).toBe(true)

    expect(
      resolveWebhookDispatchTarget(
        "https://your-ops-endpoint.example/hooks/contact",
        "https://your-ops-endpoint.example/hooks/contact",
      ).configError,
    ).toContain("placeholder host")
  })

  it("captures non-2xx response snippets for actionable diagnostics", async () => {
    await expect(
      dispatchWebhookRequest(
        "https://ops.example.com/hooks/contact",
        {
          contactId: "contact_1",
          email: "reader@example.com",
          name: "Reader",
          message: "hello",
          text: "[PORTAL] hello",
        },
        vi.fn(async () => new Response("upstream exploded", { status: 502 })) as typeof fetch,
      ),
    ).rejects.toThrow("Webhook request failed with 502 from ops.example.com: upstream exploded")
  })

  it("classifies request timeouts with the target hostname", () => {
    vi.useFakeTimers()

    const controllerAwareFetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"))
          })
        }),
    ) as typeof fetch

    const pending = dispatchWebhookRequest(
      "https://ops.example.com/hooks/contact",
      {
        contactId: "contact_2",
        email: "reader@example.com",
        name: "Reader",
        message: "hello",
        text: "[PORTAL] hello",
      },
      controllerAwareFetch,
    )

    vi.advanceTimersByTime(8_100)

    return expect(pending.catch((error) => classifyWebhookDispatchError(error, "https://ops.example.com/hooks/contact"))).resolves.toBe(
      "Webhook request timed out after 8000ms to ops.example.com.",
    )
  })
})
