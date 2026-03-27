# Post-P6 Exact-v0 Enhancement Spec

## Status

- Approved for execution
- Last updated: 2026-03-28
- Canonical enhancement authority: this file

## Authority and execution rule

This document is the active source of truth for post-P6 exact-v0 enhancement work.

Implementation, review, and cutover decisions must conform to this file.
If implementation reveals a conflict, ambiguity, or feasibility issue, it must be recorded here and in `docs/migration/post-p6-audit-log.md` before the implementation is allowed to diverge.

This enhancement phase must not be executed in an undocumented way.
No phase is complete unless:
- the relevant phase entry is updated in `docs/migration/post-p6-phase-tracker.md`
- the relevant audit entry is updated in `docs/migration/post-p6-audit-log.md`

Supporting authorities:
- `docs/migration/post-p6-schema-compatibility-plan.md`
- `docs/migration/post-p6-route-ownership-plan.md`

## Top-level goal

Extend the shipped v0-faithful production app without changing its design philosophy.

This is not a redesign.
This is not a modernization pass.
This is not a UX reinterpretation.

The most important requirement is preserving design philosophy.
Not just layout.
Not just colors.
Not just components.

Preserve:
- philosophy
- CI
- visual grammar
- density
- motion feel
- tone
- atmosphere
- right-panel identity

The goal is:
- same UI
- same composition
- same spacing
- same typography rhythm
- same motion/effects
- same terminal density
- same atmosphere

while adding:
- production-grade transition continuity
- a persistent right-side Jitter runtime
- Markdown-first authoring
- block-based content
- structured profile/CV editing
- integrated contact + guestbook behavior
- route-level SEO
- global typography/baseline correctness

## Non-negotiable design rule

All new functionality must be absorbed into the existing v0 system as if it had always belonged there.

Do not:
- redesign
- reinterpret
- modernize
- soften
- improve UX in a generic SaaS way
- introduce a new visual language
- replace terminal/log/frame grammar with cards, widgets, or dashboard chrome

## Current repository truth

### Runtime and shell ownership

- Public shell lives in `components/v0/public/public-shell.tsx`
- Admin shell lives in `components/v0/admin/admin-shell.tsx`
- `app/layout.tsx` is the current metadata and theme root
- `components/v0/runtime/v0-experience-runtime.tsx` now provides the shared post-P6 app-shell runtime
- public/admin shells register right-panel frame ownership into the shared runtime
- the shared runtime now keeps the active panel registration until the next shell registers, preventing right-panel blanking during route handoff
- route pages no longer own their local right-panel effect panels

### Right-panel and effects

- one shared runtime now owns the right-side panel across public and admin shells
- home, notes, projects, detail routes, guestbook, and result routes now provide route descriptors instead of route-local effect mounts
- contact and guestbook currently use the shared runtime life-mode descriptor
- admin surfaces now share a consistent right-side Jitter panel
- admin loading, error, and not-found surfaces now inherit a fallback shared-runtime descriptor instead of dropping the right panel
- contact and guestbook now share the same integrated left-column composition
- `/guestbook` now reuses `/contact` as an anchored guestbook-focus variant
- right-panel continuity is active today; broader left-panel text choreography remains incremental work inside the same runtime ownership model

### Editor and content

- `components/v0/admin/editor-screen.tsx` still wraps `components/admin/post-editor.tsx`
- `components/admin/post-editor.tsx` now runs a Markdown-first writer surface for the v0 editor route and writes canonical block content plus derived HTML
- `components/admin/tiptap-editor.tsx` remains only as a non-v0/default compatibility editor path
- `Post.content` already exists as JSON
- `Post.htmlContent` already exists as stored render content
- `markdownSource` is now the active writer path for the v0 admin editor surface
- inline and block LaTeX authoring tokens are now supported in the Markdown-first writer surface
- public detail routes now prefer the canonical block-document reader, fall back to legacy structured content, and only then fall back to stored HTML
- public detail routes now synthesize preview-backed inline link context for block embeds and suppress duplicate footer resource rows when the body already owns that link or asset

### Profile and CV

- structured profile tables now exist in schema and are the active runtime source for Home, contact, guestbook, admin settings, and resume output
- `lib/site/profile.ts` remains bootstrap-only fallback truth for initial seeding and missing-table fallback
- `/admin/settings` now owns the real Profile/CV editor inside the v0 settings shell
- readiness diagnostics no longer own `/admin/settings`; retained diagnostics live under `/admin/analytics`
- `app/resume.pdf/route.ts` now reads the DB-backed profile snapshot
- `Jimin Park` is now the corrected runtime and bootstrap name

### Contact, guestbook, and SEO

- Contact and guestbook now share one integrated composition
- `/guestbook` reuses the contact composition and anchors to the guestbook block by default
- contact and guestbook now read email and verified profile-link data from the DB-backed profile snapshot
- shared control-height and line-height tokens now exist in `app/globals.css` and are applied across audited baseline surfaces
- the contact form keeps its exact v0 field/button metrics instead of using normalized shared control sizing
- route-level metadata now exists across public routes through `lib/seo/metadata.ts`
- note and project detail routes now emit article-style metadata plus JSON-LD structured data
- admin routes now emit noindex metadata through route-local admin metadata helpers
- `metadataBase` remains `https://xistoh.com`
- `app/sitemap.ts` now exists and excludes `/knowledge`
- `app/robots.ts` now exists and points at the shipped sitemap while disallowing admin and worker-only paths
- the fallback OG image strategy is active through `/placeholder-logo.png`
- `/knowledge -> /notes` redirect already exists

