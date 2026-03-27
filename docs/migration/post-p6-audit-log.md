# Post-P6 Exact-v0 Enhancement Audit Log

## Status

- Last updated: 2026-03-28
- Current implementation state: E1 through E8 accepted

## Purpose

This file is the written audit trail for post-P6 exact-v0 enhancement work.

It records:
- what changed
- what was reviewed
- what parity checks were performed
- what drift risks were found
- what was accepted or rejected
- what deviations or approvals were required

No phase is accepted without an entry here.

Canonical references:
- spec: `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- schema/compatibility: `docs/migration/post-p6-schema-compatibility-plan.md`
- route ownership: `docs/migration/post-p6-route-ownership-plan.md`
- tracker: `docs/migration/post-p6-phase-tracker.md`

## Audit rules

- Every phase must leave an audit trail
- Every parity review must be recorded
- Every accept/reject/hold decision must be recorded
- Any implementation conflict with the canonical docs must be documented here before implementation diverges
- Silent divergence is forbidden

---

## A0 — Approved enhancement baseline

### Date
- 2026-03-27

### Status
- accepted baseline

### What was reviewed
- current public shell ownership in `components/v0/public/public-shell.tsx`
- current admin shell ownership in `components/v0/admin/admin-shell.tsx`
- current public right-panel effect hosts in `components/v0/public/home-screen.tsx`, `notes-screen.tsx`, `projects-screen.tsx`, and `contact-screen.tsx`
- current admin settings ownership in `components/v0/admin/settings-screen.tsx`
- current editor/runtime ownership in `components/v0/admin/editor-screen.tsx`, `components/admin/post-editor.tsx`, and `components/admin/tiptap-editor.tsx`
- current post schema and contracts in `prisma/schema.prisma` and `lib/contracts/posts.ts`
- current profile runtime truth in `lib/site/profile.ts`
- current metadata root in `app/layout.tsx`
- current resume source in `app/resume.pdf/route.ts`
- current design parity workflow in `.github/workflows/design-parity.yml`

### What was decided
- design philosophy preservation is the top-level rule
- post-P6 work remains within the same v0 product world
- persistent Jitter must be a shared runtime primitive
- transition ownership must move above route pages
- editor becomes Markdown-first while canonical content becomes block-based
- profile becomes DB-backed with a single live source in the first release
- guestbook is integrated into contact and retained as an anchored route variant
- route-level SEO becomes mandatory
- global baseline alignment is treated as a system problem, not a spacing patch

### Known baseline gaps
- no persistent shared Jitter engine exists yet
- no shared app-shell transition runtime exists yet
- admin currently lacks a consistent right-side Jitter panel
- current editor is still TipTap-influenced
- `markdownSource` is not yet active as the writer path
- structured profile tables are not yet the runtime source
- `/admin/settings` is still readiness-oriented
- `lib/site/profile.ts` still acts as the runtime truth until E7
- SEO is still global-only
- `sitemap` and `robots` routes do not exist

### Accepted defaults
- `/guestbook` remains as anchored reuse of `/contact`
- Profile/CV uses a single live source initially
- old/new mixed content is supported during rollout
- `htmlContent` remains derived output

---

## E1 Audit Record — Governance lock and baseline inventory

### Status
- accepted

### Expected scope under audit
- `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- `docs/migration/post-p6-schema-compatibility-plan.md`
- `docs/migration/post-p6-route-ownership-plan.md`
- `docs/migration/post-p6-phase-tracker.md`
- `docs/migration/post-p6-audit-log.md`

### Pre-implementation checklist
- [x] repo truth explored before writing docs
- [x] locked defaults selected
- [x] open product decisions reduced to zero

### What changed
- created the canonical post-P6 enhancement spec
- created the canonical schema and compatibility plan
- created the canonical route ownership plan
- created the canonical post-P6 phase tracker
- created the canonical post-P6 audit log
- recorded the current repository baseline and locked defaults
- recorded the required document-driven execution rules for E1 through E8

### What was reviewed
- current v0 public/admin shell ownership
- current per-screen effect ownership
- current editor structure and contracts
- current schema truth for posts, assets, links, and preview cache
- current static profile truth and resume path
- current metadata and design parity CI state
- residual `Jimin Bag` references in runtime/profile/test surfaces

### Parity checks performed
- [x] governance docs state strict v0 identity as the highest rule
- [x] current repo truth was reflected into the new docs
- [x] schema/compatibility plan is consistent with current Prisma/contracts
- [x] route ownership plan is consistent with current public/admin runtime structure
- [x] tracker and audit align on phase naming and status

### Drift risks found
- runtime still contains residual `Jimin Bag` references outside the new docs
- current admin settings ownership conflicts with the target Profile/CV plan
- current route-level effect ownership will need structural changes in E3
- current editor contract will require non-trivial writer/read compatibility in E2/E5/E6

