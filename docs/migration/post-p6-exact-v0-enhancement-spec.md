# Post-P6 Exact-v0 Enhancement Spec

## Status

- Approved for execution
- Last updated: 2026-03-29
- Canonical enhancement authority: this file

## Authority and execution rule

This document is the top-level source of truth for the post-P6 exact-v0 enhancement phase.

Implementation, review, and cutover decisions must conform to this file and its supporting authorities:
- `docs/migration/post-p6-schema-compatibility-plan.md`
- `docs/migration/post-p6-route-ownership-plan.md`
- `docs/migration/post-p6-phase-tracker.md`
- `docs/migration/post-p6-audit-log.md`

No phase is complete unless:
- the relevant `R*` entry is updated in the tracker
- the relevant `R*` entry is updated in the audit log
- any minimal extension beyond literal `/v0app` is explicitly justified in the audit log

Silent divergence is forbidden.

## Non-negotiable rule

The most important requirement is preserving the original v0 design philosophy.

Do not:
- redesign
- reinterpret
- modernize
- soften
- replace the terminal-cinematic identity with generic product UI
- introduce a second design language

Preserve:
- design philosophy
- CI
- visual grammar
- density
- motion character
- typography rhythm
- terminal structure
- Jitter identity
- overall vibe

All new functionality must be absorbed into the same v0 world.

If production requires behavior that does not exist literally in `/v0app`, the addition is allowed only when the implementation records:
- what is missing from literal `/v0app`
- why production requires it
- why the addition is necessary
- why the addition is minimal
- how it inherits v0 philosophy and CI

## Current repository truth

### Runtime and shell geometry

- `app/layout.tsx` is the metadata/theme root.
- `components/v0/runtime/v0-experience-runtime.tsx` already exists and owns the current shared runtime provider.
- Public and admin shells now register a right-panel slot and a measured fallback frame into the shared runtime.
- The runtime now uses slot registration plus portal ownership as the primary host model, with a measured fixed-frame fallback only during shell handoff gaps.
- `components/v0/public/public-shell.tsx`, `components/v0/admin/admin-shell.tsx`, and `components/v0/admin/login-screen.tsx` now use `100svh` shell height instead of the old `h-screen` body split.
- `R3` now adapts shell ownership by viewport:
  - desktop-wide keeps the exact split identity
  - tablet uses a tighter 56/44 content-to-Jitter split
  - mobile uses a stacked shell with a condensed Jitter band
- admin mobile now uses a horizontal command strip rather than a collapsed sidebar or drawer.

### Jitter and transition behavior

- A shared runtime exists and now keeps one persistent Jitter viewport alive through slot registration.
- Current continuity now interpolates dither parameters and preserves route-to-route right-panel ownership instead of hard switching descriptors with blank gaps.
- Life continuity is no longer keyed to pathname-level route changes, so `/contact` and its guestbook variant keep the same engine context instead of reseeding just because the route changed.
- Discrete dither families now stay inside one shared runtime-owned field and avoid shell-level blanking, but exact field-to-field interpolation between every dither family remains an audited follow-up rather than a closed claim.
- Life Game grid overlays have been removed; the field now renders cleanly inside the same v0 atmosphere.
- Admin already shares the same right-side runtime surface as public routes.
- Broader left-panel text choreography and full responsive ownership remain later-phase work.

### Guestbook and contact

- `/guestbook` is now a standalone canonical public route again.
- `/contact` now keeps only a compact guestbook preview/jump.
- `/contact` no longer depends on route-local viewport height math for centering; shell-owned geometry now determines the usable region.
- Public guestbook rows now render in linear terminal log language without public moderation controls.
- `R4` closes the product split while keeping `/contact` and `/guestbook` inside the same shared runtime and design world.

### Editor and content

