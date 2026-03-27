# 01. Core Architecture

This repository is a Next.js 15 App Router application with two live surfaces:

- public product surface
- protected admin dashboard surface

The codebase keeps most business logic in `lib/` and uses Prisma as the single database client. Transactions are used where multi-table consistency matters, while read-side queries stay in `lib/data`.

## Runtime route tree

```text
app/
  (dashboard)/admin/
    analytics/page.tsx
    community/page.tsx
    content/page.tsx               -> redirect alias
    content/[postId]/page.tsx      -> redirect alias
    newsletter/page.tsx
    page.tsx
    posts/page.tsx
    posts/[postId]/page.tsx
    settings/page.tsx
    layout.tsx
  admin/login/page.tsx
  contact/page.tsx
  api/
    admin/
      comments/[commentId]/route.ts
      guestbook/[entryId]/route.ts
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
  guestbook/page.tsx
  notes/page.tsx
  notes/[slug]/page.tsx
  projects/page.tsx
  projects/[slug]/page.tsx
  resume.pdf/route.ts
  subscribe/confirm/page.tsx
  unsubscribe/page.tsx
  layout.tsx
  page.tsx
```

## Primary code zones

```text
lib/
  actions/        Server Actions for posts, subscribers, contact, newsletter, moderation
  analytics/      Derived analytics metrics
  auth.ts         NextAuth credentials config and requireUser()
  content/        Link preview fetch, draft state, preview metadata
  contracts/      Shared DTO and payload contracts
  data/           Read-side queries for posts, analytics, community, newsletter
  db/             Prisma client and DB error helpers
  email/          EmailProvider abstraction, Resend adapter, test driver, templates
  newsletter/     Subscriber selection and campaign aggregate services
  ops/            Readiness dashboard source of truth
  runtime/        Canonical app origin resolution
  security/       Route-scoped rate limiting
  storage/        Supabase Storage helpers and upload policies
  workers/        In-app worker dispatch helpers
```

## Security boundaries

- Admin pages are protected by the dashboard layout and `requireUser()`.
- `POST /api/admin/uploads` requires an authenticated admin session.
- Community moderation routes under `/api/admin/*` require admin access.
- Worker routes require `Authorization: Bearer ${CRON_SECRET}`.
- File downloads always go through `GET /api/files/[assetId]`.
- Public file access is limited to assets attached to `PUBLISHED` posts.
- Analytics writes use a single write path, `POST /api/analytics`.
- Honeypot fields exist on subscription, contact, guestbook, and comment submission surfaces.
- Rate limiting is scoped by route namespace instead of a single global POST limiter.
- Production is fail-closed for email, storage, webhook, and canonical URL requirements.

## Runtime flow summary

### Content

1. Public list/detail pages fetch published post DTOs from `lib/data/posts.ts`.
2. Admin content operations go through `lib/actions/post.actions.ts`.
3. `createDraftPost()` creates a real `Post` row in `DRAFT` state before uploads.
4. TipTap JSON is the canonical content source; `htmlContent` is stored alongside it for rendering compatibility.
5. Link previews are normalized, fetched once, cached in `LinkPreviewCache`, and attached through `PostLink`.
6. Uploaded assets are indexed in `PostAsset`; file access is mediated through signed downloads.

### Community

1. Public comments and guestbook entries hit dedicated route handlers.
2. Honeypot and route-scoped rate limits run before DB writes.
3. Comment deletion uses a 4-digit PIN flow.
4. Admin moderation uses dedicated server actions and admin-only routes.

### Engagement

1. Subscription requests upsert `Subscriber` and newsletter-topic relations.
2. Confirmation and unsubscribe are token-based flows.
3. Contact submissions store `ContactMessage`, enqueue `WebhookDelivery`, and trigger the webhook worker.
4. Transactional email is sent through the `EmailProvider` abstraction.

### Analytics

1. Client tracking uses `sendBeacon` first and `fetch(... keepalive)` fallback.
2. `/api/analytics` is the only write path for raw events.
3. The admin dashboard aggregates directly from the raw analytics table.

### Newsletter

1. `createCampaign()` creates the campaign envelope and delivery fan-out only.
2. `startCampaign()` moves the campaign into `SENDING` and dispatches the worker.
3. The newsletter worker claims pending deliveries in `createdAt ASC, id ASC` order and sends up to 20 rows per run.
4. Retry reuses the same delivery row and returns it to `PENDING`.

## Active runtime conventions

- Brand label in the UI: `xistoh.log`
- Canonical public origin: `https://xistoh.com`
- Admin canonical IA:
  - list: `/admin/posts`
  - editor: `/admin/posts/[postId]`
- Legacy aliases:
  - `/admin/content`
    - creates a draft and redirects into the canonical editor route
  - `/admin/content/[postId]`

Previously suffixed duplicate files were removed from the repo during cleanup. The active runtime source of truth is the App Router tree plus the `components/v0/*` layer.