### Decisions / approvals / rejections
- accepted: `/guestbook` anchored reuse as the default retained-route model
- accepted: single live profile source for the first release
- accepted: no big-bang content rewrite
- accepted: post-P6 work remains document-driven like P1 through P6
- rejected: separate guestbook feed UI
- rejected: any redesign/modernization framing for post-P6 work

### Post-implementation audit checklist
- [x] created documents recorded
- [x] baseline inventory recorded
- [x] locked defaults recorded
- [x] status reflected in tracker

---

## E2 Audit Record — Schema and compatibility foundation

### Status
- accepted

### Expected scope under audit
- `prisma/schema.prisma`
- `prisma/migrations/20260327230000_add_post_p6_schema_foundation/migration.sql`
- `lib/contracts/content-blocks.ts`
- `lib/content/post-content.ts`
- `lib/contracts/posts.ts`
- `lib/data/posts.ts`
- `lib/actions/post.actions.ts`
- `lib/contracts/profile.ts`
- `lib/profile/bootstrap.ts`
- `lib/data/profile.ts`
- `prisma/seed.ts`
- `scripts/test-db.ts`
- `lib/site/profile.ts`
- `e2e/smoke.spec.ts`
- `scripts/capture-v0-parity.ts`

### Pre-implementation checklist
- [x] schema/compatibility plan reviewed
- [x] legacy reader/writer behavior reviewed
- [x] profile bootstrap strategy documented

### What changed
- added `markdownSource` to `Post` and `PostRevision`
- added structured profile schema foundation:
  - `Profile`
  - `ProfileEducation`
  - `ProfileExperience`
  - `ProfileAward`
  - `ProfileLink`
- added migration `20260327230000_add_post_p6_schema_foundation`
- added block content contracts and compatibility helpers
- introduced compatibility-safe block content contracts and explicit mode selection without switching runtime readers during E2
- extended post contracts/data/actions to expose `contentMode`, `contentVersion`, and `markdownSource` as compatibility-safe foundation fields
- added DB bootstrap/fallback profile helpers
- updated Prisma seed to bootstrap the primary profile record
- updated Prisma seed so reseeding re-syncs nested profile rows instead of only top-level profile fields
- updated test DB reset coverage to include the new profile tables
- corrected the static profile and smoke/parity expectations from `Jimin Bag` to `Jimin Park`

### What was reviewed
- current post schema/version behavior and the existing use of `contentVersion` as a legacy revision counter
- current post readers in `lib/data/posts.ts`
- current post writer in `lib/actions/post.actions.ts`
- current static profile truth in `lib/site/profile.ts`
- current resume dependency on the static profile
- current smoke/parity expectations for the public home heading
- migration application path used by `scripts/test-db.ts`
- E2 QA follow-up against schema plan, tracker, and runtime code paths

### Parity checks performed
- [x] legacy content still resolves to the legacy reader path by default
- [x] block content mode can be selected through `markdownSource` or canonical block-document shape
- [x] no forced big-bang rewrite path was introduced
- [x] static profile correction to `Jimin Park` is reflected in smoke/parity expectations
- [x] `pnpm db:generate` passed
- [x] `pnpm db:validate` passed
- [x] `pnpm typecheck` passed
- [x] `pnpm lint` passed
- [x] `pnpm build` passed
- [x] `pnpm test tests/unit/post-content-compat.test.ts` passed
- [x] `pnpm test:db:prepare` applied the new migration successfully
- [x] `pnpm test:e2e e2e/smoke.spec.ts` passed

### Drift risks found
- the runtime still reads profile data from `lib/site/profile.ts`; the new DB-backed profile schema is present but not yet the active runtime source
- `markdownSource` exists but the editor UX is not yet Markdown-first; that remains E5 scope
- the future block reader still does not exist; E2 only establishes the compatibility contract and selection rules
- because `contentVersion` was historically used as a revision counter, future work must avoid treating revision growth as a block-reader selector
- provider-specific preview metadata typing for GitHub issue/PR and YouTube remains explicitly deferred beyond E2
- DB-backed compatibility tests for full reader/writer/profile runtime paths remain deferred to E5, E6, and E7

### Decisions / approvals / rejections
- accepted: keep legacy reader compatibility fully intact during E2
- accepted: treat the DB-backed profile layer as bootstrap-ready but not yet runtime-authoritative
- accepted: complete the static/source-side `Jimin Park` correction during E2
- accepted: document block-document-shaped `content` as a compatibility-safe trigger for the future block reader path
- accepted: standardize the structured profile text field as `summary`
- accepted: narrow E2 test-coverage claims to helper-level compatibility coverage plus build/smoke validation
- rejected: any forced migration or big-bang rewrite of existing posts
- rejected: early runtime switch of Home/settings/resume to the new profile schema before E7