- The v0 editor path is already Markdown-first through `components/admin/post-editor.tsx`.
- `markdownSource` already exists in schema/contracts and is already used by the v0 writer path.
- Canonical block content already exists.
- `htmlContent` remains persisted render output.
- Inline image/file uploads now insert terminal-native `asset://` Markdown tokens at the cursor and feed the canonical block writer path.
- Bare-line URL embeds remain normalized through the same Markdown-first writer path.
- Removing an uploaded asset now strips matching `asset://` body references and immediately recomputes derived block/html payloads.
- Image upload no longer silently overwrites the explicit cover-image field.
- Editor scroll/layout containment now keeps the shell-owned primary column as the single scroll owner for `/admin/posts/[postId]`.

### Storage

- Upload policies in `lib/storage/supabase.ts` target hard-coded buckets:
  - `post-media`
  - `post-files`
- `pnpm storage:bootstrap` now exists as the canonical bootstrap command and loads `.env.local` / `.env` before evaluating storage runtime state.
- `/admin/analytics` now renders bucket-existence and bucket-visibility readiness cards from the same storage snapshot authority used by bootstrap and upload error mapping.
- `Bucket Not Found` remains treated as a storage bootstrap/readiness defect, not a UI problem.
- In shells without real Supabase credentials, the bootstrap command now fails closed with an actionable configuration message instead of raw env-loader noise.

### Profile / CV

- `Jimin Park` is already the active runtime/bootstrap name in live code.
- Structured profile tables already exist in schema.
- DB-backed profile data is already used in parts of the runtime, but the long-term governance rule remains: DB is the runtime truth, static fallback is bootstrap-only.
- Public runtime profile reads now take a read-first path and only bootstrap on a missing primary profile, rather than writing on every request.
- `/admin/settings` is the Profile/CV owner route.
- `/admin/settings` now keeps structural scroll ownership on desktop/tablet panes and the shell primary pane on mobile without drifting from the v0 form language.

### SEO and operations

- `lib/seo/metadata.ts` already exists.
- `app/sitemap.ts` and `app/robots.ts` already exist.
- `/knowledge -> /notes` redirect remains part of shipped routing.
- Design parity CI already exists in `.github/workflows/design-parity.yml`.
- This phase extends the existing parity/CI discipline with responsive/runtime evidence rather than replacing it.

## Locked product decisions

### Global correction

- `Jimin Park` is the canonical display and author name.
- No live runtime `Jimin Bag` reference is allowed after this phase.
- Historical audit/archive text may retain old wording if needed for chronology, but runtime/docs/test truth must stay on `Jimin Park`.

### Transition system architecture

- The shared app-shell runtime owns transition coordination.
- Route pages do not own page-replacement transitions.
- Generic fade/scale transitions are forbidden.
- Key text uses scramble/progressive reveal.
- Secondary text uses soft continuity only.
- The system must feel like one interface evolving, not one page being replaced by another.

### Persistent Jitter architecture

- Jitter is the right-side interactive pixel-based visual field.
- One persistent Jitter engine exists across all public and admin routes.
- It mounts once above route segment boundaries.
- It is not owned by route pages.
- It must not be recreated by layout transitions.
- Route pages provide mode descriptors only.

Route mapping:
- home -> dithering
- notes/projects -> dithering variants
- contact -> Life Game
- admin -> same engine, same continuity logic, no missing right panel

### Contact -> Life Game transformation

- Entering `/contact` must transform the active dither field into Life Game state.
- Leaving `/contact` must damp the active Life state back into the next route descriptor.
- Replacing or hard-resetting the panel is forbidden.
- `/guestbook` uses the same Life family with a calmer guestbook-specific descriptor.

Current implementation note:
- `R2` establishes the continuity foundation by interpolating shared dither parameters and keeping Life on the same runtime host.
- Exact field-to-field dither-to-Life transformation is still a follow-up item; current continuity must not regress into route-local panel replacement while that gap remains tracked in audit.
- `R3` preserves the same runtime-owned Jitter surface on mobile by condensing it into a band instead of deleting it.

### Responsive and multi-viewport fidelity

This is not generic responsiveness.
It is multi-viewport adaptation inside the same v0 design philosophy.

Viewport classes:
- desktop-wide
- desktop-standard
- desktop-tall/pivot
- tablet-landscape
- tablet-portrait
- mobile-landscape
- mobile-portrait

