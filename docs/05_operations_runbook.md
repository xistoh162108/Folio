# 05. Operations Runbook

This is the current production runbook for `xistoh.log`.

Target deployment assumptions:

- single DigitalOcean VM
- Nginx reverse proxy
- HTTPS terminated at Nginx
- Cloudflare in front
- Tailscale for private SSH access
- Supabase Postgres + Supabase Storage
- Resend for outbound mail

## 1. Required environment variables

### Required to boot correctly

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_URL`
- `CRON_SECRET`

### Required for production operations

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `EMAIL_DRIVER`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `OPS_WEBHOOK_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Canonical production values

- `APP_URL=https://xistoh.com`
- `NEXTAUTH_URL=https://xistoh.com`
- canonical host is `xistoh.com`, not the UI brand label `xistoh.log`

### Operational validation rules

- `OPS_WEBHOOK_URL` must point to a real reachable endpoint
  - placeholder hosts such as `your-ops-endpoint.example` are not production-ready
- `EMAIL_DRIVER=test` is never valid in production
- `STORAGE_DRIVER=supabase` is required in production

## 2. Deployment directory layout

Recommended layout:

```text
/srv/xistoh-log/
  current/
  shared/
```

- git checkout in `/srv/xistoh-log/current`
- production `.env` in `/srv/xistoh-log/shared/.env`

## 3. Service naming and legacy file-name caveat

Live service naming should be treated as:

- app service: `xistoh-log.service`

Repo ops template filenames still use the older `jimin-garden*` naming under `ops/`. Treat them as templates, not as the final live service name authority.

## 4. Reverse proxy and canonical host rules

- redirect `www.xistoh.com` -> `xistoh.com`
- redirect `http` -> `https`
- preserve forwarded headers
- do not expose the Next.js process directly

If `APP_URL` or `NEXTAUTH_URL` drifts from the real canonical origin:

- auth callbacks break
- unsubscribe links break
- worker self-dispatch breaks
- email links become wrong

## 5. Cloudflare / TLS

Recommended Cloudflare settings:

- SSL mode: `Full (strict)`
- `Always Use HTTPS`: enabled

Initial certificate issuance is easiest when records are temporarily `DNS only`.

## 6. Tailscale / SSH policy

- keep public traffic on `80` and `443`
- keep SSH private through Tailscale
- do not use Tailscale IPs in `APP_URL` or `NEXTAUTH_URL`

## 7. Deployment order

Use this order for every release:

1. back up the database
2. pull the release
3. `pnpm install --frozen-lockfile`
4. `pnpm db:generate`
5. `pnpm db:validate`
6. `pnpm db:migrate:deploy`
7. `pnpm storage:bootstrap`
8. `pnpm build`
9. `pnpm db:seed`
   - safe when you intentionally want admin/topic/profile bootstrap refreshed
10. `pnpm db:backfill:post-links`
    - only if legacy post link fields still need backfill
11. restart the app service
12. run the release checklist in `docs/06_release_checklist.md`

## 8. Migration policy

Migrations are forward-only.

Before `pnpm db:migrate:deploy`:

- capture the current git SHA
- ensure build already passed
- take a DB backup or snapshot

Current required migration set includes:

- `20260404190000_add_newsletter_h6_hardening`

If that migration is still pending on the target DB, the deployment is not current.

## 9. Seed behavior

`pnpm db:seed` currently upserts:

- newsletter topics
- admin user if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
- the primary profile bootstrap record

That means seed is not a no-op content script. On an existing production profile, running seed will refresh the primary profile bootstrap content from repo defaults. Use it intentionally.

## 10. Workers and schedules

Worker routes:

- `POST /api/worker/webhook`
- `POST /api/worker/newsletter`
- `POST /api/worker/asset-cleanup`

Recommended intervals:

- webhook: every 2 minutes
- newsletter: every 1 minute
- asset cleanup: every 30 minutes

Operational rules:

- use `Authorization: Bearer ${CRON_SECRET}`
- use a lock strategy to avoid overlap
- treat both `processed work` and `empty queue no-op success` as healthy

## 11. Storage policy

Expected buckets:

- `post-media`
  - public
- `post-files`
  - private

Rules:

- images may be public URLs
- file downloads must pass through `/api/files/[assetId]`
- draft/archived files remain admin-only
- `pendingDeleteAt` assets are hidden from public rendering/download
- resume override uses the same Supabase storage boundary and should not 500 public `/resume.pdf` if storage lookup fails

## 12. Email policy

Production email depends on:

- verified Resend domain
- SPF
- DKIM
- `EMAIL_FROM`
- valid `APP_URL`

Current email lifecycle surfaces:

- subscribe confirm
- welcome
- unsubscribe
- newsletter campaign
- admin unsubscribe notice

## 13. Troubleshooting

### Build succeeds but `next start` serves 500s for routes that should exist

Observed failure mode:

- stale `.next` artifact set can leave server manifests pointing at route modules that are missing on disk

Recovery:

```bash
rm -rf .next
pnpm build
```

Then retry the service start.

### `/resume.pdf` should not 500 when storage is unavailable

- the route now fails open to the generated PDF
- if it still errors, treat it as a regression

### `/admin/analytics` should show both

- `--- SERVICE LOG ---`
- `--- PERFORMANCE DIAGNOSTICS ---`

If one is missing, treat analytics build/runtime state as degraded.

## 14. Current external readiness note

The last external verification against the provided target environment found two operational blockers:

- pending migration `20260404190000_add_newsletter_h6_hardening`
- `OPS_WEBHOOK_URL` still looked like a placeholder endpoint

Until both are resolved, the codebase may be production-ready while the deployment environment is not fully production-ready.
