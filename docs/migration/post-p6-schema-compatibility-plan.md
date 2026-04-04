# Post-P6 Schema and Compatibility Plan

## Status

- Approved for execution
- Last updated: 2026-04-04
- Canonical schema and compatibility authority: this file

## Purpose

This document governs:
- schema-affecting changes
- compatibility behavior during mixed old/new rollout
- writer and reader rules
- storage bootstrap/readiness requirements
- fallback removal sequencing

All schema-affecting implementation must conform to this file.

## 2026-04 compatibility addendum (H0-H8)

This addendum records the load-bearing compatibility and route-contract changes introduced during the first hardening pass.

### No Prisma schema change in H0-H5

The following hardening work shipped without a Prisma migration:

- Light default theme
- brand-link route ownership
- Home-only Instagram exposure
- Home composition expansion
- Notes/Projects search/tag/pagination
- Notes/Projects RSS
- guestbook/comments/community pagination
- permanent post delete workflow
- action-state isolation in the editor shell
- math and code renderer alignment
- unified `[assets]` and cover-selection workflow in the v0 editor
- profile Experience editor/runtime alignment
- resume upload override and `/resume.pdf` fallback switching

### H6 newsletter schema and contract change

H6 is the first hardening phase that introduces a Prisma migration.

Added schema elements:

- `NewsletterRecipientMode`
  - `TOPICS`
  - `SELECTED_SUBSCRIBERS`
- `NewsletterAssetKind`
  - `IMAGE`
  - `FILE`
- `NewsletterCampaign.markdown`
- `NewsletterCampaign.recipientMode`
- `NewsletterCampaign.targetSubscriberIds`
- `NewsletterCampaign.skipPreviouslySent`
- `NewsletterCampaign.queueOrder`
- `NewsletterAsset`

Compatibility rules:

- old campaigns remain readable because:
  - `markdown` is nullable
  - new targeting fields have defaults
  - `queueOrder` is backfilled in migration order
- the newsletter runtime now treats the new canonical audience taxonomy as:
  - `all`
  - `project-info`
  - `log`
- older stored topic names remain readable through alias normalization:
  - `all-seeds -> all`
  - `ai-infosec -> project-info`
  - `projects-logs -> project-info`
- no subscriber-table fork or second campaign model is introduced
- newsletter attachments remain derived from existing Supabase bucket ownership rather than a new storage subsystem

### Contract changes introduced in H2-H3

New load-bearing contracts:

- `PaginatedCollectionStateDTO`
- `PaginatedPostCommentsDTO`
- `PaginatedGuestbookEntriesDTO`
- `PostDetailDTO.commentsPagination`

These are compatibility-safe because:

- no persisted column changed
- server routes/data loaders now expose pagination state explicitly
- old rows remain readable without backfill

### Public list query compatibility

Notes and Projects now accept query input shaped as:

- `q`
- `tag`
- `page`

Rules:

- this is a route/query contract change, not a schema change
- `Post.excerpt` remains the single project short-description source
- empty `excerpt` means no public short-description line; fake prose is forbidden

### Feed compatibility

RSS adds:

- `/notes/rss.xml`
- `/projects/rss.xml`

This is a route/output contract only.
No content-schema fork is introduced.
Feeds are derived from the existing published `Post` shape:

- title
- canonical URL
- excerpt when present
- published/updated timestamp
- tags as categories

### Community pagination compatibility

Public/community pagination now uses explicit read contracts:

- `/api/posts/[postId]/comments?page=&pageSize=`
- `/api/guestbook?page=&pageSize=`

Compatibility rules:

- write endpoints remain on the same routes
- first-page detail reads still come from the server detail loader
- older pages are additive and do not change comment/guestbook row structure

### Editor / renderer compatibility introduced in H4

H4 keeps the existing persisted models and changes compatibility behavior instead:

- `PostAsset` remains the single uploaded-asset source
- `coverImageUrl` remains the single persisted cover-image pointer
- permanent delete uses the existing `Post` graph plus storage cleanup; no delete-shadow model is introduced
- canonical derived HTML now emits code blocks with both:
  - `class="language-*"`
  - `data-language="*"`
- inline and block math now derive through KaTeX-backed HTML helpers instead of escaped plain-text placeholders

Compatibility rules:

- reader selection remains `markdownSource || canonical block shape`
- old rows remain readable
- newly saved Markdown-first content now yields aligned editor/published render output without requiring a schema backfill

### Profile / resume compatibility introduced in H5

H5 keeps the existing Prisma profile schema and narrows the active runtime/editor contract instead:

- `ProfileExperience.title`
- `ProfileExperience.detail`
- `ProfileExperience.year`

remain persisted for compatibility, but the active runtime/editor model now uses:

- `label`
- `period`

Rules:

- public profile rendering uses `label` and `period`
- admin settings edits only `label` and `period`
- saves still backfill existing required DB columns by mirroring `label` into `title`, clearing `detail`, and storing `year` as `null`
- this preserves schema compatibility while making the editor match the actual public rendering

Resume rules:

- public route remains `/resume.pdf`
- uploaded override is stored in private file storage at a deterministic profile-owned path
- when no uploaded override exists, the generated PDF fallback remains active
- no second public resume route or new DB field is introduced

### Resume fallback hardening after H5 audit

The generated `/resume.pdf` fallback now uses a Unicode-safe PDF text path and the uploaded override replacement path now overwrites deterministically instead of delete-then-upload replacement.

Compatibility rules:

- non-ASCII profile data remains readable in generated fallback output
- replacing an uploaded resume override does not create a temporary “no file” gap
- public route ownership remains unchanged at `/resume.pdf`

### Newsletter lifecycle compatibility introduced in H6

H6 keeps the existing subscriber/campaign/delivery models and extends them rather than replacing them.

Load-bearing H6 behavior:

- subscription request input now serializes public checkbox state into canonical topic names
- already-confirmed subscription requests return a subscribed success state instead of an error state
- confirmation now triggers a welcome email after the subscriber state is finalized
- unsubscribe confirmation remains on the existing route and now shares the common exact-v0 email frame
- `/admin/newsletter` remains the only admin newsletter surface and now owns:
  - queue editing
  - recipient-mode selection
  - selected-recipient targeting
  - send-unsent-only reruns
  - image/file asset upload
  - file attachments
  - paginated deliveries/campaigns/subscribers

Compatibility rules:

- worker processing still operates on `NewsletterDelivery`
- attachment sends are additive and campaign-safe; they do not fork delivery records into a second send model
- newsletter body remains Markdown-first and derives:
  - `markdown`
  - `html`
  - `text`
  from one compose pipeline
- existing public subscribe routes remain:
  - `/subscribe/confirm`
  - `/unsubscribe`

### Analytics / admin diagnostics compatibility introduced in H7

H7 ships without a Prisma migration.

Load-bearing H7 behavior:

- admin analytics now projects a service log from existing persisted records:
  - `AuditLog`
  - `WebhookDelivery`
  - `NewsletterCampaign`
  - `NewsletterDelivery`
- admin performance diagnostics now expose per-surface measurements for:
  - session lookup
  - posts index
  - post editor state
  - settings editor state
  - newsletter dashboard state
  - community moderation state

Compatibility rules:

- H7 does not create a new operations table
- service-log rows are a read-model projection only
- existing admin routes keep their current route ownership and simply expose more diagnostics
- scroll containment changes are structural wrapper changes only and do not fork route contracts

### Final QA hardening closure introduced in H8

H8 ships without a Prisma migration.

Load-bearing H8 behavior:

- resume override reads now fail open:
  - storage read failure while resolving `/resume.pdf` yields generated fallback output
  - storage read failure while resolving resume editor state yields `generated` resume state
- resume override writes remain unchanged and fail closed through the existing admin route/action path

Compatibility rules:

- H8 does not add a new resume table, field, or route
- public contract for `/resume.pdf` remains stable while becoming more resilient to storage-read defects
- storage readiness remains observable through analytics/admin operations rather than leaking as a public resume-route failure

## 2026-04 targeted production patch compatibility addendum (T1)

`T1` ships without a Prisma migration.

Load-bearing compatibility behavior:

- `Post.excerpt` remains the single canonical project summary field for both project lists and project detail pages
- the exact-v0 editor now binds the existing `excerpt` field directly instead of relying on fallback prose at read time
- empty `excerpt` remains a first-class state and now means:
  - no summary line in project detail
  - no summary block in project list
  - no fixture or placeholder description injection
- `coverImageUrl` remains the single persisted share/preview image pointer
- user-facing copy may say `share image` or `preview image`, but the stored field stays `coverImageUrl`
- the single editor assets workflow remains the only asset-management surface; no second asset-manager subsystem is introduced
- safe file upload support is explicitly allowlisted to:
  - `application/pdf`
  - `text/plain`
  - `text/markdown`
  - `text/csv`
  - `application/json`
  - `text/yaml`
  - `application/xml`
  - `text/xml`
  with matching extension fallback handling for:
  - `.txt`
  - `.md`
  - `.csv`
  - `.json`
  - `.yml`
  - `.yaml`
  - `.xml`
  - `.log`
  - `.pdf`
- public comment rendering no longer accepts a public admin-moderation contract
- webhook worker dispatch now resolves the authoritative `CONTACT_SUBMIT` destination from the current validated env target
- stale stored destination values remain readable for diagnostics/audit but are not authoritative for dispatch
- outbound webhook failures now store classified runtime diagnostics instead of an undifferentiated `fetch failed`
- email sender identity normalization happens at provider level and does not change the underlying configured sender address

Compatibility rules:

- old posts remain readable because the summary source is still `excerpt`
- no backfill is required for posts with empty `excerpt`; they now simply render without a summary
- older stored `WebhookDelivery.destination` values remain visible in service logs and diagnostics, but worker dispatch must prefer the current env target
- sender normalization is output-only and requires no DB change

## Current repository truth

### Existing post/content state

In `prisma/schema.prisma`:
- `Post.content: Json`
- `Post.contentVersion: Int`
- `Post.htmlContent: String`
- `Post.markdownSource: String?`
- `PostRevision.markdownSource: String?`

