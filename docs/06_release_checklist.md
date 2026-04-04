# 06. Release Checklist

Use this checklist for every production rollout.

## Pre-deploy

- confirm the intended release SHA
- confirm worktree is clean
- confirm:
  - `pnpm db:validate`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test`
  all pass on the release SHA
- confirm `pnpm db:migrate:status` shows the release DB is ready to receive the current repo migration set
- confirm production `.env` is present
- confirm:
  - `APP_URL=https://xistoh.com`
  - `NEXTAUTH_URL=https://xistoh.com`
- confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- confirm `EMAIL_DRIVER=resend`
- confirm `EMAIL_FROM` and `RESEND_API_KEY` are set
- confirm `OPS_WEBHOOK_URL` is real and not a placeholder host
- confirm backup or snapshot exists
- confirm current required migration `20260404190000_add_newsletter_h6_hardening` is part of the plan if still pending

## Deploy

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:validate
pnpm db:migrate:deploy
pnpm storage:bootstrap
pnpm build
pnpm db:seed               # only if bootstrap refresh is intended
pnpm db:backfill:post-links # only if legacy post-link backfill is still needed
```

Then restart the app service.

## Post-deploy route smoke

- open `/`
- open `/contact`
- open `/guestbook`
- open `/notes`
- open `/projects`
- open `/notes/rss.xml`
- open `/projects/rss.xml`
- open `/resume.pdf`
- open `/robots.txt`
- open `/sitemap.xml`
- open `/admin/login`
- confirm unauthenticated `/admin` redirects to login
- confirm authenticated `/admin/analytics` loads
- confirm `/knowledge` redirects to `/notes`

## Post-deploy product smoke

- Home shows:
  - recent notes
  - recent projects
  - recent visitor logs
- Contact shows guestbook preview only, not full archive duplication
- Guestbook is latest-first and paginates
- Notes and Projects support `q`, `tag`, and `page` query state
- Notes and Projects expose `[rss ->]`
- published note/project detail renders:
  - code
  - math
  - links
  - assets
  - likes
  - comments
- notes code copy feedback reads `yanked`
- `/resume.pdf` works both with uploaded override and with generated fallback

## Admin smoke

- `/admin/posts` loads list, filters, and pagination
- `/admin/posts/[postId]` reaches lower sections without scroll breakage
- save, publish, archive, and permanent delete show isolated pending state
- editor assets panel supports upload/insert/remove/cover selection
- `/admin/community` paginates comments and guestbook
- `/admin/newsletter` shows:
  - draft queue
  - subscriber view
  - preview view
  - topic targeting
  - selected-subscriber targeting
  - asset upload
  - attachment toggle
- `/admin/settings` saves profile changes and resume upload/remove works
- `/admin/analytics` shows:
  - readiness diagnostics
  - service log
  - performance diagnostics

## Email / worker smoke

- subscription request sends confirmation email
- successful confirmation sends welcome email
- unsubscribe sends unsubscribe notice
- newsletter test send works
- worker endpoints return success or empty-queue success, not unexpected 500s:
  - `/api/worker/webhook`
  - `/api/worker/newsletter`
  - `/api/worker/asset-cleanup`
- `pnpm ops:smoke` passes against the deployed environment

## SEO / canonical smoke

- query states on `/notes` and `/projects` are `noindex`
- `/notes` and `/projects` emit RSS autodiscovery
- detail routes emit article metadata / structured data
- admin routes stay `noindex`

## Rollback triggers

Stop rollout and recover if any of these occur:

- `pnpm db:migrate:deploy` fails
- required env validation fails at boot
- `/admin/login` or `/api/auth/[...nextauth]` fail after build
- worker routes return unexpected 500s
- `/resume.pdf` returns 500 instead of uploaded or generated output
- `/admin/analytics` loses service log or performance sections
- public notes/projects feeds fail

## Recovery notes

If the app boots into missing-route 500s after a successful build, force a clean rebuild:

```bash
rm -rf .next
pnpm build
```

Then restart and rerun smoke checks.
