# 01. Core Architecture

This project is a Next.js 15 App Router application that serves two surfaces:

- Public site: portfolio home, notes, projects, subscription, contact
- Admin site: authenticated content CMS, analytics dashboard, newsletter dashboard

The codebase intentionally keeps data access and mutating logic in `lib/`, but not every mutation is wrapped in a transaction. Transactions are used where they matter for multi-step consistency, such as draft creation, post revision snapshots, newsletter campaign creation, and contact plus webhook queue insertion.

## Route layout

```text
app/
  (dashboard)/admin/
    analytics/page.tsx
    content/page.tsx
    newsletter/page.tsx
    posts/page.tsx
    settings/page.tsx
    layout.tsx
  admin/login/page.tsx
  api/
    admin/uploads/route.ts
    analytics/route.ts
    auth/[...nextauth]/route.ts
    files/[assetId]/route.ts
    worker/
      newsletter/route.ts
      webhook/route.ts
  notes/[slug]/page.tsx
  notes/page.tsx
  projects/[slug]/page.tsx
  projects/page.tsx
  subscribe/confirm/page.tsx
  unsubscribe/page.tsx
  layout.tsx
  page.tsx
```

## Core backend areas

```text
lib/
  actions/        Server Actions for posts, subscribers, contact, newsletter
  auth.ts         NextAuth credentials config and requireUser()
  content/        Link preview fetch and URL normalization
  contracts/      Shared DTO and payload contracts
  data/           Read-side queries for posts, analytics, newsletter
  db/             Prisma client and DB error helpers
  email/          Transactional email provider adapter
  newsletter/     Newsletter selection and aggregate services
  storage/        Supabase Storage helpers and upload policies
  workers/        In-app worker dispatch helpers
```

## Security boundaries

- Admin routes are protected by the dashboard layout and `requireUser()`.
- `POST /api/admin/uploads` requires an authenticated admin session.
- Worker routes require `Authorization: Bearer ${CRON_SECRET}`.
- File downloads go through `GET /api/files/[assetId]`, which checks post status and user session before issuing a signed URL.
- Required runtime env validation happens in `lib/env.ts` for `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `CRON_SECRET`.

## Runtime flow summary

1. Public pages fetch published posts from Prisma-backed read functions in `lib/data/posts.ts`.
2. Admin CMS writes through Server Actions in `lib/actions/post.actions.ts`.
3. Uploads are stored in Supabase Storage and indexed in `PostAsset`.
4. External links are normalized, previewed once, cached in `LinkPreviewCache`, and associated to posts through `PostLink`.
5. Subscription and contact actions persist data first, then trigger in-app worker dispatch where appropriate.
6. Analytics writes only through `POST /api/analytics`; the admin dashboard reads aggregate queries from `lib/data/analytics.ts`.
7. Newsletter sends are split into campaign creation, campaign start, queued delivery processing, and aggregate refresh.
