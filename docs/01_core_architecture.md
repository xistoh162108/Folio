# 01. Core Architecture

This repository is a Next.js 15 App Router application with one shared exact-v0 world split into:

- public product surface
- protected admin surface

The app keeps write paths in `lib/actions`, read paths in `lib/data`, Prisma as the single ORM boundary, and route-owned exact-v0 rendering in `components/v0/*`.

## Route tree

```text
app/
  (dashboard)/admin/
    analytics/page.tsx
    community/page.tsx
    content/page.tsx
    content/[postId]/page.tsx
    newsletter/page.tsx
    page.tsx
    posts/page.tsx
    posts/[postId]/page.tsx
    settings/page.tsx
    layout.tsx
  admin/login/page.tsx
  contact/page.tsx
  guestbook/page.tsx
  notes/page.tsx
  notes/[slug]/page.tsx
  notes/rss.xml/route.ts
  projects/page.tsx
  projects/[slug]/page.tsx
  projects/rss.xml/route.ts
  resume.pdf/route.ts
  subscribe/confirm/page.tsx
  unsubscribe/page.tsx
  api/
    admin/
      comments/[commentId]/route.ts
      guestbook/[entryId]/route.ts
      newsletter/uploads/route.ts
      profile/resume/route.ts
      uploads/route.ts
    analytics/route.ts
    auth/[...nextauth]/route.ts
    comments/[commentId]/delete/route.ts
    files/[assetId]/route.ts
    guestbook/route.ts
    posts/[postId]/
      comments/route.ts
      like/route.ts
    test-storage/route.ts
    worker/
      asset-cleanup/route.ts
      newsletter/route.ts
      webhook/route.ts
  layout.tsx
  page.tsx
```

## Primary code zones

```text
components/
  admin/           editor adapters and authoring helpers
  v0/admin/        exact-v0 admin shells and screens
  v0/public/       exact-v0 public shells and screens
  v0/runtime/      shared Jitter/runtime continuity

lib/
  actions/         server mutations
  content/         markdown/code/math shaping
  contracts/       DTO, query, input, and result types
  data/            read-side queries
  db/              Prisma client
  email/           email provider abstraction and templates
  feeds/           RSS serialization
  newsletter/      topic normalization, audience selection, compose helpers
  ops/             readiness and performance dashboards
  profile/         profile bootstrap and resume override helpers
  seo/             metadata and structured data
  site/            theme, palette, static profile constants
  storage/         Supabase storage boundary
  workers/         worker dispatch helpers
```

## Runtime ownership model

### Public shell ownership

- `components/v0/public/public-shell.tsx` is the canonical public shell.
- `components/v0/runtime/v0-experience-runtime.tsx` owns Jitter continuity and route-owned runtime descriptors.
- Mobile public routes use document scroll, not fixed-banner internal scroll.
- `md+` public routes keep the split-shell model.

### Admin shell ownership

- `components/v0/admin/admin-shell.tsx` is the canonical admin shell.
- `/admin` access is:
  - unauthenticated -> `/admin/login`
  - authenticated -> admin runtime
- admin lower sections are reached through structural scroll ownership, not overlays or drawers.

## Security boundaries

- all admin pages require an authenticated admin session
- upload routes require admin auth
- admin moderation routes require admin auth
- worker routes require `Authorization: Bearer ${CRON_SECRET}`
- public file access goes only through `GET /api/files/[assetId]`
- public file access is restricted to file assets on `PUBLISHED` posts
- route-scoped rate limiting protects:
  - subscription
  - contact
  - guestbook
  - comments
  - admin resume upload
  - admin newsletter operations
- analytics writes intentionally skip `/admin` pageview ingestion

## Data flow summary

### Content publishing

1. public list/detail routes fetch DTOs from `lib/data/posts.ts`
2. editor mutations run through `lib/actions/post.actions.ts`
3. `createDraftPost()` creates a real `DRAFT` row before uploads
4. `savePost()` persists:
   - markdown source
   - block/content JSON
   - rendered HTML
   - tags
   - links
   - retained assets
   - revision/audit state
5. `archivePost()` keeps the row and changes status
6. `deletePostPermanently()` is the destructive path and refuses DB delete if storage cleanup fails

### Rendering pipeline

1. authoring remains Markdown-first inside the v0 editor shell
2. reader rendering uses the same canonical markdown/block path
3. code blocks render through the sanitized canonical renderer
4. math renders through KaTeX-backed helpers instead of escaped placeholders
5. copy feedback is terminal-native: `yank` / `yanked`

### Community

1. guestbook and comments are written through public route handlers
2. moderation is admin-only
3. public comments and guestbook now page incrementally
4. guestbook remains latest-first and linear

### Profile / resume

1. Home, Contact, Guestbook, Settings, and `/resume.pdf` share one DB-backed profile runtime source
2. profile bootstrap exists as a static fallback
3. `/resume.pdf` serves:
   - uploaded Supabase override first
   - generated PDF fallback second
4. read-only resume lookup fails open to the generated fallback

### Newsletter

1. visible topic model is normalized to:
   - `all`
   - `project-info`
   - `log`
2. subscriber lifecycle is explicit:
   - pending confirm
   - confirmed
   - unsubscribed
3. campaign lifecycle is draft-first with queue ordering
4. recipient modes:
   - `TOPICS`
   - `SELECTED_SUBSCRIBERS`
5. newsletter assets can be inline images or file attachments
6. worker delivery operates off `NewsletterDelivery` rows

### Analytics / operations

1. raw analytics writes flow through `/api/analytics`
2. admin analytics reads aggregated metrics from raw events
3. readiness dashboard reads environment and service state
4. service log is projected from persisted operational records
5. admin performance dashboard combines server timings and client-side navigation timings

## Current exact-v0-preserving non-literal extensions

These are not literal `v0app` features, but they are now part of the accepted product:

- query-driven search and pagination
- RSS feeds and autodiscovery
- service log in admin analytics
- direct resume-file management
- newsletter targeting and asset management
- real math rendering

They remain accepted because they preserve the same exact-v0 world rather than introducing a second product language.