Global shell rule:
- `>= 1024px`: preserve split-panel identity
- `768px-1023px`: preserve split layout with a tighter 56/44 content-to-Jitter ratio
- `< 768px`: switch to a stacked shell with header, command strip, condensed Jitter band, then content

Responsive guardrails:
- desktop parity must remain intact
- mobile/tablet must not introduce a second UI language
- no hamburger
- no drawer
- no bottom tab bar
- no cardification
- Jitter identity must remain present across viewport classes

Route-by-route responsive plan:
- `/`: desktop split; mobile stacked with Jitter band then dense intro/recent lines
- `/contact`: desktop split; mobile stacked with Jitter band, contact content, compact guestbook preview/jump
- `/guestbook`: standalone canonical route with linear log listing; mobile stacked with Jitter band then full log
- `/notes` and `/projects`: dense row lists remain; footer controls wrap without cardification
- detail routes: linear reading surface remains terminal-native; mobile goes full-width under Jitter band
- `/admin/*`: desktop split remains; tablet narrows sidebar; mobile uses a horizontal command strip plus condensed Jitter band

Current implementation note:
- `R3` now closes the shell layer of this plan for public/admin/admin-access surfaces and for the notes subscribe strip.
- `R4` now closes the public guestbook split:
  - `/guestbook` is standalone
  - `/contact` shows preview/jump only
  - guestbook rows stay linear and terminal-native

### Guestbook product decision

- `/guestbook` becomes a standalone canonical public route again.
- `/contact` keeps only a compact preview/jump.
- `/guestbook` must remain in the same terminal/log design world.
- Public guestbook rows should feel like linear system logs, not cards or feeds.
- Public admin moderation controls are forbidden.
- Admin moderation remains under admin surfaces only.

Canonical rule:
- `/contact` self-canonical
- `/guestbook` self-canonical
- contact preview is not treated as the full guestbook archive

### Markdown-first editor architecture

- The current textarea-plus-mirror editor remains the v0 editor core.
- Replacing it with a new editor engine is forbidden.
- The editor shell remains owned by the v0 content subtree.
- The editor stays Markdown-first with no separate preview mode.
- Inline and block LaTeX remain supported.

Body media conventions:
- image: `![alt](asset://<assetId> "caption")`
- file: `[label](asset://<assetId>)`
- embed: bare URL on its own line

Writer normalization:
- `asset://` image/link tokens normalize into canonical block content
- Markdown image title normalizes into block caption
- bare URL lines normalize into embed blocks

### Block content model

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
- `Post.content` remains canonical block JSON
- `Post.htmlContent` remains derived render output
- image blocks resolve through `PostAsset`
- embed blocks resolve through normalized URL and `LinkPreviewCache.metadata`
- unresolved preview metadata must degrade to a terminal-native generic link block, not a widget/card fallback

Current implementation note:
- `R6` now resolves inline `asset://` links in body text, keeps body-owned resources out of duplicated footer listings, renders YouTube through preview-first disclosure, and exposes GitHub repo/issue/PR subtype rows inside the same terminal-native reader.
- Persisted preview metadata now includes a typed YouTube contract with `videoId`, while older cache rows still remain compatible with the existing URL/disclosure-driven fallback path.

### Upload reliability and storage bootstrap

- `Bucket Not Found` is an infrastructure/bootstrap defect.
- Bucket names remain:
  - `post-media`
  - `post-files`
- This phase introduces `pnpm storage:bootstrap` as an idempotent operational command.
- Readiness diagnostics under `/admin/analytics` must expose:
  - env presence
  - bucket existence
  - bucket visibility
- Deployment order must run storage bootstrap before production inline media rollout.

Current implementation note:
- The production server now fails closed if `STORAGE_DRIVER=test` is configured, and `/admin/analytics` reports that state instead of presenting test storage as healthy.
- `pnpm storage:bootstrap` now reapplies canonical policy to existing buckets, not only missing or visibility-mismatched ones.
- Production-equivalent Supabase bucket creation/update still requires external credential-backed verification.

