# 06. Release Checklist

Use this checklist for every production rollout.

## Pre-deploy

- Confirm the branch is the intended release SHA.
- Confirm `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
- Confirm `pnpm db:migrate:status` does not show local drift.
- Confirm production `.env` is present.
- Confirm:
  - `APP_URL=https://xistoh.com`
  - `NEXTAUTH_URL=https://xistoh.com`
- Confirm backup or snapshot exists for the current database state.
- Confirm `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set if seed must create the admin.
- Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
- Confirm `EMAIL_FROM` and `RESEND_API_KEY` are set.
- Confirm `OPS_WEBHOOK_URL` is set.
- Confirm the Resend sending domain is verified with SPF and DKIM, with DMARC configured if available.
- Confirm Cloudflare DNS points `xistoh.com` at the correct Reserved IP.
- Confirm `www.xistoh.com` redirects to `xistoh.com` in the proxy config.

## Deploy

- `pnpm install --frozen-lockfile`
- `pnpm db:generate`
- `pnpm db:validate`
- `pnpm build`
- `pnpm db:migrate:deploy`
- `pnpm db:seed`
- `pnpm db:backfill:post-links`
- restart the app service

## Post-deploy smoke

- Open `/`
- Confirm `/knowledge` permanently redirects to `/notes`
- Open `/robots.txt`
- Open `/sitemap.xml`
- Open `/contact`
- Open `/notes`
- Open `/projects`
- Open `/guestbook`
- Open `/admin/login`
- Confirm `/admin/newsletter` redirects to login when unauthenticated
- Confirm `http -> https` and `www -> non-www` redirect to the canonical host
- Submit a pageview to `/api/analytics`
- Run `POST /api/worker/webhook` with `CRON_SECRET`
- Run `POST /api/worker/asset-cleanup` with `CRON_SECRET`
- Run `POST /api/worker/newsletter` with `CRON_SECRET`
- Or run `pnpm ops:smoke` against the production `.env`
- Verify the admin draft and edit flow loads through `/admin/posts`
- Verify one published post detail renders assets, links, likes, and comments
- Verify assets marked for deletion are absent from public detail rendering
- Verify public routes emit the expected canonical/title/OG/Twitter metadata
- Verify note/project detail routes emit article metadata and JSON-LD
- Treat both processed work and empty-queue no-op worker responses as success

## Manual product checks

- subscription request renders the verification state correctly
- `/subscribe/confirm` does not auto-confirm on GET
- `/unsubscribe` does not auto-unsubscribe on GET
- contact form queues successfully
- guestbook entry creation works
- comment create and PIN delete work
- newsletter dashboard loads campaign and delivery tables
- file downloads for published posts redirect to a signed URL
- draft or archived files remain admin-only
- files marked with `pendingDeleteAt` return 404
- `/admin/settings` loads the Profile / CV editor and saves live profile changes
- `/admin/analytics` renders readiness diagnostics with real status/detail values
- Home, `/contact`, `/guestbook`, and `/resume.pdf` reflect the current profile runtime source
- Gmail receives a `subscribe confirm` email successfully
- Gmail receives a `newsletter test send` email successfully
- Both Gmail messages use the canonical host in links and do not land with broken URLs

## Worker and scheduler checks

- `xistoh-log.service` is running
- webhook worker timer is enabled
- newsletter worker timer is enabled
- asset cleanup worker timer is enabled
- each worker can return either processed work or empty-queue success
- overlapping worker runs are prevented by the chosen locking strategy

## Rollback triggers

Stop rollout and recover if any of these occur:

- `pnpm db:migrate:deploy` fails
- build succeeds but app boot fails on required env validation
- worker endpoints return 500 instead of empty-queue or success responses
- public published post pages error on load
- admin login is inaccessible
- canonical domain or HTTPS redirect rules are broken

## Rollback path

1. restore the previous app release
2. if needed, restore the database backup or prepare a forward-fix migration
3. rerun `pnpm db:generate`
4. restart services
5. rerun the smoke checks
