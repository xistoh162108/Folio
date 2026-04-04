# 00. System Overview

This is the fastest current-state map of `xistoh.log`.

- Canonical public origin: `https://xistoh.com`
- Brand label in UI: `xistoh.log`
- Canonical home route: `/`
- Design authority: `v0app/` atmosphere and the accepted post-P6 hardening line in `docs/migration/post-p6-*.md`
- Current implementation line: `R1-R9` baseline plus accepted `H0-H8`

## Runtime surfaces

### Public product surface

- `/`
  - exact-v0 split-panel home
  - DB-backed profile runtime
  - recent notes: max 5
  - recent projects: max 2
  - recent visitor logs: max 2
  - Home-only Instagram exposure when verified
- `/contact`
  - contact form
  - lightweight guestbook preview / jump
  - GitHub + LinkedIn + email only
- `/guestbook`
  - standalone canonical guestbook archive
  - latest-first terminal log rows
  - pagination
- `/notes`
  - search, tag filter, pagination
  - inline RSS affordance
- `/notes/[slug]`
  - published note detail
  - likes, paginated comments, assets, links, rendered code/math
- `/notes/rss.xml`
- `/projects`
  - search, tag filter, pagination
  - project views
  - project short description from `Post.excerpt` only
  - inline RSS affordance
- `/projects/[slug]`
  - published project detail
  - likes, comments, assets, links, rendered code/math
- `/projects/rss.xml`
- `/subscribe/confirm`
  - explicit subscription lifecycle result states
- `/unsubscribe`
  - explicit unsubscribe lifecycle result states
- `/resume.pdf`
  - uploaded resume override first
  - generated PDF fallback second
- SEO/support routes
  - `/robots.txt`
  - `/sitemap.xml`

### Protected admin surface

- `/admin/login`
- `/admin`
  - authenticated admin landing
- `/admin/posts`
  - canonical content list
  - filters, pagination, draft creation
- `/admin/posts/[postId]`
  - canonical Markdown-first editor
  - save/publish/archive/permanent delete
  - unified assets panel
- `/admin/content`
  - legacy alias that creates a draft then redirects to `/admin/posts/[postId]`
- `/admin/content/[postId]`
  - legacy redirect alias
- `/admin/community`
  - comments + guestbook moderation
  - pagination
- `/admin/newsletter`
  - draft queue
  - targeted send
  - subscriber management
  - newsletter assets / attachments
- `/admin/settings`
  - DB-backed profile / CV editor
  - resume upload management
- `/admin/analytics`
  - product metrics
  - readiness diagnostics
  - service log
  - admin performance diagnostics

### API, worker, and feed surface

- auth
  - `/api/auth/[...nextauth]`
- uploads and downloads
  - `/api/admin/uploads`
  - `/api/admin/newsletter/uploads`
  - `/api/admin/profile/resume`
  - `/api/files/[assetId]`
- public engagement APIs
  - `/api/analytics`
  - `/api/guestbook`
  - `/api/posts/[postId]/comments`
  - `/api/comments/[commentId]/delete`
  - `/api/posts/[postId]/like`
- admin moderation APIs
  - `/api/admin/comments/[commentId]`
  - `/api/admin/guestbook/[entryId]`
- workers
  - `/api/worker/webhook`
  - `/api/worker/newsletter`
  - `/api/worker/asset-cleanup`
- test helper
  - `/api/test-storage`

## Major system areas

### Public runtime

- `components/v0/public`
  - public shells, route screens, list/detail renderers, subscription surfaces
- `components/v0/runtime`
  - shared Jitter runtime and route-owned visual identity
- `lib/site`
  - theme, route palette, static profile constants
- `lib/seo`
  - metadata, feed autodiscovery, structured data

### Admin runtime

- `components/v0/admin`
  - admin shells and dashboard screens
- `components/admin`
  - editor adapters and authoring primitives
- `lib/ops`
  - readiness and admin performance dashboards

### Backend / data / integration

- `lib/actions`
  - authenticated or form-bound write paths
- `lib/data`
  - read-side queries and DTO shaping
- `lib/contracts`
  - DTO / input / result / query contracts
- `lib/content`
  - markdown block shaping, code rendering, math rendering
- `lib/email`
  - provider abstraction and templates
- `lib/newsletter`
  - topic normalization, recipient selection, compose helpers
- `lib/profile`
  - bootstrap/runtime mapping and resume override helpers
- `lib/storage`
  - Supabase storage boundary
- `lib/workers`
  - internal worker dispatch helpers
- `prisma`
  - schema, migrations, seed, backfills

## Current product rules that shape the runtime

- Light is the default first-load theme.
- The top `xistoh.log` brand mark resolves to `/`.
- Public/admin switch UI is removed.
- `/guestbook` is canonical and `/contact` remains a lighter preview/jump surface.
- Jitter palette is route-owned and not screen-local.
- Notes and Projects each have their own RSS feed.
- Newsletter segmentation is:
  - `All`
  - `Project & Info`
  - `Log`
- Instagram is public on Home only when verified/configured.

## Current documentation map

### Canonical current-state docs

- `docs/README.md`
- `docs/00_system_overview.md`
- `docs/01_core_architecture.md`
- `docs/02_database_schema.md`
- `docs/03_server_actions_api.md`
- `docs/04_frontend_ui_mapping.md`
- `docs/05_operations_runbook.md`
- `docs/06_release_checklist.md`
- `docs/07_naming_and_change_governance.md`
- `docs/08_feature_inventory.md`
- `docs/09_change_history.md`

### Active governance docs

- `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- `docs/migration/post-p6-schema-compatibility-plan.md`
- `docs/migration/post-p6-route-ownership-plan.md`
- `docs/migration/post-p6-phase-tracker.md`
- `docs/migration/post-p6-audit-log.md`

### Historical reference docs

- `DEVELOPMENT_LOG.md`
- `docs/migration/v0-fidelity-production-migration-spec.md`
- `docs/migration/v0-phase-tracker.md`
- `docs/migration/v0-audit-log.md`

Historical docs are still useful for lineage and design provenance, but they are not the current behavior contract.