### Profile / CV runtime

- Existing DB-backed profile tables remain the baseline.
- `/admin/settings` remains the Profile/CV owner.
- Readiness/diagnostics belong under `/admin/analytics`.
- Home and resume continue reading the same structured source.
- `Jimin Park` verification is a release gate.
- Static profile fallback is bootstrap-only and must not remain active runtime truth after `R7`, except explicitly documented bootstrap paths.

Current implementation note:
- Public runtime consumers and `/resume.pdf` now resolve through `getPrimaryProfileRuntimeSnapshot()`.
- Admin settings resolves through `getPrimaryProfileSettingsSnapshot()`, and concurrent first-run bootstrap now uses create-or-reread semantics instead of surfacing `slug` race errors.
- Settings/profile surfaces remain scroll-safe across desktop panes and mobile command-strip layouts without introducing a second form language.

### SEO strategy

- Keep `metadataBase = https://xistoh.com`.
- Keep `/knowledge -> /notes`.
- Public routes require title, description, canonical, Open Graph, and Twitter metadata.
- Detail routes require article metadata and JSON-LD structured data.
- `app/sitemap.ts` and `app/robots.ts` remain part of the shipped SEO system.
- Fallback OG strategy must use stable production-safe assets only.
- Guessed OG assets and guessed external URLs are forbidden.

### Typography and baseline system

- Baseline drift is a system problem, not a spacing-only problem.
- Text, inputs, buttons, and textareas must share one baseline/control system.
- Equal control heights and consistent line-height rhythm are required.
- No ad hoc padding patches.
- Scope includes newsletter, notes footer, contact form, editor inputs, settings/profile rows, and comparable terminal control strips.

### Performance diagnosis plan

- Measure first, then optimize.
- The phase must instrument:
  - admin nav click -> visual ready time
  - `getSession()` time
  - `getAdminPosts()` time
  - `getAdminPostEditorState()` time
  - `getPrimaryProfileRuntimeSnapshot()` time
  - right-panel slot handoff time
- Accepted optimizations must not remove density, Jitter presence, terminal framing, or continuity behavior.

Current implementation note:
- `R8` now instruments:
  - live admin navigation timing
  - live runtime handoff timing
  - server-side session/posts/editor/profile timing
  inside `/admin/analytics` without introducing a second diagnostics UI
- Admin navigation now keeps hover/focus prefetch but replaces eager all-route mount prefetch with idle-neighbors prefetch.
- Newsletter dashboard reads are now parallelized and the newsletter surface now keeps the shell primary pane as the scroll owner.
- Exact R2 continuity and production-equivalent R5 storage proof remain open follow-up items and are not re-claimed as closed here.

## Minimal extension inventory

The following are the only approved production extensions beyond literal `/v0app`:
- shared transition coordinator
- persistent Jitter interpolation
- responsive shell adaptation
- standalone `/guestbook`
- inline media/embed authoring
- storage bootstrap/readiness
- route-level SEO

Each extension must be justified in `docs/migration/post-p6-audit-log.md` with:
- missing-from-v0 behavior
- production requirement
- minimality explanation
- inheritance of v0 philosophy and CI

## Phase ownership

- `R1` governance refresh and baseline audit
- `R2` shared runtime and Jitter continuity correction
- `R3` responsive shell adaptation
- `R4` guestbook split and public log-language refinement
- `R5` storage bootstrap, upload reliability, and inline media/embed writer
- `R6` detail reader enrichment and responsive detail fidelity
- `R7` Profile/CV runtime and admin scroll/runtime fixes
- `R8` performance diagnostics and admin transition acceleration
- `R9` SEO, responsive parity CI, and final lock

Each phase must remain inside this spec and its supporting authorities.

## Defaults

- This spec replaces the prior post-P6 enhancement lineage in place.
- `/guestbook` is a standalone canonical route in this lineage.
- Mobile keeps Jitter as a condensed band rather than deleting it.
- `contentVersion` alone is not trusted until legacy backfill is complete.
- `post-media` and `post-files` remain the bucket names.
