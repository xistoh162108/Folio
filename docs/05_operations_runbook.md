# 05. Operations Runbook

This document is the production runbook for the current target deployment:

- single DigitalOcean VM
- Nginx reverse proxy
- HTTPS terminated at Nginx
- Cloudflare DNS and proxying
- Tailscale for private SSH access
- Supabase Postgres + Supabase Storage
- Resend for outbound email

Brand/UI label is `xistoh.log`. The canonical public URL is `https://xistoh.com`.

## 1. Required environment variables

### Required for boot

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `CRON_SECRET`

The app fails fast if any of these are missing or invalid.

### Required for production operations

- `APP_URL`
  - required in production
  - used for internal worker dispatch, email links, and canonical smoke URLs
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
  - used by `pnpm db:seed` to upsert the initial admin user
- `EMAIL_FROM`
- `RESEND_API_KEY`
  - required for live transactional and campaign delivery
- `OPS_WEBHOOK_URL`
  - required for live contact webhook delivery
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
  - required for upload, public asset URL generation, signed file downloads, and cleanup

### Canonical production values

- `APP_URL=https://xistoh.com`
- `NEXTAUTH_URL=https://xistoh.com`
- `EMAIL_FROM=hello@xistoh.com` or `no-reply@xistoh.com`

Do not point `APP_URL` or `NEXTAUTH_URL` at the brand label `xistoh.log`. The brand label is UI text only.

## 2. DigitalOcean directory layout

Recommended layout:

```text
/srv/xistoh-log/
  current/   git checkout and built app
  shared/    .env and shared operational files
```

Suggested workflow:

- git repo lives in `/srv/xistoh-log/current`
- production `.env` lives in `/srv/xistoh-log/shared/.env`

## 3. Canonical URL and reverse proxy rules

- canonical host: `xistoh.com`
- redirect `www.xistoh.com -> xistoh.com`
- redirect `http -> https`
- terminate TLS at Nginx, not inside Next.js
- preserve:
  - `Host`
  - `X-Forwarded-For`
  - `X-Forwarded-Proto`
  - `X-Forwarded-Host`
  - `X-Forwarded-Port`
  - upgrade headers
- do not expose the Next.js process directly to the internet

If `APP_URL` or `NEXTAUTH_URL` does not match the public canonical origin, auth callbacks, unsubscribe links, and worker self-dispatch can fail.

Sample Nginx config is provided at `ops/nginx/jimin-garden.conf`. Treat it as the template for the live `xistoh.com` host config.

## 4. Cloudflare DNS and HTTPS rollout

### DNS

Recommended DNS records:

- `A @ -> Reserved IP`
- `CNAME www -> xistoh.com`

During initial certificate issuance:

- set both records to `DNS only`
- issue the certificate
- switch back to `Proxied` after HTTPS is working

### SSL/TLS

Cloudflare settings:

- SSL mode: `Full (strict)`
- `Always Use HTTPS`: on
- `Automatic HTTPS Rewrites`: optional but recommended

### DNS troubleshooting

If external DNS works but the VM cannot resolve the domain, configure `systemd-resolved` explicitly, for example:

```ini
[Resolve]
DNS=1.1.1.1 1.0.0.1
FallbackDNS=8.8.8.8 8.8.4.4
Domains=~.
```

Then restart:

```bash
sudo systemctl restart systemd-resolved
```

## 5. Tailscale and SSH policy

Recommended SSH policy:

- web traffic stays public on `80` and `443`
- SSH is allowed only through Tailscale

Suggested steps:

1. Install Tailscale on the VM
2. Confirm Tailscale SSH or normal SSH over the Tailscale IP works
3. Keep `80` and `443` open publicly
4. Restrict `22` to `tailscale0` through UFW
5. Optionally remove public `22` in the DigitalOcean firewall

Do not use the Tailscale IP for `APP_URL` or `NEXTAUTH_URL`.

## 6. Deployment order

Use this order for every production release:

1. Back up the database
2. Pull the new release
3. `pnpm install --frozen-lockfile`
4. `pnpm db:generate`
5. `pnpm db:validate`
6. `pnpm build`
7. `pnpm db:migrate:deploy`
8. `pnpm db:seed`
9. `pnpm db:backfill:post-links`
10. restart the app service
11. run the smoke checks from `docs/06_release_checklist.md`

