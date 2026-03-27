# 00. System Overview

This document is the current top-level map of the product. It is the fastest way to understand what is live, how the pieces connect, and which docs to open next.

## Product identity

- Brand label: `xistoh.log`
- Canonical public URL: `https://xistoh.com`
- Deployment target: single DigitalOcean VM behind Nginx, HTTPS terminated at the proxy, Cloudflare DNS in front, Tailscale for private SSH access

## Runtime surfaces

### Public product surface

- `/`
  - v0 split-panel identity home
  - recent notes
  - inline compact subscription module
- `/contact`
  - split-panel terminal contact route
  - integrated guestbook composition
- `/notes`, `/notes/[slug]`
- `/projects`, `/projects/[slug]`
- `/guestbook`
- `/subscribe/confirm`
- `/unsubscribe`
- `/resume.pdf`
- SEO support routes:
  - `/sitemap.xml`
  - `/robots.txt`

### Protected admin surface

- `/admin/login`
- `/admin`
- `/admin/posts`
- `/admin/posts/[postId]`
- `/admin/content`
  - draft-creation entrypoint into `/admin/posts/[postId]`
- `/admin/content/[postId]`
  - legacy alias redirect to `/admin/posts/[postId]`
- `/admin/community`
- `/admin/analytics`
- `/admin/newsletter`
- `/admin/settings`
  - real Profile / CV editor

### API and worker surface

- Auth: `/api/auth/[...nextauth]`
- Uploads: `/api/admin/uploads`
- Signed file access: `/api/files/[assetId]`
- Analytics write path: `/api/analytics`
- Community APIs:
  - `/api/guestbook`
  - `/api/posts/[postId]/comments`
  - `/api/comments/[commentId]/delete`
  - `/api/posts/[postId]/like`
  - admin moderation routes under `/api/admin/comments/*` and `/api/admin/guestbook/*`
- Workers:
  - `/api/worker/webhook`
  - `/api/worker/newsletter`
  - `/api/worker/asset-cleanup`

## Major system areas

### Backend

- Prisma + PostgreSQL
- NextAuth credentials login
- Server Actions for admin and form mutations
- Route Handlers for uploads, analytics, downloads, auth, community, and workers
- Supabase Storage for assets
- Resend for outbound email

Key directories:

- `lib/actions`
- `lib/data`
- `lib/content`
- `lib/email`
- `lib/storage`
- `lib/newsletter`
- `lib/analytics`
- `lib/ops`
- `lib/workers`

### Frontend

- Next.js App Router pages in `app/`
- v0 public route components in `components/v0/public`
- shared post-P6 runtime in `components/v0/runtime/v0-experience-runtime.tsx`
- Admin CMS components in `components/admin`
- route-level metadata helpers in `lib/seo/metadata.ts`
- Public bound route components:
  - `components/v0/public/home-screen-bound.tsx`
  - `components/v0/public/notes-screen-bound.tsx`
  - `components/v0/public/projects-screen-bound.tsx`
  - `components/v0/public/detail-note-screen-bound.tsx`
  - `components/v0/public/detail-project-screen-bound.tsx`
  - `components/v0/public/guestbook-screen-bound.tsx`
- Analytics client tracker in `components/analytics-tracker.tsx`

### Integration layer

- Public UI -> Server Actions
  - subscription
  - contact
- Admin UI -> Server Actions
  - post draft/save/archive
  - newsletter create/start/test/retry
  - moderation actions
- Public UI -> Route Handlers
  - analytics
  - comments
  - likes
  - guestbook
- Admin UI -> Route Handlers
  - uploads
- Workers -> DB + external providers
  - webhook delivery
  - newsletter delivery
  - asset cleanup

### Operations

- Nginx reverse proxy
- HTTPS via certbot
- Cloudflare DNS and proxying
- Tailscale for SSH-only admin access
- systemd app service
- systemd timers for workers
- `pnpm ops:smoke` for post-deploy smoke validation
- design parity workflow in `.github/workflows/design-parity.yml`

## Active runtime vs legacy artifacts

The current runtime should be read from App Router routes and the canonical components listed in docs 01 to 04.
Previously excluded suffixed duplicates and legacy shell files were removed during P6 cleanup prep and should no longer be used as references.

## Current documentation map

- `docs/01_core_architecture.md`
  - route tree, runtime responsibilities, security boundaries
- `docs/02_database_schema.md`
  - Prisma models, migration set, data lifecycle notes
- `docs/03_server_actions_api.md`
  - mutation/actions/API/worker contracts and caller mapping
- `docs/04_frontend_ui_mapping.md`
  - pages, key components, active UI bindings
- `docs/05_operations_runbook.md`
  - env, deploy order, reverse proxy, workers, DigitalOcean/Cloudflare/Tailscale operations
- `docs/06_release_checklist.md`
  - rollout and sign-off checklist