### Post-implementation audit checklist
- [x] schema changes recorded
- [x] compatibility rules recorded
- [x] migration validation recorded
- [x] test outcomes recorded
- [x] tracker status updated

---

## E3 Audit Record — Shared app-shell runtime

### Status
- accepted

### Expected scope under audit
- `app/layout.tsx`
- `components/v0/runtime/v0-experience-runtime.tsx`
- `components/v0/use-v0-theme-controller.ts`
- `components/v0/public/public-shell.tsx`
- `components/v0/admin/admin-shell.tsx`
- public/admin screen files that previously owned route-local right-panel effects

### Pre-implementation checklist
- [x] route ownership plan reviewed
- [x] route-local effect ownership inventoried
- [x] theme integrity baseline captured

### What changed
- added the shared post-P6 runtime in `components/v0/runtime/v0-experience-runtime.tsx`
- mounted the shared runtime from `app/layout.tsx`
- moved theme ownership to the shared runtime while preserving existing shell/theme API usage
- updated public/admin shells to:
  - reserve a right-panel slot
  - measure the slot frame
  - register route descriptors with the shared runtime
- updated `/admin/login` to use the same shared runtime through an admin-access surface
- removed route-local right-panel effect ownership from public/admin screens that previously mounted `DitheringPanel`, `DigitalRainPanel`, or `TextScramblePanel`
- added explicit runtime descriptors for note detail, project detail, guestbook, and subscription result screens

### What was reviewed
- `app/layout.tsx` runtime mount placement
- `components/v0/runtime/v0-experience-runtime.tsx` frame registration, persistent panel ownership, and theme root behavior
- `components/v0/public/public-shell.tsx` and `components/v0/admin/admin-shell.tsx` slot ownership and frame measurement
- `components/v0/admin/login-screen.tsx` admin-access runtime behavior
- public/admin screens that previously owned route-local effect mounts
- E2 QA findings for schema/doc alignment while E3 was in progress

### Parity checks performed
- [x] route pages no longer own right-panel effect mounts
- [x] shared runtime now owns public/admin right-panel continuity
- [x] admin right panel exists on all admin surfaces through the shared shell
- [x] no new generic fade/scale transition layer was introduced
- [x] `pnpm typecheck` passed
- [x] `pnpm lint` passed
- [x] `pnpm build` passed
- [x] `pnpm test:e2e e2e/smoke.spec.ts` passed
- [x] `pnpm test:e2e e2e/admin-posts.spec.ts e2e/admin-settings.spec.ts e2e/admin-community.spec.ts e2e/newsletter.spec.ts` passed

### Drift risks found
- E3 centralizes ownership and route continuity, but text-anchor choreography is still limited to shared runtime scaffolding and contact scramble overlays
- `/contact` and `/guestbook` still have separate left-column compositions; composition unification remains E4 scope
- guestbook currently uses a shared runtime life-mode descriptor before E4 anchored-reuse composition lands

### Decisions / approvals / rejections
- accepted: mount the shared runtime from `app/layout.tsx` while activating it only through public/admin shell frame registration
- accepted: use measured shell slot frames to preserve exact panel geometry without route-owned canvases
- accepted: keep right-panel continuity centralized even on null-nav public routes through explicit descriptors
- accepted: preserve existing shell markup language while moving effect ownership out of route pages
- rejected: any return to route-local right-panel effect ownership
- rejected: any generic page replacement transition layer

### Post-implementation audit checklist
- [x] ownership changes recorded
- [x] parity evidence recorded
- [x] no hold/reject routes remained for E3
- [x] tracker status updated

---

## E4 Audit Record — Contact/guestbook integration + baseline system

### Status
- accepted

### Expected scope under audit
- `app/contact/page.tsx`
- `app/guestbook/page.tsx`
- `components/v0/public/contact-screen.tsx`
- `components/v0/public/contact-terminal-form.tsx`
- `components/v0/public/guestbook-screen.tsx`
- `components/v0/public/guestbook-screen-bound.tsx`
- `components/v0/public/guestbook-terminal-panel.tsx`
- `components/v0/public/notes-screen.tsx`
- `components/v0/admin/newsletter-manager.tsx`
- `components/v0/admin/settings-screen.tsx`
- `components/admin/post-editor.tsx`
- `components/admin/tiptap-editor.tsx`
- `app/globals.css`
- `e2e/contact-guestbook.spec.ts`

### Pre-implementation checklist
- [x] contact and guestbook baseline captured
- [x] anchored reuse rule reviewed in route ownership plan
- [x] audited baseline target list confirmed

