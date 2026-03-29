import { mkdir } from "fs/promises"

import { chromium, type Browser, type Page } from "@playwright/test"

import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, ensureAdminUser } from "../e2e/helpers/admin"
import { disconnectTestPrisma, testPrisma } from "../e2e/helpers/db"
import { loadTestEnvironment } from "./test-env"

loadTestEnvironment()

const CURRENT_BASE_URL = process.env.CURRENT_BASE_URL ?? "http://127.0.0.1:3311"
const V0_BASE_URL = process.env.V0_BASE_URL ?? "http://127.0.0.1:3410"
const PARITY_SCOPE = process.env.PARITY_SCOPE ?? "all"
const PARITY_DATE = process.env.PARITY_DATE ?? "2026-03-27"
const LEGACY_OUT_DIR = process.env.PARITY_OUT_DIR
const PUBLIC_OUT_DIR =
  process.env.PUBLIC_PARITY_OUT_DIR ??
  (PARITY_SCOPE === "public" && LEGACY_OUT_DIR ? LEGACY_OUT_DIR : `docs/migration/parity/${PARITY_DATE}-public`)
const ADMIN_OUT_DIR =
  process.env.ADMIN_PARITY_OUT_DIR ??
  (PARITY_SCOPE === "admin" && LEGACY_OUT_DIR ? LEGACY_OUT_DIR : `docs/migration/parity/${PARITY_DATE}-admin`)
const RESPONSIVE_OUT_DIR =
  process.env.RESPONSIVE_PARITY_OUT_DIR ??
  (PARITY_SCOPE === "responsive" && LEGACY_OUT_DIR
    ? LEGACY_OUT_DIR
    : `docs/migration/parity/${PARITY_DATE}-responsive`)
const FIXED_TIMESTAMP = 1_772_649_600_000
const PNG_FIXTURE = "public/icon-light-32x32.png"

type PublicParityFixtures = {
  marker: string
  noteId: string
  noteSlug: string
  projectId: string
  projectSlug: string
  guestbookEntryId: string
}

type AdminParityFixtures = {
  marker: string
  postIds: string[]
  defaultDraftId: string
  validationDraftId: string
  uploadDraftId: string
}

async function createCapturePage(browser: Browser, viewport: { width: number; height: number } = { width: 1440, height: 1024 }) {
  const page = await browser.newPage({ viewport })
  await page.addInitScript((fixedTimestamp) => {
    const originalNow = Date.now
    Date.now = () => fixedTimestamp
    Math.random = () => 0.123456789
    ;(window as Window & { __V0_PARITY_MODE?: boolean }).__V0_PARITY_MODE = true
    ;(window as Window & { __V0_ORIGINAL_DATE_NOW__?: typeof Date.now }).__V0_ORIGINAL_DATE_NOW__ = originalNow
  }, FIXED_TIMESTAMP)

  return page
}