## 7. Migration and rollback policy

Migrations are forward-only. There is no automated down migration in this repo.

Before `pnpm db:migrate:deploy`:

- take a Supabase backup or snapshot
- record the currently deployed git SHA
- ensure the app build already passed locally or in CI

If a release fails after migrations are applied:

1. roll the app code back to the last known good release if the schema remains compatible
2. if the schema change itself is the problem, restore from backup or perform a forward fix with a new migration
3. re-run `pnpm db:generate`
4. restart the service after recovery

Do not perform manual table surgery on production unless restore or a forward-fix path is already chosen.

## 8. Seed and backfill

### Seed

```bash
pnpm db:seed
```

Effects:

- upserts default newsletter topics
- upserts the admin user when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set

It is safe to re-run.

### Post link backfill

```bash
pnpm db:backfill:post-links
```

Effects:

- reads legacy `githubUrl`, `demoUrl`, and `docsUrl`
- creates missing `PostLink` rows
- populates `LinkPreviewCache`

## 9. Workers and timers

Three worker routes must be schedulable with `Authorization: Bearer ${CRON_SECRET}`:

- `POST /api/worker/webhook`
- `POST /api/worker/asset-cleanup`
- `POST /api/worker/newsletter`

Recommended schedule:

- webhook worker: every 2 minutes
- asset cleanup worker: every 30 minutes
- newsletter worker: every 1 minute

Operational rules:

- configure an explicit timeout per worker trigger
- make the schedule interval longer than the maximum expected runtime
- prevent overlap with systemd + `flock` or another lock-based strategy
- treat both `processed work` and `empty queue no-op success` as healthy outcomes

Systemd examples are provided in `ops/systemd/`.

## 10. Storage and file access policy

- images are stored in `post-media` and served as public URLs
- files are stored in `post-files` and are never exposed directly
- downloads go through `GET /api/files/[assetId]`
- the route issues a 10-minute signed URL
- public users may access only files attached to `PUBLISHED` posts
- `DRAFT` and `ARCHIVED` file assets are admin-only
- assets marked with `pendingDeleteAt` are hidden from public rendering and download

## 11. Cleanup and retention rules

- empty unpublished drafts may be removed manually from the admin list
- drafts older than 30 days with no meaningful content have their assets marked for cleanup
- archived posts older than 90 days have their assets marked for cleanup
- asset cleanup is `mark -> worker delete`, not immediate hard delete during editing
- failed newsletter deliveries remain manual-retry items; there is no automatic resend loop in v1

## 12. Resend production checks

Before sign-off:

- verify the sending domain in Resend
- confirm SPF
- confirm DKIM
- configure DMARC when available
- send at least:
  - one transactional email: `subscribe confirm`
  - one campaign-like email: `newsletter test send`

Confirm both against Gmail:

- message arrives
- message is not obviously malformed
- links point at `https://xistoh.com/...`
- links are not broken

## 13. Recommended smoke checks after deploy

Preferred scripted smoke:

```bash
pnpm ops:smoke
```

Equivalent manual commands:

```bash
curl -i https://xistoh.com/admin/login
curl -i -X POST https://xistoh.com/api/analytics -H 'Content-Type: application/json' --data '{"eventType":"PAGEVIEW","sessionId":"smoke","path":"/"}'
curl -i -X POST https://xistoh.com/api/worker/webhook -H "Authorization: Bearer $CRON_SECRET"
curl -i -X POST https://xistoh.com/api/worker/asset-cleanup -H "Authorization: Bearer $CRON_SECRET"
curl -i -X POST https://xistoh.com/api/worker/newsletter -H "Authorization: Bearer $CRON_SECRET"
```

Then verify:

- public home renders
- admin redirects to login when unauthenticated
- analytics returns success
- all workers return 200 with either processed rows or empty-queue success
- `APP_URL` links in transactional emails point at the canonical HTTPS host
- Resend domain verification is complete
- Gmail receives one transactional email and one newsletter/test email without broken links
