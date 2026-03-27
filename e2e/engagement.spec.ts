import { expect, test } from "@playwright/test"

import { readTestOutbox, readTestWebhookSink } from "./helpers/sinks"
import { disconnectTestPrisma, testPrisma } from "./helpers/db"

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("subscription confirm/unsubscribe and contact webhook flow work end-to-end", async ({ page }) => {
  const marker = `e2e-engagement-${Date.now()}`
  const email = `${marker}@example.com`
  const contactEmail = `${marker}-contact@example.com`

  await page.goto("/")
  const subscriptionInput = page.locator('input[placeholder="you@email.com"]').first()
  await subscriptionInput.fill(email)
  await subscriptionInput.locator("xpath=ancestor::form[1]").locator("button").click()
  await expect(page.getByText(/verification email/i)).toBeVisible()

  await expect
    .poll(async () => {
      const outbox = await readTestOutbox()
      const entry = outbox.find((message) => message.to === email)
      return entry?.html.match(/href="([^"]*\/subscribe\/confirm\?token=[^"]+)"/)?.[1] ?? ""
    })
    .toContain("/subscribe/confirm?token=")

  const outbox = await readTestOutbox()
  const confirmUrl =
    outbox
      .find((message) => message.to === email)
      ?.html.match(/href="([^"]*\/subscribe\/confirm\?token=[^"]+)"/)?.[1] ?? null

  if (!confirmUrl) {
    throw new Error("Missing confirmation link in test email outbox.")
  }

  await page.goto(confirmUrl)
  await page.getByRole("button", { name: /\[confirm subscription\]/i }).click()
  await expect(page.getByRole("heading", { name: "Subscription confirmed" })).toBeVisible()

  const subscriber = await testPrisma.subscriber.findUniqueOrThrow({
    where: { email },
    select: {
      unsubscribeToken: true,
      isConfirmed: true,
    },
  })
  expect(subscriber.isConfirmed).toBe(true)

  await page.goto(`/unsubscribe?token=${subscriber.unsubscribeToken}`)
  await page.getByRole("button", { name: /\[unsubscribe\]/i }).click()
  await expect(page.getByRole("heading", { name: "Subscription cancelled" })).toBeVisible()

  await page.goto("/contact")
  await page.getByPlaceholder("Name_").fill("QA Contact")
  await page.getByPlaceholder("Email_").fill(contactEmail)
  await page.getByPlaceholder("Message_").fill(`Message from ${marker}`)
  await page.getByRole("button", { name: /\[\s*submit\s*\]/i }).click()
  await expect(page.getByText(/\[\s*ok:\s*message queued/i)).toBeVisible()

  await expect
    .poll(async () => {
      const sink = await readTestWebhookSink()
      return sink.some((entry) => JSON.stringify(entry.payload).includes(marker))
    })
    .toBe(true)

  await expect
    .poll(async () => {
      const outboxAfterContact = await readTestOutbox()
      return outboxAfterContact.some((message) => message.to === contactEmail)
    })
    .toBe(true)
})