### What changed
- moved `/contact` to the integrated contact + guestbook composition by binding guestbook/session data in `app/contact/page.tsx`
- converted `components/v0/public/contact-screen.tsx` into the shared integrated composition owner
- added `components/v0/public/guestbook-terminal-panel.tsx` as the terminal/log guestbook extension below the existing contact form
- converted `components/v0/public/guestbook-screen.tsx` into an anchored reuse wrapper over the contact composition
- updated `components/v0/public/guestbook-screen-bound.tsx` so `/guestbook` reuses the integrated contact composition with guestbook focus
- introduced shared baseline/control tokens in `app/globals.css`
- applied the shared baseline tokens to audited form/control surfaces across:
  - public contact
  - notes subscribe footer
  - admin newsletter
  - admin settings
  - v0 editor controls
- added `e2e/contact-guestbook.spec.ts` to lock integrated composition reuse and the notes footer baseline

### What was reviewed
- contact subtree fidelity against the original `v0app/app/page.tsx` contact block
- guestbook integration against the canonical post-P6 spec and route ownership plan
- baseline-sensitive controls in notes footer, contact form, newsletter manager, settings screen, and v0 editor surfaces
- route behavior on `/contact` and `/guestbook`
- E2 and E3 documentation/state before closing E4

### Parity checks performed
- [x] `/contact` and `/guestbook` now share the same composition
- [x] guestbook reads as a terminal/log extension instead of a separate feed surface
- [x] shared control-height and line-height tokens are present in `app/globals.css`
- [x] `pnpm typecheck` passed
- [x] `pnpm lint` passed
- [x] `pnpm build` passed
- [x] `pnpm test:e2e e2e/smoke.spec.ts e2e/contact-guestbook.spec.ts e2e/admin-settings.spec.ts e2e/newsletter.spec.ts e2e/media-access.spec.ts` passed

### Drift risks found
- baseline tokens are now in place, but E5 and E7 will need to continue using them when editor/profile surfaces are expanded
- `/guestbook` currently focuses the shared composition by scrolling to the guestbook block; any later route rewrite must preserve anchored reuse instead of recreating a second layout
- E2/E3 QA sub-agent review was requested during E4 closeout; no local blocker was found while waiting on that external review

### Decisions / approvals / rejections
- accepted: keep the original contact subtree as the primary composition and append guestbook below it as a terminal/log extension
- accepted: keep `/guestbook` as an anchored reuse instead of deleting or redesigning it
- accepted: fix baseline drift through shared control-height and line-height tokens rather than ad hoc spacing tweaks
- rejected: any separate guestbook feed surface
- rejected: card-style guestbook presentation
- rejected: one-off padding fixes that bypass the shared baseline system

### Post-implementation audit checklist
- [x] integration changes recorded
- [x] baseline fixes recorded
- [x] route parity evidence recorded
- [x] tracker status updated

---

## E5 Audit Record — Markdown-first editor and block writer

### Status
- accepted

### Expected scope under audit
- `components/v0/admin/editor-screen.tsx`
- `components/admin/post-editor.tsx`
- `components/admin/tiptap-editor.tsx`
- `components/admin/v0-markdown-editor.tsx`
- `lib/content/markdown-blocks.ts`
- `lib/actions/post.actions.ts`
- `lib/data/posts.ts`
- `lib/content/draft-state.ts`
- `components/v0/admin/admin-fallback-content.tsx`
- `tests/unit/markdown-blocks.test.ts`
- `tests/unit/draft-state.test.ts`
- `tests/unit/post-content-compat.test.ts`
- `e2e/admin-posts.spec.ts`
- E2 through E4 QA follow-up on:
  - `components/v0/runtime/v0-experience-runtime.tsx`
  - `components/v0/public/contact-screen.tsx`
  - `components/v0/public/contact-terminal-form.tsx`
  - `components/v0/public/guestbook-terminal-panel.tsx`
  - `components/v0/public/notes-screen.tsx`
  - `components/v0/admin/newsletter-manager.tsx`

### Pre-implementation checklist
- [x] legacy editor behavior inventoried
- [x] block-writer contract finalized
- [x] image/embed insertion behavior defined

### What changed
- added `lib/content/markdown-blocks.ts` to:
  - derive Markdown from legacy-compatible editor inputs
  - normalize Markdown into canonical block content
  - derive HTML output from the canonical block document
- added `components/admin/v0-markdown-editor.tsx` as the Markdown-first live syntax authoring surface
- updated `components/admin/post-editor.tsx` so the v0 editor route now writes:
  - `markdownSource`
  - canonical block `content`
  - derived `htmlContent`
  - block-schema `contentVersion`
- kept `components/admin/tiptap-editor.tsx` only for non-v0/default compatibility flows
- updated `lib/actions/post.actions.ts` to accept `contentMode` and write canonical block content through the Markdown-first path
- updated `lib/data/posts.ts` so editor inputs derive `markdownSource` from legacy content when the field is empty
- updated `lib/content/draft-state.ts` so block-document payloads participate in meaningful-content checks
- added unit coverage in:
  - `tests/unit/markdown-blocks.test.ts`
  - `tests/unit/draft-state.test.ts`
