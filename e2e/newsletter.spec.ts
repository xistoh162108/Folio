import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma, testPrisma } from "./helpers/db"
import { readTestOutbox } from "./helpers/sinks"

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("newsletter create, test send, start, fail injection, and retry work end-to-end", async ({ page }) => {
  await ensureAdminUser()
  const marker = `e2e-newsletter-${Date.now()}`
  const topic = await testPrisma.newsletterTopic.upsert({
    where: { normalizedName: "all" },
    update: { name: "All" },
    create: {
      name: "All",
      normalizedName: "all",
    },
  })

  const subscriber = await testPrisma.subscriber.create({
    data: {
      email: `${marker}@example.com`,
      isConfirmed: true,
      confirmedAt: new Date(),
      unsubscribeToken: `${marker}-unsubscribe`,
      topics: {
        connect: [{ id: topic.id }],
      },
    },
  })

  await loginAsAdmin(page)
  await page.goto("/admin/newsletter")

  await page.getByPlaceholder("Subject: Your newsletter title...").fill(`${marker} subject`)
  await page.getByRole("button", { name: /\[\s*send test to self\s*\]/i }).click()

  await expect
    .poll(async () => {
      const outbox = await readTestOutbox()
      return outbox.some((entry) => entry.subject === `${marker} subject`)
    })
    .toBe(true)

  await page.getByRole("button", { name: /Launch Campaign \(1\)/i }).click()
  await expect(page.getByText(`${marker} subject`)).toBeVisible()

  await expect
    .poll(async () => {
      return testPrisma.newsletterCampaign.findFirst({
        where: { subject: `${marker} subject` },
        select: { status: true },
      })
    })
    .toMatchObject({ status: "COMPLETED" })

  const campaign = await testPrisma.newsletterCampaign.findFirstOrThrow({
    where: { subject: `${marker} subject` },
    select: { id: true, sentCount: true, failedCount: true, status: true },
  })

  expect(campaign.status).toBe("COMPLETED")
  expect(campaign.sentCount).toBe(1)
  expect(campaign.failedCount).toBe(0)

  const delivery = await testPrisma.newsletterDelivery.findFirstOrThrow({
    where: {
      campaignId: campaign!.id,
      email: subscriber.email,
    },
    select: {
      id: true,
      createdAt: true,
    },
  })

  await testPrisma.newsletterDelivery.update({
    where: { id: delivery.id },
    data: {
      status: "FAILED",
      errorMessage: "Injected failure for retry path.",
      sentAt: null,
      processingAt: null,
    },
  })

  await testPrisma.newsletterCampaign.update({
    where: { id: campaign!.id },
    data: {
      status: "FAILED",
      failedCount: 1,
      sentCount: 0,
      completedAt: new Date(),
      lastError: "Injected failure for retry path.",
    },
  })

  await page.reload()
  await page.getByRole("button", { name: /\[retry\]/i }).click()

  await expect
    .poll(async () => {
      return testPrisma.newsletterDelivery.findUnique({
        where: { id: delivery.id },
        select: {
          status: true,
          createdAt: true,
          errorMessage: true,
        },
      })
    })
    .toMatchObject({
      status: "SENT",
      createdAt: delivery.createdAt,
      errorMessage: null,
    })
})
