# 05. Operations Runbook

This document is the production runbook for a single-server deployment behind a reverse proxy with Supabase Postgres and Supabase Storage.

## 1. Required and optional environment variables

### Required for boot

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `CRON_SECRET`

The app fails fast if any of these are missing or invalid.

### Required for production operations

- `APP_URL`
  - Required for production. Used for internal worker dispatch, email links, and canonical asset/test URLs.
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
  - Used by `pnpm db:seed` to upsert the initial admin user.
- `EMAIL_FROM`
- `RESEND_API_KEY`
  - Required for live transactional and campaign delivery through Resend.
- `OPS_WEBHOOK_URL`
  - Required for live contact webhook delivery in production.
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
  - Required for upload, public asset URL generation, and signed file downloads.

## 2. Canonical URL and proxy rules

- Set both `NEXTAUTH_URL` and `APP_URL` to the public HTTPS origin, for example `https://garden.example.com`.
- Redirect `http -> https` and `www -> non-www` or the reverse, but pick one canonical host and enforce it at the proxy.
- Terminate TLS at the reverse proxy, not inside Next.js.
- Preserve `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`, and upgrade headers.
- Preserve `X-Forwarded-Host` and `X-Forwarded-Port` as well.
- Do not expose the Next.js process directly to the internet.
- Worker self-dispatch uses `APP_URL` in production. A wrong origin breaks webhook or newsletter kickoffs and unsubscribe links.

Sample Nginx config is provided at `ops/nginx/jimin-garden.conf`.

## 3. Deployment order

Use this order for every production release:

1. Back up the database.
2. Pull the new release.
3. Install dependencies: `pnpm install --frozen-lockfile`
4. Generate Prisma client: `pnpm db:generate`
5. Validate schema: `pnpm db:validate`
6. Build: `pnpm build`
7. Apply migrations: `pnpm db:migrate:deploy`
8. Seed baseline data: `pnpm db:seed`
9. Run legacy link backfill: `pnpm db:backfill:post-links`
10. Restart the app service.
11. Run the smoke checks from `docs/06_release_checklist.md`.

## 4. Migration and rollback policy

Migrations are forward-only. There is no automated down migration in this repo.

Before `pnpm prisma migrate deploy`:

- take a Supabase backup or snapshot
- record the currently deployed git SHA
- ensure the app build already passed locally or in CI

If a release fails after migrations are applied:

1. Roll the app code back to the last known good release if the schema remains compatible.
2. If the schema change itself is the problem, restore from backup or perform a forward fix with a new migration.
3. Re-run `pnpm db:generate` and restart the service after recovery.

Do not attempt manual table surgery on production unless restore or a forward-fix plan is already chosen.

## 5. Seed and backfill

### Seed

Command:

```bash
pnpm db:seed
```

What it does:

- upserts the default newsletter topics
- upserts the admin user when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set

It is safe to re-run.

### Post link backfill

Command:

```bash
pnpm db:backfill:post-links
```

What it does:

- reads legacy `githubUrl`, `demoUrl`, and `docsUrl`
- creates `PostLink` rows when missing
- populates `LinkPreviewCache`

Run it after the link-preview migrations are deployed and before removing legacy read fallbacks.

## 6. Workers

Three worker routes must be schedulable with `Authorization: Bearer ${CRON_SECRET}`:

- `POST /api/worker/webhook`
- `POST /api/worker/asset-cleanup`
- `POST /api/worker/newsletter`

Recommended schedule:

- webhook worker: every 2 minutes
- asset cleanup worker: every 30 minutes
- newsletter worker: every 1 minute

The newsletter worker also self-dispatches if more queued deliveries remain, but the timer should still exist for crash recovery.

Operational rules:

- configure a timeout per worker trigger
- ensure the schedule interval is longer than the maximum expected runtime
- prevent overlapping runs with a systemd or lock-based strategy
- treat both `processed work` and `empty queue no-op success` as healthy outcomes

Systemd examples are provided in `ops/systemd/`.

Included units:

- `jimin-garden-webhook-worker.service` / `.timer`
- `jimin-garden-newsletter-worker.service` / `.timer`
- `jimin-garden-asset-cleanup-worker.service` / `.timer`

## 7. Upload and file access policy

- images are stored in bucket `post-media` and served as public URLs
- files are stored in bucket `post-files` and are never exposed directly
- downloads go through `GET /api/files/[assetId]`
- the route issues a 10-minute signed Supabase URL
- public users may download only files attached to `PUBLISHED` posts
- files attached to `DRAFT` or `ARCHIVED` posts are admin-only
- assets marked with `pendingDeleteAt` are hidden from public rendering and cannot be downloaded

## 8. Operational cleanup rules

- empty unpublished drafts may be deleted manually from the admin post list
- drafts older than 30 days with no meaningful content have their assets marked for cleanup
- archived posts older than 90 days have their assets marked for cleanup
- asset cleanup is `mark -> worker delete`, not immediate hard delete during editing
- failed newsletter deliveries remain manual-retry items; there is no automatic resend loop in v1

## 9. Recommended smoke checks after deploy

Preferred scripted smoke:

```bash
pnpm ops:smoke
```

Equivalent manual commands:

```bash
curl -i https://example.com/admin/login
curl -i -X POST https://example.com/api/analytics -H 'Content-Type: application/json' --data '{"eventType":"PAGEVIEW","sessionId":"smoke","path":"/"}'
curl -i -X POST https://example.com/api/worker/webhook -H "Authorization: Bearer $CRON_SECRET"
curl -i -X POST https://example.com/api/worker/asset-cleanup -H "Authorization: Bearer $CRON_SECRET"
curl -i -X POST https://example.com/api/worker/newsletter -H "Authorization: Bearer $CRON_SECRET"
```

Then verify:

- public home renders
- admin redirects to login when unauthenticated
- analytics returns success
- all workers return 200 with either processed rows or empty-queue success
- `APP_URL` links in transactional emails point at the canonical HTTPS host
- Resend domain verification is complete for SPF and DKIM, with DMARC recommended
- Gmail receives at least one transactional email and one newsletter/test email without broken links