- updated `e2e/admin-posts.spec.ts` to assert the Markdown-first writer path and canonical block output
- closed E2-E4 QA follow-up findings that were safe to fix during E5:
  - removed right-panel blanking on pathname handoff by preserving the active runtime registration until the next shell registers
  - gave admin loading/error/not-found surfaces a fallback shared-runtime descriptor
  - moved admin loading/error/not-found body styling onto the runtime theme source so fallback surfaces no longer drift from shell theme state
  - removed hard-coded `transformHint: "home"` from contact/guestbook life-mode descriptors
  - seeded Life Game transitions from the active dither variant instead of a route-key-only reset
  - restored exact literal v0 contact-form field/button metrics where shared control tokens had over-normalized the surface
  - narrowed guestbook width so the appended log block stays in the same column rhythm as contact
  - moved notes footer topic toggles to a shared token-backed micro-control class
  - aligned the newsletter HTML editor branch with the shared control-area baseline token

### What was reviewed
- `v0app/app/page.tsx` content-editor subtree and contact subtree
- current v0 editor route shell in `components/v0/admin/editor-screen.tsx`
- current writer compatibility rules in `docs/migration/post-p6-schema-compatibility-plan.md`
- current runtime ownership rules in `docs/migration/post-p6-route-ownership-plan.md`
- E2-E4 doc/implementation/design-context QA findings from sub-agents and local review

### Parity checks performed
- [x] Markdown-first authoring now lives inside the v0 editor shell
- [x] no separate preview mode exists on the v0 editor route
- [x] inline and block math fence insertion is available in the Markdown-first surface
- [x] the v0 editor route writes canonical block content plus derived HTML
- [x] the legacy compatibility editor path remains isolated from the v0 route
- [x] `pnpm typecheck` passed
- [x] `pnpm lint` passed
- [x] `pnpm build` passed
- [x] `pnpm test tests/unit/markdown-blocks.test.ts tests/unit/draft-state.test.ts tests/unit/post-content-compat.test.ts` passed
- [x] `pnpm test:e2e e2e/admin-posts.spec.ts e2e/media-access.spec.ts e2e/smoke.spec.ts e2e/contact-guestbook.spec.ts` passed

### Drift risks found
- public detail routes were still on the legacy reader path at E5 close; the block-reader rollout moved into E6
- `components/v0/admin/editor-screen.tsx` still wraps `components/admin/post-editor.tsx`; shell ownership is preserved, but final reader parity depends on E6 rendering
- `/guestbook` anchored focus still depends on client-side scroll/focus within the shared composition rather than a prepaint anchor primitive
- the shared runtime now centralizes right-panel continuity, but broader left-panel text choreography remains incremental and is documented as such instead of claimed complete
- sub-agent QA also flagged `components/v0/admin/community-screen.tsx` as visually heavier than ideal terminal-row language; this is outside E5 scope and remains non-blocking for E2-E4 close

### Decisions / approvals / rejections
- accepted: activate the Markdown-first writer path on the v0 editor route before the public block reader rollout
- accepted: keep `TiptapEditor` only as a compatibility path outside the v0 route
- accepted: preserve exact literal contact metrics where the shared baseline token system drifted from the v0 contact subtree
- accepted: narrow the route-ownership docs so current right-panel continuity is described honestly while broader left-panel choreography remains future incremental work
- rejected: reintroducing route-local effect mounts to paper over shared-runtime continuity gaps
- rejected: replacing the v0 editor route with modern editor chrome or split preview UX

### Post-implementation audit checklist
- [x] editor changes recorded
- [x] writer changes recorded
- [x] E2-E4 QA follow-up outcomes recorded
- [x] parity review recorded
- [x] tracker status updated

---

## E6 Audit Record — Reader rollout for block content

### Status
- accepted

### Expected scope under audit
- `components/v0/public/detail-content.tsx`
- `components/v0/public/detail-note-screen.tsx`
- `components/v0/public/detail-note-screen-bound.tsx`
- `components/v0/public/detail-project-screen.tsx`
- `lib/content/post-content.ts`
- `lib/data/posts.ts`
- `lib/actions/post.actions.ts`
- `e2e/detail-reader.spec.ts`
- `tests/unit/post-content-compat.test.ts`
- E2 through E5 sub-agent QA findings and their resolution path

### Pre-implementation checklist
- [x] legacy detail reader behavior captured
- [x] embed variants defined
- [x] mixed-content dataset prepared