async function stabilizeForCapture(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }
      html {
        scroll-behavior: auto !important;
      }
    `,
  })
}

async function waitForHeading(page: Page, heading: string) {
  await page.getByRole("heading", { name: heading }).waitFor({ state: "visible" })
  await page.waitForLoadState("networkidle")
  await stabilizeForCapture(page)
  await page.waitForTimeout(200)
}

async function waitForLabel(page: Page, label: string) {
  await page.getByLabel(label).waitFor({ state: "visible" })
  await page.waitForLoadState("networkidle")
  await stabilizeForCapture(page)
  await page.waitForTimeout(200)
}

async function screenshot(page: Page, path: string) {
  await stabilizeForCapture(page)
  await page.screenshot({ path, fullPage: true })
}

async function seedPublicParityFixtures(): Promise<PublicParityFixtures> {
  const marker = `parity-public-${Date.now()}`
  const [note, project, guestbookEntry] = await Promise.all([
    testPrisma.post.create({
      data: {
        slug: `${marker}-note`,
        type: "NOTE",
        status: "PUBLISHED",
        title: `${marker} note`,
        excerpt: `${marker} note excerpt`,
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: `${marker} note body` }] }],
        },
        htmlContent: `<p>${marker} note body</p>`,
        publishedAt: new Date(FIXED_TIMESTAMP),
      },
      select: { id: true, slug: true },
    }),
    testPrisma.post.create({
      data: {
        slug: `${marker}-project`,
        type: "PROJECT",
        status: "PUBLISHED",
        title: `${marker} project`,
        excerpt: `${marker} project excerpt`,
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: `${marker} project body` }] }],
        },
        htmlContent: `<p>${marker} project body</p>`,
        publishedAt: new Date(FIXED_TIMESTAMP),
      },
      select: { id: true, slug: true },
    }),
    testPrisma.guestbookEntry.create({
      data: {
        message: `${marker} guestbook`,
        ipHash: marker,
        userAgent: "Parity Capture",
      },
      select: { id: true },
    }),
  ])

  return {
    marker,
    noteId: note.id,
    noteSlug: note.slug,
    projectId: project.id,
    projectSlug: project.slug,
    guestbookEntryId: guestbookEntry.id,
  }
}

async function cleanupPublicParityFixtures(fixtures: PublicParityFixtures) {
  await testPrisma.guestbookEntry.deleteMany({ where: { id: fixtures.guestbookEntryId } }).catch(() => undefined)
  await testPrisma.post.deleteMany({
    where: {
      id: {
        in: [fixtures.noteId, fixtures.projectId],
      },
    },
  }).catch(() => undefined)
}

async function seedAdminParityFixtures(): Promise<AdminParityFixtures> {
  const marker = `parity-admin-${Date.now()}`
  const postIds: string[] = []

  for (let index = 0; index < 12; index += 1) {
    const post = await testPrisma.post.create({
      data: {
        slug: `${marker}-list-${index + 1}`,
        type: index % 4 === 0 ? "PROJECT" : "NOTE",
        status: index % 3 === 0 ? "PUBLISHED" : "DRAFT",
        title: `${marker} content ${String(index + 1).padStart(2, "0")}`,
        excerpt: `${marker} excerpt ${index + 1}`,
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: `${marker} body ${index + 1}` }] }],
        },
        htmlContent: `<p>${marker} body ${index + 1}</p>`,
        publishedAt: index % 3 === 0 ? new Date(FIXED_TIMESTAMP) : null,
      },
      select: { id: true },
    })

    postIds.push(post.id)
  }

  const [defaultDraft, validationDraft, uploadDraft] = await Promise.all([
    testPrisma.post.create({
      data: {
        slug: `${marker}-editor-default`,
        type: "NOTE",
        status: "DRAFT",
        title: "",
        excerpt: "",
        content: { type: "doc", content: [{ type: "paragraph" }] },
        htmlContent: "",
      },
      select: { id: true },
    }),
    testPrisma.post.create({
      data: {
        slug: `${marker}-editor-validation`,
        type: "NOTE",
        status: "DRAFT",
        title: `${marker} validation`,
        excerpt: "",
        content: { type: "doc", content: [{ type: "paragraph" }] },
        htmlContent: "",
      },
      select: { id: true },
    }),
    testPrisma.post.create({
      data: {
        slug: `${marker}-editor-upload`,
        type: "PROJECT",
        status: "DRAFT",
        title: `${marker} upload`,
        excerpt: "",
        content: { type: "doc", content: [{ type: "paragraph" }] },
        htmlContent: "",
      },
      select: { id: true },
    }),
  ])

  return {
    marker,
    postIds: [...postIds, defaultDraft.id, validationDraft.id, uploadDraft.id],
    defaultDraftId: defaultDraft.id,
    validationDraftId: validationDraft.id,
    uploadDraftId: uploadDraft.id,
  }
}

async function cleanupAdminParityFixtures(fixtures: AdminParityFixtures) {
  await testPrisma.post.deleteMany({
    where: {
      id: {
        in: fixtures.postIds,
      },
    },
  }).catch(() => undefined)
}

async function loginCurrentAdmin(page: Page) {
  await page.goto(`${CURRENT_BASE_URL}/admin/login`, { waitUntil: "domcontentloaded" })
  await waitForHeading(page, "System Access")
  await page.getByPlaceholder("Identify_").fill(E2E_ADMIN_EMAIL)
  await page.getByPlaceholder("Passphrase_").fill(E2E_ADMIN_PASSWORD)
  await page.getByRole("button", { name: /\[\s*initiate override_\s*\]/i }).click()
  await page.waitForURL(/\/admin\/(analytics|posts)/)
  await waitForHeading(page, "Terminal Dashboard")
}

async function capturePublicCurrent(browser: Browser) {
  const fixtures = await seedPublicParityFixtures()
  const page = await createCapturePage(browser)

  try {
    for (const [route, name, heading] of [
      ["/", "home", "Jimin Park"],
      ["/notes", "notes", "Notes & Seeds"],
      ["/projects", "projects", "Featured Work"],
      ["/contact", "contact", "Get in Touch"],
      [`/notes/${fixtures.noteSlug}`, "note-detail", `${fixtures.marker} note`],
      [`/projects/${fixtures.projectSlug}`, "project-detail", `${fixtures.marker} project`],
      ["/guestbook", "guestbook", "System logs from visitors"],
      ["/subscribe/confirm?token=parity-confirm-token", "confirm-pending", "Confirm your subscription"],
      ["/subscribe/confirm?result=confirmed&message=Subscription%20fully%20confirmed.", "confirm-result", "Subscription confirmed"],
      ["/unsubscribe?token=parity-unsubscribe-token", "unsubscribe-pending", "Confirm unsubscribe"],
      ["/unsubscribe?result=unsubscribed&message=Subscription%20cancelled.", "unsubscribe-result", "Subscription cancelled"],
    ] as const) {
      console.log(`capture public current: ${name}`)
      await page.goto(`${CURRENT_BASE_URL}${route}`, { waitUntil: "domcontentloaded" })
      await waitForHeading(page, heading)
      await screenshot(page, `${PUBLIC_OUT_DIR}/current-${name}.png`)
    }
  } finally {
    await page.close()
    await cleanupPublicParityFixtures(fixtures)
  }
}

async function capturePublicReference(browser: Browser) {
  const page = await createCapturePage(browser)

  try {
    await page.goto(V0_BASE_URL, { waitUntil: "domcontentloaded" })
    console.log("capture public reference: home")
    await waitForHeading(page, "Jimin Park")
    await screenshot(page, `${PUBLIC_OUT_DIR}/v0-home.png`)

    for (const [label, name, heading] of [
      ["/notes", "notes", "Notes & Seeds"],
      ["/projects", "projects", "Featured Work"],
      ["/contact", "contact", "Get in Touch"],
    ] as const) {
      console.log(`capture public reference: ${name}`)
      await page.getByRole("button", { name: label }).click()
      await waitForHeading(page, heading)
      await screenshot(page, `${PUBLIC_OUT_DIR}/v0-${name}.png`)
    }

    console.log("capture public reference: note-detail")
    await page.goto(V0_BASE_URL, { waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: "/notes" }).click()
    await waitForHeading(page, "Notes & Seeds")
    await page.getByRole("button", { name: /Neural Network Fundamentals/i }).click()
    await waitForHeading(page, "Neural Network Fundamentals")
    await screenshot(page, `${PUBLIC_OUT_DIR}/v0-note-detail.png`)

    console.log("capture public reference: project-detail")
    await page.goto(V0_BASE_URL, { waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: "/projects" }).click()
    await waitForHeading(page, "Featured Work")
    await page.getByRole("button", { name: /LifeXP ->/i }).click()
    await waitForHeading(page, "LifeXP")
    await screenshot(page, `${PUBLIC_OUT_DIR}/v0-project-detail.png`)
  } finally {
    await page.close()
  }
}

async function captureAdminCurrent(browser: Browser) {
  await ensureAdminUser()
  const fixtures = await seedAdminParityFixtures()
  const page = await createCapturePage(browser)

  try {
    await page.goto(`${CURRENT_BASE_URL}/admin/login`, { waitUntil: "domcontentloaded" })
    console.log("capture admin current: login")
    await waitForHeading(page, "System Access")
    await screenshot(page, `${ADMIN_OUT_DIR}/current-login.png`)

    await loginCurrentAdmin(page)
    console.log("capture admin current: analytics")
    await screenshot(page, `${ADMIN_OUT_DIR}/current-analytics.png`)

    for (const [route, name, heading] of [
      ["/admin/newsletter", "newsletter", "Email Campaign Manager"],
      ["/admin/settings", "settings", "Profile & CV Editor"],
      ["/admin/community", "community", "Moderation Queue"],
    ] as const) {
      console.log(`capture admin current: ${name}`)
      await page.goto(`${CURRENT_BASE_URL}${route}`, { waitUntil: "domcontentloaded" })
      await waitForHeading(page, heading)
      await screenshot(page, `${ADMIN_OUT_DIR}/current-${name}.png`)
    }

    for (const [route, name] of [
      ["/admin/posts", "manage-posts-default"],
      [`/admin/posts?q=${fixtures.marker}`, "manage-posts-search-active"],
      [`/admin/posts?q=${fixtures.marker}&type=PROJECT`, "manage-posts-filtered"],
      [`/admin/posts?q=${fixtures.marker}-missing`, "manage-posts-empty-result"],
      [`/admin/posts?q=${fixtures.marker}&page=2`, "manage-posts-paginated"],
    ] as const) {
      console.log(`capture admin current: ${name}`)
      await page.goto(`${CURRENT_BASE_URL}${route}`, { waitUntil: "domcontentloaded" })
      await waitForHeading(page, "All Content")
      await screenshot(page, `${ADMIN_OUT_DIR}/current-${name}.png`)
    }

    console.log("capture admin current: content-default")
    await page.goto(`${CURRENT_BASE_URL}/admin/posts/${fixtures.defaultDraftId}`, { waitUntil: "domcontentloaded" })
    await waitForHeading(page, "Content Editor")
    await waitForLabel(page, "Title")
    await screenshot(page, `${ADMIN_OUT_DIR}/current-content-default.png`)

    console.log("capture admin current: content-project-toggle")
    await page.getByRole("button", { name: /Mark as Project/i }).click()
    await page.waitForTimeout(150)
    await screenshot(page, `${ADMIN_OUT_DIR}/current-content-project-toggle.png`)

    console.log("capture admin current: content-publish-ready")
    await page.goto(`${CURRENT_BASE_URL}/admin/posts/${fixtures.defaultDraftId}`, { waitUntil: "domcontentloaded" })
    await waitForHeading(page, "Content Editor")
    await page.getByLabel("Title").fill(`${fixtures.marker} ready`)
    await page.waitForTimeout(150)
    await screenshot(page, `${ADMIN_OUT_DIR}/current-content-publish-ready.png`)

    console.log("capture admin current: content-validation-error")
    await page.goto(`${CURRENT_BASE_URL}/admin/posts/${fixtures.validationDraftId}`, { waitUntil: "domcontentloaded" })
    await waitForHeading(page, "Content Editor")
    await page.getByLabel("Title").fill("")
    await page.getByRole("button", { name: "Save Draft" }).click()
    await page.getByText(/\[Title is required\]/).waitFor({ state: "visible" })
    await screenshot(page, `${ADMIN_OUT_DIR}/current-content-validation-error.png`)

    console.log("capture admin current: content-upload-pending")
    await page.goto(`${CURRENT_BASE_URL}/admin/posts/${fixtures.uploadDraftId}`, { waitUntil: "domcontentloaded" })
    await waitForHeading(page, "Content Editor")
    await page.evaluate(() => {
      const originalFetch = window.fetch.bind(window)
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const requestUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url

        if (requestUrl.includes("/api/admin/uploads")) {
          return new Promise<Response>(() => undefined)
        }

        return originalFetch(input, init)
      }) as typeof window.fetch
    })
    await page.locator('input[type="file"][accept*="image/jpeg"]').setInputFiles(PNG_FIXTURE)
    await page.getByText(/\[ uploading_ \]/i).waitFor({ state: "visible" })
    await screenshot(page, `${ADMIN_OUT_DIR}/current-content-upload-pending.png`)
  } finally {
    await page.close()
    await cleanupAdminParityFixtures(fixtures)
  }
}

async function captureAdminReference(browser: Browser) {
  const page = await createCapturePage(browser)

  try {
    await page.goto(V0_BASE_URL, { waitUntil: "domcontentloaded" })
    console.log("capture admin reference: analytics")
    await page.getByRole("button", { name: "admin" }).click()
    await waitForHeading(page, "Terminal Dashboard")
    await screenshot(page, `${ADMIN_OUT_DIR}/v0-analytics.png`)

    for (const [label, name, heading] of [
      ["[+] New Content", "content", "Content Editor"],
      ["Manage Posts", "manage-posts", "All Content"],
      ["Newsletter", "newsletter", "Email Campaign Manager"],
      ["Profile / CV", "settings", "Profile & CV Editor"],
    ] as const) {
      console.log(`capture admin reference: ${name}`)
      await page.getByRole("button", { name: label }).click()
      await waitForHeading(page, heading)
      await screenshot(page, `${ADMIN_OUT_DIR}/v0-${name}.png`)
    }
  } finally {
    await page.close()
  }
}

async function captureResponsiveCurrent(browser: Browser) {
  await ensureAdminUser()
  const publicFixtures = await seedPublicParityFixtures()
  const adminFixtures = await seedAdminParityFixtures()

  const captures = [
    {
      name: "mobile-portrait-home",
      route: "/",
      heading: "Jimin Park",
      viewport: { width: 390, height: 844 },
      requiresAdmin: false,
    },
    {
      name: "mobile-portrait-admin-settings",
      route: "/admin/settings",
      heading: "Profile & CV Editor",
      viewport: { width: 390, height: 844 },
      requiresAdmin: true,
    },
    {
      name: "mobile-landscape-guestbook",
      route: "/guestbook",
      heading: "System logs from visitors",
      viewport: { width: 844, height: 390 },
      requiresAdmin: false,
    },
    {
      name: "tablet-portrait-note-detail",
      route: `/notes/${publicFixtures.noteSlug}`,
      heading: `${publicFixtures.marker} note`,
      viewport: { width: 820, height: 1180 },
      requiresAdmin: false,
    },
    {
      name: "tablet-landscape-admin-analytics",
      route: "/admin/analytics",
      heading: "Terminal Dashboard",
      viewport: { width: 1180, height: 820 },
      requiresAdmin: true,
    },
    {
      name: "tall-desktop-contact",
      route: "/contact",
      heading: "Get in Touch",
      viewport: { width: 1280, height: 1400 },
      requiresAdmin: false,
    },
    {
      name: "wide-desktop-projects",
      route: "/projects",
      heading: "Featured Work",
      viewport: { width: 1600, height: 900 },
      requiresAdmin: false,
    },
    {
      name: "wide-desktop-admin-posts",
      route: `/admin/posts?q=${adminFixtures.marker}`,
      heading: "All Content",
      viewport: { width: 1600, height: 900 },
      requiresAdmin: true,
    },
  ] as const

  try {
    for (const capture of captures) {
      const page = await createCapturePage(browser, capture.viewport)

      try {
        console.log(`capture responsive current: ${capture.name}`)

        if (capture.requiresAdmin) {
          await loginCurrentAdmin(page)
        }

        await page.goto(`${CURRENT_BASE_URL}${capture.route}`, { waitUntil: "domcontentloaded" })
        await waitForHeading(page, capture.heading)
        await screenshot(page, `${RESPONSIVE_OUT_DIR}/current-${capture.name}.png`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await cleanupPublicParityFixtures(publicFixtures)
    await cleanupAdminParityFixtures(adminFixtures)
  }
}

async function main() {
  if (PARITY_SCOPE === "all" || PARITY_SCOPE === "public") {
    await mkdir(PUBLIC_OUT_DIR, { recursive: true })
  }

  if (PARITY_SCOPE === "all" || PARITY_SCOPE === "admin") {
    await mkdir(ADMIN_OUT_DIR, { recursive: true })
  }

  if (PARITY_SCOPE === "all" || PARITY_SCOPE === "responsive") {
    await mkdir(RESPONSIVE_OUT_DIR, { recursive: true })
  }

  const browser = await chromium.launch({ headless: true })

  try {
    if (PARITY_SCOPE === "all" || PARITY_SCOPE === "public") {
      await capturePublicCurrent(browser)
      await capturePublicReference(browser)
    }

    if (PARITY_SCOPE === "all" || PARITY_SCOPE === "admin") {
      await captureAdminCurrent(browser)
      await captureAdminReference(browser)
    }

    if (PARITY_SCOPE === "all" || PARITY_SCOPE === "responsive") {
      await captureResponsiveCurrent(browser)
    }
  } finally {
    await browser.close()
    await disconnectTestPrisma()
  }
}

void main()