In current runtime/contracts:
- Markdown-first writer support already exists
- canonical block content already exists
- `htmlContent` is still stored
- legacy content still exists in production-compatible shapes
- the writer now inserts `asset://` image/file tokens at the cursor for uploaded assets
- removal of an uploaded asset now strips matching `asset://` body references before recomputing derived content

### Existing asset and preview state

Current persisted systems already in use:
- `PostAsset`
- `PostLink`
- `LinkPreviewCache`

These systems are retained and enriched, not replaced.

### Existing profile state

Structured profile tables already exist in Prisma and are intended as the runtime truth.
`lib/site/profile.ts` may remain only as bootstrap-only fallback.

### Existing storage state

Upload policy currently targets:
- `post-media`
- `post-files`

There is now a canonical bootstrap/readiness path for these buckets:
- `pnpm storage:bootstrap`
- `inspectStorageBootstrapState()` in `lib/storage/supabase.ts`
- `/admin/analytics` readiness cards built from that same snapshot authority

## Compatibility rules

### Reader selection rule

During rollout, the safe selector remains:
- if `markdownSource` is present: use the new block reader
- else if `content` is already shaped like a canonical block document: use the new block reader
- otherwise: use the legacy reader

`contentVersion >= newVersion` is **not** trusted as a standalone selector until legacy backfill explicitly normalizes old rows.

### Writer rule

The v0 editor writes:
- Markdown authoring input
- canonical normalized block JSON into `content`
- derived render output into `htmlContent`

Legacy content may remain untouched until explicitly rewritten or lazily migrated.
No big-bang rewrite is allowed.

### Mixed rollout rule

Rollout must support:
- old posts without `markdownSource`
- new posts with `markdownSource`
- mixed old/new content in the same runtime

Forced whole-database migration before safe reading is forbidden.

## Canonical content model

Canonical block set:
- paragraph
- heading
- list
- quote
- code
- math
- image
- embed
- thematic break

Rules:
- block ids remain stable
- image blocks own captions
- image blocks reference persisted assets
- embed blocks reference normalized URLs and provider-specific preview context

## Inline media and embed normalization

### Markdown conventions

- image: `![alt](asset://<assetId> "caption")`
- file: `[label](asset://<assetId>)`
- embed: bare URL on its own line

### Normalization rules

- `asset://<assetId>` in image syntax becomes an image block
- Markdown image title string becomes the normalized block caption
- `asset://<assetId>` in link syntax becomes a file/link block reference through existing asset ownership
- bare-line URLs become embed blocks
- inline Markdown links remain inline text links, not body-level embed blocks

## Preview metadata enrichment

`LinkPreviewCache.metadata` remains the only preview metadata store.
Do not create a second preview table.

Target enriched preview subtypes:
- GitHub repo
- GitHub issue
- GitHub PR
- YouTube

Current implementation note:
- GitHub metadata is the explicit persisted subtype contract for repo / issue / PR previews.
- YouTube metadata is now also persisted as a typed contract with `kind: "YOUTUBE"` and `videoId` when enrichment succeeds.
- Older cached YouTube previews remain compatible through the normalized URL/disclosure fallback path until those cache rows are refreshed.

Fallback rule:
- unresolved preview metadata must degrade to a terminal-native generic link block
- widget/card fallback is forbidden

## Storage bootstrap and readiness rule

Bucket names remain:
- `post-media`
- `post-files`

Introduce `pnpm storage:bootstrap` with the following behavior:
- verify Supabase credentials
- create `post-media` if missing
- create `post-files` if missing
- validate public/private visibility expectations
- re-apply canonical MIME/size policy to existing buckets
- run idempotently

Readiness diagnostics must be able to report:
- env presence
- bucket existence
- bucket visibility

`Bucket Not Found` is treated as an infrastructure/bootstrap failure, not a UI/editor failure.

## Profile truth and fallback rule

- DB-backed profile data is the runtime source of truth
- static profile fallback may exist only for bootstrap-only paths
- static runtime truth must not remain the long-term owner
- static profile fallback is no longer used in active runtime after `R7` acceptance, except explicitly documented bootstrap paths

## Migration order

1. storage bootstrap/readiness foundation
2. preserve compatibility-safe reader rules
3. writer improvements
4. reader enrichment
5. optional legacy backfill
6. final fallback retirement

## No-removal-before-proof rule

Do not remove:
- legacy reader compatibility
- compatibility-safe mixed old/new handling
- bootstrap-only static profile fallback

until:
- mixed content has been validated
- inline media/embed writer is production-stable
- enriched reader behavior is validated
- DB-backed profile runtime truth is verified

## Validation requirements

Acceptance requires:
- old content still renders safely
- new content renders through the block pipeline
- mixed old/new content is supported simultaneously
- no forced migration is required for runtime safety
- storage bootstrap/readiness behavior is documented before upload rollout
- `Jimin Park` remains the canonical runtime/profile author name

## Defaults

- `htmlContent` remains derived output
- `markdownSource` remains the active writer input
- `contentVersion` remains non-authoritative until legacy backfill proves otherwise