### What changed
- replaced `components/v0/public/detail-content.tsx` with a canonical block-aware renderer that prefers block documents, then legacy structured content, then stored HTML
- added v0-native block rendering for headings, paragraphs, quotes, lists, code fences, math blocks, image blocks with captions, embed blocks, and thematic breaks
- updated note detail to pass inline link and asset context into the shared reader
- updated project detail to use the shared reader and suppress duplicate standalone link rows when the body already owns those URLs
- updated note detail bound extras to suppress duplicate footer links/assets when the body already owns those resources
- added `collectBlockDocumentResources` and `normalizeContentResourceUrl` in `lib/content/post-content.ts`
- updated `lib/data/posts.ts` so block embed URLs synthesize preview-backed inline link context from `LinkPreviewCache` even without explicit `PostLink` rows
- updated `lib/actions/post.actions.ts` so non-block compatibility saves clear `markdownSource` instead of leaving stale block-mode selectors behind
- tightened `resolvePostContentMode` so legacy revision-counter growth does not masquerade as block content
- added `e2e/detail-reader.spec.ts` for mixed legacy/block note detail coverage and GitHub-preview project detail coverage
- updated `tests/unit/post-content-compat.test.ts` to validate canonical block selection and high-revision legacy safety

### What was reviewed
- note and project detail framing against `v0app/app/page.tsx`
- E5 Markdown writer output shape in relation to the new reader path
- E2 compatibility rules for mixed old/new content
- inline preview behavior through `LinkPreviewCache`
- E2 through E5 sub-agent QA findings across docs, compatibility, and design context

### Parity checks performed
- [x] block detail rendering stays inside v0 reading language
- [x] image captions render inside the same reading surface instead of widget/card UI
- [x] YouTube preview-first expand/collapse behavior works in note detail
- [x] GitHub preview rows render inside the project reading surface
- [x] old/new mixed content reads safely on the same deployed runtime
- [x] orphan footer links/assets only render when not already represented inline
- [x] `pnpm typecheck` passed
- [x] `pnpm lint` passed
- [x] `pnpm build` passed
- [x] `pnpm --dir v0app build` passed
- [x] `pnpm test tests/unit/markdown-blocks.test.ts tests/unit/draft-state.test.ts tests/unit/post-content-compat.test.ts` passed
- [x] `pnpm test:e2e e2e/detail-reader.spec.ts` passed
- [x] `pnpm test:e2e e2e/contact-guestbook.spec.ts e2e/admin-settings.spec.ts e2e/newsletter.spec.ts` passed

### Drift risks found
- `/admin/settings` still presents a readiness-oriented surface inside the future Profile/CV shell; this remains E7 scope and is documented as a current-truth defer, not an E6 blocker
- `LinkPreviewCache` enrichment for GitHub issue/PR-specific metadata remains generic/repo-biased until a later preview-metadata expansion
- `/guestbook` anchored focus still depends on client-side focus/scroll rather than a prepaint anchor primitive
- broader left-panel text choreography remains incremental shared-runtime work and is not claimed complete by E6

### Decisions / approvals / rejections
- accepted: use the canonical block-document shape, not legacy `contentVersion` growth, as the runtime reader selector
- accepted: synthesize inline preview-backed link context from `LinkPreviewCache` for block embed URLs instead of introducing a second preview subsystem
- accepted: keep standalone footer resource rows only for orphaned links/assets not already represented inline
- accepted: treat E2 through E5 sub-agent QA findings as fix-now vs later-phase scope, and only close E6 after the fix-now set passed validation
- rejected: leaving public detail routes in an undocumented partial-reader state
- rejected: duplicating inline body embeds with always-on standalone link stacks

### Post-implementation audit checklist
- [x] reader rollout logged
- [x] compatibility outcomes logged
- [x] parity review logged
- [x] tracker status updated

---

## E7 Audit Record — Profile/CV runtime rollout

### Status
- accepted

### Expected scope under audit
- `components/v0/admin/settings-screen.tsx`
- `components/v0/admin/settings-screen-bound.tsx`
- `components/v0/admin/profile-settings-editor.tsx`
- `components/v0/admin/analytics-screen.tsx`
- `components/v0/public/home-screen-bound.tsx`
- `app/contact/page.tsx`
- `components/v0/public/guestbook-screen-bound.tsx`
- `lib/data/profile.ts`
- `lib/actions/profile.actions.ts`
- `app/resume.pdf/route.ts`
- `e2e/admin-settings.spec.ts`
- `e2e/helpers/profile.ts`
- `docs/migration/post-p6-*.md`
- `docs/00_system_overview.md`
- `docs/04_frontend_ui_mapping.md`
- `docs/06_release_checklist.md`

### Pre-implementation checklist
- [x] profile bootstrap mapping reviewed
- [x] readiness relocation target reviewed
- [x] verified external profile-link rule carried forward

