# Post-P6 Schema and Compatibility Plan

## Status

- Approved for execution
- Last updated: 2026-03-29
- Canonical schema and compatibility authority: this file

## Purpose

This document governs:
- schema-affecting changes
- compatibility behavior during mixed old/new rollout
- writer and reader rules
- storage bootstrap/readiness requirements
- fallback removal sequencing

All schema-affecting implementation must conform to this file.

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
