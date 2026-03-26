# 06. Release Checklist

Use this checklist for every production rollout.

## Pre-deploy

- Confirm the branch is the intended release SHA.
- Confirm `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
- Confirm `pnpm db:migrate:status` does not show local drift.
- Confirm `.env` is present with the production values.
- Confirm `APP_URL` and `NEXTAUTH_URL` are identical to the public canonical HTTPS origin.
- Confirm backup or snapshot is available for the current database state.
- Confirm `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set if seed must create the admin.
- Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set if upload or download flows are expected.
- Confirm `EMAIL_FROM` and `RESEND_API_KEY` are set for live email delivery.
- Confirm `OPS_WEBHOOK_URL` is set for live ops webhook delivery.
- Confirm the Resend sending domain is verified with SPF and DKIM, with DMARC configured if available.

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
- Open `/notes`
- Open `/projects`
- Open `/admin/login`
- Confirm `/admin/newsletter` redirects to login when unauthenticated
- Confirm `http -> https` and non-canonical host redirects to the canonical host.
- Submit a pageview to `/api/analytics`
- Run `POST /api/worker/webhook` with `CRON_SECRET`
- Run `POST /api/worker/asset-cleanup` with `CRON_SECRET`
- Run `POST /api/worker/newsletter` with `CRON_SECRET`
- Or run `pnpm ops:smoke` against the production `.env`
- Verify the latest admin draft and edit flow still loads
- Verify one published post detail renders assets and links
- Verify assets marked for deletion are absent from public detail rendering
- Treat both processed work and empty-queue no-op worker responses as success

## Manual product checks

- subscription request renders the verification state correctly
- `/subscribe/confirm` does not auto-confirm on GET
- `/unsubscribe` does not auto-unsubscribe on GET
- contact form queues successfully
- newsletter dashboard loads campaign and delivery tables
- file downloads for published posts redirect to a signed URL
- draft or archived files remain admin-only
- files marked with `pendingDeleteAt` return 404
- Gmail receives a `subscribe confirm` email successfully
- Gmail receives a `newsletter test send` email successfully
- Both Gmail messages use the canonical host in links and do not land with broken URLs

## Rollback triggers

Stop rollout and recover if any of these occur:

- `pnpm db:migrate:deploy` fails
- build succeeds but app boot fails on required env validation
- worker endpoints return 500 instead of empty-queue or success responses
- public published post pages error on load
- admin login is inaccessible

## Rollback path

1. restore the previous app release
2. if needed, restore the database backup or prepare a forward-fix migration
3. rerun `pnpm db:generate`
4. restart services
5. rerun the smoke checks