### What changed
- rewired `/admin/settings` to a real DB-backed Profile / CV editor inside the v0 settings shell
- added `components/v0/admin/profile-settings-editor.tsx` as the terminal-like structured profile CRUD + reorder surface
- added `lib/actions/profile.actions.ts` to persist profile summary, education, experience, awards, and verified links transactionally
- switched Home to DB-backed profile reads through `getPrimaryProfileRuntimeSnapshot()`
- switched contact and guestbook profile consumers to the same DB-backed runtime snapshot
- switched `app/resume.pdf/route.ts` to the DB-backed profile runtime source
- moved retained readiness diagnostics into `components/v0/admin/analytics-screen.tsx`
- normalized runtime profile reads so live surfaces bootstrap the primary DB profile row instead of silently splitting between DB and static fallback
- fixed `resumeHref` semantics by treating `/resume.pdf` as the fixed runtime route instead of a user-editable divergent path
- updated admin settings E2E to verify save -> Home/contact/guestbook/resume propagation through the live profile runtime
- updated migration and operations docs to reflect the new E7 current truth

### What was reviewed
- `/admin/settings` against the v0 settings subtree in `v0app/app/page.tsx`
- Home/contact/guestbook/resume consumers against the single-live-source profile rule
- E2 schema/compatibility guarantees for profile bootstrap fallback
- E3 runtime ownership after moving readiness out of `/admin/settings`
- E4 integrated contact/guestbook composition after profile-source migration
- E5/E6 compatibility after adding E7 runtime reads
- sub-agent QA across:
  - document alignment
  - runtime/backend/API compatibility
  - v0 design-context drift

### Parity checks performed
- [x] `/admin/settings` now presents a real profile editor instead of readiness-owned content
- [x] settings stays terminal-like and non-dashboard
- [x] Home still renders inside the exact v0 home shell while reading DB-backed profile data
- [x] contact and guestbook keep the same integrated composition while using the DB-backed profile source
- [x] `resume.pdf` reflects the DB-backed profile runtime source
- [x] `Jimin Park` remains the canonical runtime and bootstrap name
- [x] `pnpm typecheck` passed
- [x] `pnpm lint` passed
- [x] `pnpm build` passed
- [x] `pnpm --dir v0app build` passed
- [x] `pnpm test tests/unit/markdown-blocks.test.ts tests/unit/draft-state.test.ts tests/unit/post-content-compat.test.ts` passed
- [x] `pnpm test:e2e e2e/smoke.spec.ts e2e/contact-guestbook.spec.ts e2e/admin-settings.spec.ts e2e/newsletter.spec.ts e2e/media-access.spec.ts e2e/admin-posts.spec.ts e2e/detail-reader.spec.ts e2e/admin-community.spec.ts` passed, with `e2e/admin-settings.spec.ts` rerun after selector tightening

### Drift risks found
- E2/E5 compatibility docs still assume a stronger legacy-edit fallback than the current routed editor path actually provides; legacy post editing may still auto-upgrade into the block writer path without an explicit convert step
- `/guestbook` first-paint focus still depends on client-side anchor/focus behavior rather than a prepaint anchor primitive
- `/admin/posts` and `/admin/posts/[postId]` remain denser than the literal v0 direct-match ideal; this is inherited baseline drift outside E7 scope, not a blocker for the E7 profile rollout
- unverified external profile links remain intentionally non-linked by rule; LinkedIn stays absent until a verified production source exists

### Decisions / approvals / rejections
- accepted: treat DB-backed profile data as the active runtime truth for Home, contact, guestbook, admin settings, and resume output
- accepted: keep `lib/site/profile.ts` as bootstrap-only fallback truth rather than runtime truth
- accepted: keep `/resume.pdf` as the fixed resume route and remove divergent custom resume-path semantics from the live profile workflow
- accepted: move readiness/diagnostics under analytics instead of keeping readiness as `/admin/settings` owner
- accepted: fix E2-E6 QA findings that were directly actionable during E7:
  - removed generic opacity transition classes from the shared right-panel runtime
  - restored code rendering to a v0 terminal palette
  - filtered orphan project assets the same way as note detail assets
  - fixed the analytics diagnostics `accentText` type/runtime omission
- rejected: keeping `/admin/settings` as a readiness dashboard after E7
- rejected: silent profile-source split between DB-backed and static profile consumers

### Post-implementation audit checklist
- [x] profile rollout logged
- [x] QA findings logged
- [x] route parity review logged
- [x] tracker status updated

---

## E8 Audit Record — SEO and final enhancement parity lock

### Status
- accepted