### CI and parity

- Design parity CI already exists in `.github/workflows/design-parity.yml`
- Design parity CI now also runs focused SEO/detail/contact parity checks and uploads refreshed parity artifacts
- Post-P6 work must extend the current parity and QA discipline, not replace it

## Locked product decisions

### 1. Global correction

Replace all instances of `Jimin Bag` with `Jimin Park` in:
- public UI
- admin UI
- metadata
- seed/fallback data
- profile/CV
- resume generation
- tests and fixtures where applicable

`Jimin Park` is the canonical display and author name.

### 2. Transition system

- Transition ownership belongs to the shared app-shell runtime, not route pages
- Shared-element-like continuity is required
- Generic fade/scale transitions are forbidden
- Key text uses scramble/progressive reveal
- Secondary text uses soft continuity only
- Any abrupt remount feeling is a failure

### 3. Persistent Jitter

- Jitter is the right-side 50% interactive visual field
- One persistent Jitter engine exists across all routes
- It mounts once at the shared app-shell runtime level
- It is not owned by route pages
- It must not be recreated by layout segment boundaries
- Routes only provide mode descriptors

Route mapping:
- home -> dithering
- notes/projects -> dithering variants
- contact -> Life Game
- admin -> same engine, same continuity, same right-panel requirement

Contact special rule:
- entering contact must transform the current Jitter into Life Game
- replacing or resetting the panel is forbidden

### 4. Editor and content model

- Editor UX is Markdown-first
- Canonical content is block-based JSON
- `markdownSource` becomes first-class authoring input
- `htmlContent` remains derived render cache / compatibility output only

Locked block set:
- paragraph
- heading
- list
- quote
- code
- math
- image
- embed
- thematic break

Images:
- unlimited insertion
- arbitrary position
- caption support

Embeds:
- generic link preview
- YouTube preview-first expand
- GitHub repository preview
- GitHub issue preview
- GitHub PR preview

Rendering constraint:
- all reading surfaces must stay inside the v0 reading language
- widget-like block rendering is forbidden

### 5. Profile / CV

- Static profile truth in `lib/site/profile.ts` is replaced by a DB-backed structured profile system
- Initial publish model is `Single Live Source`
- Saving in admin immediately updates the live profile/CV
- Draft/publish workflow is explicitly deferred
- `/admin/settings` becomes the real Profile / CV editor owner
- If readiness remains visible, it moves under `/admin/analytics` diagnostics/readiness

### 6. Contact + guestbook

- Guestbook is integrated into `/contact`
- `/guestbook` is retained as an anchored route variant that reuses the same integrated composition
- Separate feed UI is forbidden
- Card UI is forbidden
- New section style is forbidden

### 7. SEO

- Every public route gets title, description, canonical, Open Graph, and Twitter metadata
- Detail pages also get article-style metadata and structured data
- `/knowledge -> /notes` redirect and canonical cleanup remain required
- `app/sitemap.ts` and `app/robots.ts` are part of the planned system

OG image rule:
- home, notes, projects, and detail routes use stable production-safe OG images
- guessed assets are forbidden

### 8. Typography and baseline system

- Misalignment is treated as a control/baseline system problem, not a spacing problem
- Text, input, and button controls must share one baseline grid
- Arbitrary padding-only fixes are forbidden
- Shared control height and line-height tokens must drive the fix
- The fix applies globally across newsletter, notes footer, contact, editor, and profile/settings screens

## Enhancement documents and responsibilities

This enhancement is governed by:
- `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- `docs/migration/post-p6-schema-compatibility-plan.md`
- `docs/migration/post-p6-route-ownership-plan.md`
- `docs/migration/post-p6-phase-tracker.md`
- `docs/migration/post-p6-audit-log.md`

Execution rules:
- implementation must reference this spec
- schema and migration work must reference the compatibility plan
- runtime ownership and shell work must reference the route ownership plan
- progress must be recorded in the phase tracker
- review, parity checks, accept/reject decisions, hold states, and deviations must be recorded in the audit log
- no phase may be marked done while any reject/hold state remains open
- silent divergence is forbidden

## Enhancement phase sequence

- E1: Governance lock and baseline inventory
- E2: Schema and compatibility foundation
- E3: Shared app-shell runtime
- E4: Contact/guestbook integration + baseline system
- E5: Markdown-first editor and block writer
- E6: Reader rollout for block content
- E7: Profile/CV runtime rollout
- E8: SEO and final enhancement parity lock

Detailed execution tracking lives in `docs/migration/post-p6-phase-tracker.md`.

## Acceptance rules

- No enhancement phase is accepted unless tracker and audit are both updated
- No direct-match route may remain in reject or hold status at final parity lock
- Design CI must run successfully on a PR-equivalent path and upload parity artifacts
- Design philosophy preservation outranks convenience refactors

## Assumptions and defaults

- P6 parity lock is already complete before this phase starts
- `Jimin Park` is the canonical person name
- `/guestbook` remains an anchored reuse of `/contact`
- Profile/CV uses a single live source in the first release
- New features must extend the same product, not create a second design system
