# Post-P6 Schema and Compatibility Plan

## Status

- Approved for execution
- Last updated: 2026-03-28
- Canonical schema and compatibility authority: this file

## Purpose

This document governs:
- database schema changes
- contract changes
- mixed old/new content compatibility
- migration order
- fallback rules
- removal sequencing

All schema-affecting implementation must conform to this file.

## Current repository truth

### Existing post schema

Current `Post` and `PostRevision` state in `prisma/schema.prisma`:
- `content: Json`
- `contentVersion: Int @default(1)`
- `htmlContent: String`
- `coverImageUrl`
- `assets: PostAsset[]`
- `links: PostLink[]`

Current contracts in `lib/contracts/posts.ts`:
- `PostDetailDTO` already exposes `htmlContent`, optional `content`, `links`, `assets`
- `PostEditorInput` currently carries `htmlContent`, `content`, `assets`, and `links`
- `markdownSource` now exists in schema and contracts and is the active writer input for the v0 Markdown-first editor path
- legacy non-v0 editor compatibility still exists while mixed old/new rollout remains active
- current routed v0 admin editing does not present a separate legacy-convert gate; legacy posts that are re-saved through the v0 route are normalized into the block writer path

### Existing asset and preview system

Current persisted systems already usable for the new model:
- `PostAsset`
- `PostLink`
- `LinkPreviewCache`

These systems are retained and enriched, not replaced.

### Existing profile truth

Structured profile schema in Prisma is now the active runtime truth for Home, contact, guestbook, admin settings, and resume output.
`lib/site/profile.ts` remains only as bootstrap and missing-table fallback truth.

## Target schema changes

### Post and post revision

Add `markdownSource` to:
- `Post`
- `PostRevision`

Target meaning:
- `markdownSource`: authoring input
- `content`: canonical normalized block document
- `htmlContent`: derived render output
- `contentVersion`: explicit version of the canonical block schema

Versioning rule:
- old content remains on the legacy content version
- new Markdown-first content writes the new block schema version

### Structured profile schema

Add:
- `Profile`
- `ProfileEducation`
- `ProfileExperience`
- `ProfileAward`
- `ProfileLink`

Required behavior:
- add/edit/delete support
- reorder support through `sortOrder`
- one live runtime profile source

Recommended fields:

`Profile`
- `id`
- `displayName`
- `role`
- `summary`
- `emailAddress`
- `resumeHref`
- `githubHref`
- `linkedinHref`
- `createdAt`
- `updatedAt`

`ProfileEducation`
- `id`
- `profileId`
- `institution`
- `degree`
- `period`
- `sortOrder`

`ProfileExperience`
- `id`
- `profileId`
- `title`
- `label`
- `detail`
- `period`
- `year`
- `sortOrder`

`ProfileAward`
- `id`
- `profileId`
- `title`
- `issuer`
- `detail`
- `year`
- `sortOrder`

`ProfileLink`
- `id`
- `profileId`
- `label`
- `url`
- `kind`
- `isVerified`
- `sortOrder`

## Canonical content model

Canonical block union:
- paragraph
- heading
- list
- quote
- code
- math
- image
- embed
- thematicBreak

Common rules:
- every block has a stable `id`
- image blocks reference persisted assets
- image blocks own caption text
- embed blocks reference normalized URL and provider-specific preview state

Provider-specific behavior:
- generic links render as terminal-style previews
- YouTube is preview-first and expands inline
- GitHub supports repo, issue, and PR preview types

## Compatibility rules

### Reader compatibility

Existing posts without `markdownSource` must still render through the current path until migrated.

Reader selection rule:
- if `markdownSource` exists and resolves to canonical block content, or `content` is already shaped like a canonical block document: use new block reader path
- otherwise: use current legacy render path

Rollout must support mixed old/new content during migration.
Forced big-bang content rewrite is forbidden.

### Writer compatibility

Writer rule:
- only the new Markdown-first editor writes `markdownSource`
- that editor normalizes Markdown into canonical block JSON
- derived HTML is written into `htmlContent`
- the v0 admin editor route now uses this writer path; compatibility fallback remains only for non-v0/default editor surfaces during rollout

Legacy writer rule:
- legacy content remains readable until its route/editor migration is complete
- old content can remain untouched until lazy migration or explicit migration rewrites it

### Profile compatibility

Profile rollout rule:
- DB profile is the target runtime truth
- if DB profile does not exist yet, a temporary bootstrap fallback may read from `lib/site/profile.ts`
- that fallback is bootstrap-only and must not remain the long-term runtime truth
- seed/bootstrap flows may re-sync nested profile rows from the static bootstrap source when explicitly reset or reseeded
- runtime ownership switched to DB during E7

### Link compatibility

Current `PostLink` and `LinkPreviewCache` remain the primary preview system.
Do not introduce a second link-preview or embed persistence subsystem.
Provider-specific issue/PR and YouTube-specialized metadata contracts are explicitly deferred beyond E2.
E2 only establishes compatibility-safe foundation fields and keeps generic or repo-level preview behavior intact.
During E6, block-authored detail routes may synthesize preview-backed inline link context from `LinkPreviewCache` for block embeds even when no explicit `PostLink` row exists yet.

## Migration order

1. Add schema and contracts
2. Keep read compatibility for both old and new content
3. Introduce the new writer
4. Expand the reader to prefer the new block path when present
5. Migrate old content lazily or with explicit migration tooling
6. Remove legacy fallback only after parity and compatibility are proven

Profile migration order:
1. add profile schema
2. bootstrap initial DB record from static profile truth
3. switch runtime readers to DB-backed profile
4. retire static fallback once verified

## No-removal-before-proof rule

Do not remove:
- legacy post reader path
- legacy content compatibility logic
- static profile bootstrap fallback

until:
- mixed old/new content has been validated
- the new reader is parity-approved
- the new editor is production-stable
- DB profile runtime truth is verified in Home, contact, guestbook, admin settings, and resume output

## Phase ownership

- E2 owns schema addition, contracts, and compatibility reads
- E5 owns new editor writing behavior
- E6 owns block-reader rollout and mixed-content validation
- E7 owns profile runtime migration

## Validation requirements

Schema and compatibility acceptance requires:
- old content still renders
- new content renders through the block pipeline
- mixed old/new content is supported simultaneously
- no forced migration is required for basic runtime safety
- `Jimin Park` is the canonical runtime/profile author name; route-level SEO author output is finalized in E8
- helper-level compatibility tests plus build/smoke validation are required in E2
- DB-backed reader/writer compatibility tests expand in E5, E6, and E7

## Risks

- block normalization drift from current reader output
- old content silently falling into the wrong reader path
- legacy revision counters accidentally masquerading as block-mode selectors
- legacy posts edited through the v0 routed editor may auto-upgrade into the block writer path without an explicit convert step
- profile bootstrap drift between DB and static fallback
- preview metadata not being rich enough for GitHub issue/PR and YouTube behavior
- removing fallback too early and breaking production reads

## Defaults

- `htmlContent` stays derived, not canonical
- `content` is the canonical block document
- `markdownSource` is optional at schema introduction and required only for the new writer path
- profile uses a single live source in the first release