### Expected scope under audit
- `lib/seo/metadata.ts`
- `app/page.tsx`
- `app/contact/page.tsx`
- `app/notes/page.tsx`
- `app/projects/page.tsx`
- `app/guestbook/page.tsx`
- `app/subscribe/confirm/page.tsx`
- `app/unsubscribe/page.tsx`
- `app/notes/[slug]/page.tsx`
- `app/projects/[slug]/page.tsx`
- `app/(dashboard)/admin/layout.tsx`
- `app/admin/login/page.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `.github/workflows/design-parity.yml`
- `e2e/seo.spec.ts`
- `docs/migration/post-p6-*.md`
- `docs/00_system_overview.md`
- `docs/04_frontend_ui_mapping.md`
- `docs/06_release_checklist.md`

### Pre-implementation checklist
- [x] metadata baseline captured
- [x] OG image fallback strategy documented
- [x] internal-link audit scope confirmed

### What changed
- added `lib/seo/metadata.ts` to centralize public metadata, article metadata, admin noindex metadata, canonical author naming, OG image defaults, and JSON-LD generation
- added route-level metadata to home, contact, notes, projects, guestbook, subscribe confirm, and unsubscribe
- added article-style metadata and structured data output to note and project detail routes
- added admin noindex metadata to the admin layout and admin login route
- added `app/sitemap.ts` and `app/robots.ts`
- extended `.github/workflows/design-parity.yml` so the PR-equivalent path runs focused SEO/detail/contact parity coverage and still uploads parity artifacts
- added `e2e/seo.spec.ts`
- hardened profile-driven metadata generation to avoid runtime bootstrap races by using read-only profile snapshots for metadata paths
- normalized the root canonical URL to `https://xistoh.com` and kept `/knowledge` excluded from sitemap output
- completed E2 through E7 QA closure by fixing:
  - shared runtime generic opacity transitions
  - detail code-block palette drift
  - orphan project-asset duplication
  - settings/profile runtime source races
  - resume-path edit drift
  - static-fallback split on Home/contact/guestbook/resume reads

### What was reviewed
- public route metadata against the shipped IA
- detail route metadata and JSON-LD against the canonical article/detail rules
- admin route metadata against the noindex rule
- sitemap and robots output against the canonical host and `/knowledge` removal rule
- parity artifact generation and PR-equivalent CI path
- E2 through E7 sub-agent QA findings across:
  - docs/governance alignment
  - runtime/backend/API/production risk
  - v0 design-context drift

### Parity checks performed
- [x] Home emits route-level title, description, canonical, Open Graph, and Twitter metadata
- [x] note/project detail routes emit article metadata and JSON-LD structured data
- [x] admin routes emit noindex metadata
- [x] `robots.txt` and `sitemap.xml` are live
- [x] sitemap excludes `/knowledge`
- [x] no stale runtime `/knowledge` links were found during E8 audit
- [x] design parity artifacts were regenerated through `pnpm parity:capture`
- [x] `pnpm typecheck` passed
- [x] `pnpm lint` passed
- [x] `pnpm build` passed
- [x] `pnpm --dir v0app build` passed
- [x] `CURRENT_BASE_URL=http://127.0.0.1:3311 V0_BASE_URL=http://127.0.0.1:3410 pnpm parity:capture` passed
- [x] `APP_URL=http://127.0.0.1:3311 CRON_SECRET=codex-test-cron-secret pnpm exec tsx scripts/ops-smoke.ts` passed
- [x] `pnpm test:e2e e2e/smoke.spec.ts e2e/contact-guestbook.spec.ts e2e/detail-reader.spec.ts e2e/seo.spec.ts e2e/admin-posts.spec.ts e2e/admin-settings.spec.ts e2e/admin-community.spec.ts e2e/engagement.spec.ts` passed
- [x] `pnpm test:e2e e2e/newsletter.spec.ts e2e/media-access.spec.ts` passed

### Drift risks found
- legacy post editing compatibility is still weaker than the broad mixed-rollout wording might imply; re-saving a legacy post through the v0 routed editor still normalizes it into the block writer path without an explicit convert step
- `/guestbook` default focus still lands through client-side anchor/focus behavior instead of a prepaint anchor primitive
- `/admin/posts` and `/admin/posts/[postId]` remain denser than the literal v0 direct-match ideal; this is inherited baseline drift rather than an E8 regression
- LinkedIn remains intentionally non-linked until a verified production source exists

### Decisions / approvals / rejections
- accepted: close E8 with route-level SEO, sitemap/robots, structured data, and refreshed parity/CI coverage in place
- accepted: treat the legacy-post auto-upgrade edit path as a documented non-blocking residual risk instead of silently overstating compatibility
- accepted: keep LinkedIn as an intentional non-link until a verified production source exists
- accepted: keep `/guestbook` first-paint anchor behavior as a documented residual risk rather than introducing a non-v0 prepaint hack
- rejected: any metadata or SEO implementation that changes the shipped v0 visual UI
- rejected: guessed OG assets or guessed external profile URLs

### Post-implementation audit checklist
- [x] final SEO changes logged
- [x] final QA findings logged
- [x] final parity lock logged
- [x] tracker status updated

---

## Open issues / explicit approvals required

- None. Future deviations must be recorded here before implementation diverges from the canonical docs.
