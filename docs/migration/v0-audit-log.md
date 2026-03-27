# v0 Fidelity Migration Audit Log

## Status

- Last updated: 2026-03-27
- Current implementation state: P1 through P6 accepted; direct-match admin recovery is closed, final parity and QA are complete, and closeout docs/design CI are aligned with the shipped runtime

## Purpose

This file is the written audit trail for the v0 fidelity migration.

It records:
- what changed
- what was reviewed
- what parity checks were performed
- what drift risks were found
- what was accepted or rejected
- what deviations were requested or approved

No cutover is accepted without an entry here.

Canonical references:
- spec: `docs/migration/v0-fidelity-production-migration-spec.md`
- tracker: `docs/migration/v0-phase-tracker.md`

## Audit rules

- Every phase must leave an audit trail.
- Every parity review must be recorded.
- Every explicit accept/reject decision must be recorded.
- Any implementation conflict with the spec must be documented here and reflected back into the spec before merge.
- Silent divergence is forbidden.

---

## A0 — Approved baseline and execution governance

### Date
- 2026-03-27

### Status
- accepted baseline

### What was reviewed
- repository route structure
- current public/admin surface files
- `/v0app` visual source files
- current shared site/admin component layers
- `/knowledge` usage across routes, docs, tests, and loaders
- current production/backend integration shape

### What was decided
- v0 remains the visual source of truth
- migration is productionization without visual reinterpretation
- public and admin route groups must cut over atomically
- literal extraction must happen before reuse/refactor
- `/knowledge` is removed from public IA
- default compatibility redirect is `/knowledge -> /notes`
- documentation-driven execution is required

### Known drift risks at baseline
- current home uses non-v0 shell composition and extra panels
- current notes/projects use card UI instead of dense terminal rows
- current contact UI is not the v0 contact experience
- current admin uses operational/dashboard shells instead of v0 admin language
- current `/knowledge` route, links, docs, and smoke tests are stale against target IA

### Accepted constraints
- no mixed old/new public cutover
- no mixed old/new admin cutover
- no synthesized v0 reinterpretation
- no completion without tracker + audit updates

---

## P1 Audit Record — v0 literal extraction scaffold

### Status
- accepted

### Expected scope under audit
- `app/layout.tsx`
- `app/globals.css`
- new `components/v0/public/*`
- new `components/v0/admin/*`
- new `components/v0/effects/*`

### Pre-implementation checklist
- [x] closest literal v0 subtree identified for each target screen
- [x] shell/effect host scope constrained to safe first-pass hosts only
- [x] current shared abstractions explicitly treated as non-authoritative

### What changed
- added `components/v0/public/*` scaffold screens for home, contact, notes, projects, note detail, project detail, guestbook, and subscription result surfaces
- added `components/v0/admin/*` scaffold screens for login, analytics, manage-posts, editor, newsletter, settings, and community
- added `components/v0/effects/*` safe first-pass hosts for dithering, digital rain, and text scramble
- added `components/v0/fixtures.ts` as a non-runtime fixture source copied from v0 sample content to preserve literal screen structure during scaffold work
- added exact-supporting copies for the v0 subscription and newsletter manager modules under `components/v0/public/subscription-module.tsx` and `components/v0/admin/newsletter-manager.tsx`
- confirmed `app/layout.tsx` and `app/globals.css` already matched the v0 global layer closely enough for P1, so no runtime-shell changes were required in this phase
- excluded `v0app/**` and numbered legacy duplicate files from root `tsconfig.json` and `eslint.config.mjs` so repo-level validation only covers the actual runtime plus the new scaffold layer
- corrected scaffold drift after agent review:
  - restored the notes sticky subscribe footer
  - allowed public detail/extension screens to render with no active nav item
  - removed the synthetic `community` item from the literal admin sidebar
  - restored v0 newsletter subscribers/preview structure and subject input focus classes
  - tightened admin login/community extensions to closer admin shell language
- restored v0 source-default brand literals (`jimin.garden`) inside the scaffold defaults so the scaffold remains literal unless production callers override it later

### What was reviewed
- `v0app/app/page.tsx` subtree structure for public home/contact/notes/projects/detail/admin overview/content/manage-posts/newsletter/settings
- `v0app/components/digital-rain.tsx` and `v0app/components/text-scramble.tsx` against current runtime implementations
- current `app/layout.tsx` and `app/globals.css` against `v0app/app/globals.css`
- current shared abstractions in `components/site/*` and `components/admin/*` to confirm they should not be used as the P1 visual source
- comparison-agent findings for public/admin drift against `v0app/app/page.tsx` and `v0app/components/newsletter-manager.tsx`
- repo-level validation outcomes from `pnpm lint`, `pnpm build`, `pnpm typecheck`, and `pnpm ops:smoke`

### Parity checks performed
- [x] public shell frame against v0
- [x] admin shell frame against v0
- [x] dithering panel against v0
- [x] digital rain against v0
- [x] text scramble against v0
- [x] notes sticky subscribe footer restored against the literal notes subtree
- [x] public detail/extension screens no longer force a sibling nav tab active
- [x] admin sidebar no longer invents a sixth literal item
- [x] newsletter subscribers and preview branches restored to v0 structure
- [x] `pnpm lint` passed
- [x] `pnpm build` passed
- [x] `pnpm typecheck` passed
- [x] `APP_URL=http://127.0.0.1:3100 pnpm ops:smoke` passed

### Drift risks found
- no live route mounts the new scaffold yet, so parity is source-level and compile-level only in this phase, not route-level screenshot parity
- `guestbook`, `subscription result`, `admin login`, and `admin community` remain v0-language extensions rather than direct v0 route copies and must be re-reviewed during their live binding/cutover phases
- the copied supporting newsletter and subscription modules are intentionally isolated under `components/v0/*` to avoid accidental reuse of current runtime components during later phases
- root validation depends on keeping reference-only `v0app/**` and obsolete numbered duplicate files out of the root lint/typecheck scope until cleanup formally removes or quarantines them in later phases

### Decisions / approvals / rejections
- accepted: use exact `components/v0/*` copies instead of current runtime `components/subscription-module.tsx` and `components/newsletter-manager.tsx`
- accepted: leave `app/layout.tsx` and `app/globals.css` unchanged in P1 because they already align with the v0 global baseline
- accepted: exclude `v0app/**` and numbered legacy duplicate files from root lint/typecheck because they are reference or obsolete artifacts, not the production runtime
- accepted: keep `guestbook`, `subscription result`, `admin login`, and `admin community` as v0-language extensions in the scaffold, with mandatory re-review during live binding phases
- rejected: reusing current `components/site/site-header.tsx`, `components/site/signal-panel.tsx`, or admin shell components as the source of the scaffold

### Post-implementation audit checklist
- [x] no live route adopted
- [x] no synthesized multi-view screen introduced
- [x] no non-v0 shell reused
- [x] build, lint, typecheck, and ops smoke outcomes recorded
- [x] accepted / rejected explicitly recorded

---

## P2 Audit Record — public screen bindings

### Status
- accepted

### Expected scope under audit
- public literal screen files
- `app/contact/page.tsx`
- live data/action bindings for homepage, notes, projects, detail, contact, guestbook, subscribe/unsubscribe flows

### Pre-implementation checklist
- [x] all public screen data sources identified
- [x] all public mutation entry points identified
- [x] `/knowledge` excluded from any new screen binding work

### What changed
- added data-bound public wrappers:
  - `components/v0/public/home-screen-bound.tsx`
  - `components/v0/public/notes-screen-bound.tsx`
  - `components/v0/public/projects-screen-bound.tsx`
  - `components/v0/public/detail-note-screen-bound.tsx`
  - `components/v0/public/detail-project-screen-bound.tsx`
  - `components/v0/public/guestbook-screen-bound.tsx`
  - `components/v0/public/confirm-subscription-screen-bound.tsx`
  - `components/v0/public/unsubscribe-screen-bound.tsx`
- added `components/v0/public/mappers.ts` to bridge live DTOs into literal v0 row/detail metadata
- added `app/contact/page.tsx` as the production contact route using the v0 contact screen
- bound the contact terminal form to `submitContactMessage` and restored shared contact intensity between form state and `DigitalRain`
- bound notes/projects lists to `getPublishedPostsByType()` and homepage recent notes to `getHomepagePosts()`
- bound note/project detail shells to `getPublishedPostDetail()` and moved runtime likes/comments/assets/links out of the literal base detail screens into bound runtime extensions
- bound guestbook submission and moderation to `/api/guestbook` and `/api/admin/guestbook/[entryId]`
- bound confirm/unsubscribe screens to the real subscriber actions and production token flows
- restored the fixed literal notes filter chip set while removing synthetic filter membership and views-based status inference; live notes now filter only by real matching tags and use a non-fabricated default status glyph
- inlined the notes sticky subscribe footer back into `components/v0/public/notes-screen.tsx` and wired it to `requestSubscription`
- added default route navigation to `components/v0/public/public-shell.tsx` and changed note/project detail back controls to real links
- added `components/v0/public/detail-content.tsx` and routed live note content through a v0-style renderer instead of the generic `dangerouslySetInnerHTML` branch so real code blocks preserve the literal Tokyo Night shell and copy affordance
- removed non-literal project detail header metadata and made detail runtime extension sections theme-aware instead of hardcoded to dark-mode classes

### What was reviewed
- `v0app/app/page.tsx` literal public subtrees for home, contact, notes, projects, post-detail, and project-detail
- `v0app/components/subscription-module.tsx` against the current `components/v0/public/subscription-module.tsx` and notes footer behavior
- current public data loaders and actions:
  - `lib/data/posts.ts`
  - `lib/data/guestbook.ts`
  - `lib/actions/contact.actions.ts`
  - `lib/actions/subscriber.actions.ts`
- current route surfaces still on legacy public UI:
  - `app/page.tsx`
  - `app/notes/page.tsx`
  - `app/projects/page.tsx`
  - `app/notes/[slug]/page.tsx`
  - `app/projects/[slug]/page.tsx`
  - `app/guestbook/page.tsx`
  - `app/subscribe/confirm/page.tsx`
  - `app/unsubscribe/page.tsx`
- prior and current P1/P2 drift findings around contact intensity, notes filter/footer behavior, and literal detail-screen preservation
- validation outcomes from `pnpm lint`, `pnpm typecheck`, `pnpm build`, `APP_URL=http://127.0.0.1:3100 pnpm ops:smoke`, and direct HTTP 200 checks for `/contact`, `/notes`, and `/projects`
- follow-up subagent review findings covering live note content rendering, notes taxonomy honesty, detail extension theme coupling, and project-detail header drift

### Parity checks performed
- [x] homepage live data did not change v0 layout
- [x] notes/projects live data did not change row structure
- [x] detail live state did not break v0 framing after runtime sections were removed from the literal base screens
- [x] contact live state did not break exact v0 contact UI
- [x] result-state screens stay in public shell language
- [x] `pnpm lint` passed
- [x] `pnpm typecheck` passed
- [x] `pnpm build` passed
- [x] `APP_URL=http://127.0.0.1:3100 pnpm ops:smoke` passed
- [x] `GET /contact`, `GET /notes`, and `GET /projects` returned HTTP 200 against `next start`

### Drift risks found
- most public bound screens are still off-route in P2, so route-by-route screenshot parity remains deferred to the P3 public cutover gate
- the backend does not expose a literal note maturity field, so the notes status glyph uses a deterministic fixture-backed fallback rather than a first-class domain value; this must be revisited if a real maturity field is introduced later
- the backend still does not expose a literal note maturity field, so the notes status glyph stays on a single non-fabricated default value until the domain model grows a real maturity/status field
- `guestbook`, `subscribe/confirm`, and `unsubscribe` remain v0-language extensions rather than direct v0 route copies and must be re-reviewed during P3 cutover parity checks
- `app/contact/page.tsx` exists pre-cutover for binding validation, but it must not be treated as public-group acceptance while sibling public routes still use the legacy shell
- runtime note/project content still needs route-level screenshot review under real published content during P3 because rich content and code-block variation can drift despite passing compile/runtime checks

### Decisions / approvals / rejections
- accepted: bind public screens through `components/v0/public/*-bound.tsx` while keeping legacy public routes in place until P3
- accepted: keep the new `/contact` route available for branch-level binding validation without treating it as public cutover acceptance
- accepted: restore shared contact intensity at the screen level instead of letting the form and right-side effect diverge
- accepted: restore the literal notes filter chip set and inline sticky footer inside `notes-screen.tsx`
- accepted: use a deterministic fixture-backed note status fallback instead of the rejected views-based heuristic
- accepted: keep the live notes status glyph on a single non-fabricated default until a real domain field exists, rather than synthesizing maturity from unrelated data
- accepted: move likes/comments/assets/extra note links out of the literal base detail screens and into bound runtime extensions
- accepted: add a dedicated v0 note detail renderer for live content instead of falling back to the generic runtime HTML/prose renderer
- rejected: keeping runtime sections embedded directly inside the literal note/project base screens
- rejected: dynamically generating notes filter chips from live tag taxonomy during P2
- rejected: synthesizing tag-filter membership for notes whose live tags do not actually match the literal chip set

### Post-implementation audit checklist
- [x] all fallback states reviewed
- [x] no generic loading/error/empty widgets remain
- [x] no public live route switched early
- [x] accepted / rejected explicitly recorded

---

## P3 Audit Record — public atomic cutover + `/knowledge` removal

### Status
- accepted

### Expected scope under audit
- full public cutover
- `/knowledge` route removal
- `/knowledge -> /notes` redirect
- public nav/home CTA updates
- smoke/doc updates tied to `/knowledge`

### Pre-implementation checklist
- [x] P2 accepted
- [x] `/knowledge` removal impact reviewed
- [x] redirect target confirmed
- [x] public cutover group enumerated

### Cutover gate checklist
- [x] screenshot parity reviewed against v0 reference states
- [x] full sibling-route consistency confirmed
- [x] no legacy shell remains in the public cutover group
- [x] redirect/link/canonical changes verified
- [x] no non-v0 fallback UI remains at the code/runtime level after the P3 drift pass

### What changed
- switched the live public routes to the v0 public screen layer:
  - `app/page.tsx`
  - `app/contact/page.tsx`
  - `app/notes/page.tsx`
  - `app/notes/[slug]/page.tsx`
  - `app/projects/page.tsx`
  - `app/projects/[slug]/page.tsx`
  - `app/guestbook/page.tsx`
  - `app/subscribe/confirm/page.tsx`
  - `app/unsubscribe/page.tsx`
- deleted `app/knowledge/page.tsx`
- removed `getPublishedKnowledgePosts()` from `lib/data/posts.ts`
- added permanent redirect `/knowledge -> /notes` in `next.config.mjs`
- removed stale `/knowledge` navigation from `components/site/site-header.tsx`
- updated public-IA documentation in:
  - `docs/00_system_overview.md`
  - `docs/01_core_architecture.md`
  - `docs/04_frontend_ui_mapping.md`
  - `docs/06_release_checklist.md`
- updated `e2e/smoke.spec.ts` for:
  - the new public route set
  - `/knowledge` removal
  - self-seeded published detail coverage for the comment flow
  - selector tolerance for literal v0 button spacing
- changed `scripts/start-e2e-server.ts` to run `next build` followed by `next start` so Playwright validates the production artifact rather than `next dev`
- repaired the `v0app` reference build by closing an unbalanced admin-overview wrapper in `v0app/app/page.tsx`
- generated the full public route/state parity set under `docs/migration/parity/2026-03-27-public/`, including note detail, project detail, guestbook, confirm, and unsubscribe surfaces
- reran parity capture against a current server started with test env so seeded detail/result fixtures are visible to the runtime during capture
- reran `pnpm ops:smoke` against the same test-env current server so worker auth uses the aligned `CRON_SECRET`
- addressed public drift uncovered during P3 verification:
  - restored external link rows on `/projects`
  - refactored public detail comments toward terminal rows in `components/v0/public/comments-log.tsx`
  - removed standalone bordered-card framing from `components/v0/public/subscription-result-screen.tsx`
  - converted the guestbook writer to a single-line terminal input
  - made note/project footer share and copy-link controls live
  - replaced dead GitHub placeholders with a live GitHub URL and rendered unknown LinkedIn as honest non-link text
  - added explicit terminal empty states for notes/projects so public index routes no longer degrade to blank surfaces when live data is absent

### What was reviewed
- live public route entry files under `app/`
- `components/v0/public/*` bound screens and public shell
- `/knowledge` references across runtime code, docs, and tests
- redirect behavior in `next.config.mjs`
- public P1/P2 fidelity findings from the audit subagent against:
  - `v0app/app/page.tsx`
  - migration governance docs
  - the current public runtime implementation
- public reference/current screenshots under `docs/migration/parity/2026-03-27-public/`
- validation outcomes from:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test:e2e e2e/smoke.spec.ts`
  - `APP_URL=http://127.0.0.1:3300 pnpm ops:smoke`
  - `curl -I http://127.0.0.1:3300/knowledge`

### Parity checks performed
- [x] `/` now mounts `components/v0/public/home-screen-bound.tsx`
- [x] `/contact` now mounts `components/v0/public/contact-screen`
- [x] `/notes` now mounts `components/v0/public/notes-screen-bound.tsx`
- [x] `/projects` now mounts `components/v0/public/projects-screen-bound.tsx`
- [x] `/notes/[slug]` and `/projects/[slug]` now mount the v0 detail bound screens
- [x] `/guestbook`, `/subscribe/confirm`, and `/unsubscribe` now mount the v0 public extension screens
- [x] public sibling-route consistency was confirmed by route inspection and runtime checks
- [x] public reference/current captures for `/`, `/notes`, `/projects`, `/contact`, note detail, and project detail were manually reviewed after the `v0app` build was repaired
- [x] public extension-surface captures for guestbook, confirm, and unsubscribe were reviewed against the shipped public-shell language
- [x] `pnpm lint` passed
- [x] `pnpm typecheck` passed
- [x] `pnpm build` passed
- [x] `CURRENT_BASE_URL=http://127.0.0.1:3321 V0_BASE_URL=http://127.0.0.1:3421 pnpm parity:capture` passed
- [x] `pnpm test:e2e e2e/smoke.spec.ts` passed
- [x] `APP_URL=http://127.0.0.1:3300 pnpm ops:smoke` passed
- [x] `APP_URL=http://127.0.0.1:3321 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke` passed on the aligned parity server

### Drift risks found
- the public audit subagent correctly found that the migration docs were stale against the shipped runtime; this has now been corrected in the tracker and audit log, but it was a real governance breach before this update
- `guestbook`, `subscribe/confirm`, and `unsubscribe` are still v0-language extensions rather than direct v0 route copies, but the generated captures confirm they stay inside the shipped public shell language
- LinkedIn remains intentionally unlinked because the repository does not expose a verified production URL; this is honest behavior, but the exact v0 link affordance cannot be fully restored until a real URL exists
- public direct-reference screens still differ in content/data from `v0app`, but the shell, spacing language, and extension discipline are accepted for P3

### Redirect / link / canonical audit
- [x] `/knowledge` redirect verified
- [x] no runtime nav still points to `/knowledge`
- [x] `/knowledge` canonical removed with the deletion of `app/knowledge/page.tsx`
- [x] internal-link cleanup across runtime/docs/tests recorded
- [x] DB content-link audit recorded

### Decisions / approvals / rejections
- accepted: complete the public cutover in one route-group switch rather than route-by-route
- accepted: keep `/knowledge -> /notes` as the compatibility redirect target
- accepted: move Playwright public validation onto a production build/start server instead of `next dev`
- accepted: close P3 after the full public route/state capture set and aligned ops smoke passed on a test-env current server
- accepted: restore multi-link project rows on `/projects` using live legacy project URLs
- accepted: tighten public comment/result/guestbook surfaces toward terminal rows instead of card framing
- rejected: leaving the migration governance docs stale after the public cutover
- rejected: keeping dead social placeholders or dead footer actions in the live public runtime
- rejected: keeping standalone bordered-card result pages for confirm/unsubscribe

### Post-implementation audit checklist
- [x] public cutover accepted after full public parity review
- [x] `/knowledge` removal accepted for code/runtime and compatibility redirect behavior
- [x] residual public drift risks recorded
- [x] follow-up cleanup items recorded

---

## P4 Audit Record — admin screen bindings

### Status
- accepted

### Expected scope under audit
- admin literal screen files
- auth, analytics, posts, editor, newsletter, settings, and moderation bindings

### Pre-implementation checklist
- [x] all admin live data/action inputs identified
- [x] auth boundary behavior documented
- [x] editor/newsletter state requirements reviewed

### What changed
- added admin bound screen entry points:
  - `components/v0/admin/login-screen-bound.tsx`
  - `components/v0/admin/analytics-screen-bound.tsx`
  - `components/v0/admin/manage-posts-screen-bound.tsx`
  - `components/v0/admin/editor-screen-bound.tsx`
  - `components/v0/admin/newsletter-screen-bound.tsx`
  - `components/v0/admin/settings-screen-bound.tsx`
  - `components/v0/admin/community-screen-bound.tsx`
- converted `components/v0/admin/analytics-screen.tsx` from fixture data to real analytics summary binding using the v0 overview shell
- rewrote `components/v0/admin/manage-posts-screen.tsx` around `getAdminPosts()` so the v0 manage-posts screen now binds real query/filter/pagination data in row form
- rewrote `components/v0/admin/settings-screen.tsx` to bind `getAdminReadinessDashboard()` inside a v0-language settings shell, then later re-aligned that shell closer to the literal profile/CV subtree after screenshot review found the earlier readiness-only layout too far from v0
- rewrote `components/v0/admin/community-screen.tsx` to render live moderation rows with `deleteCommentAsAdmin` and `deleteGuestbookEntryAsAdmin`
- replaced `components/v0/admin/newsletter-manager.tsx` fixture logic with real topic/subscriber/campaign/delivery bindings and live newsletter actions
- extended `lib/contracts/newsletter.ts` and `lib/data/newsletter.ts` with a read-only subscriber snapshot for the v0 newsletter subscribers tab
- extended `lib/contracts/analytics.ts` and `lib/data/analytics.ts` with `uniqueVisitors` and per-top-content dwell averages so the v0 analytics screen can bind real metrics more faithfully
- added a `v0` variant to `components/admin/post-editor.tsx` and `components/admin/tiptap-editor.tsx`, then wrapped that editor logic in `components/v0/admin/editor-screen.tsx`
- normalized public/admin v0 scaffold default brand labels and like-button storage keys from `jimin.garden` artifacts to `xistoh.log`
- added shared cookie-backed v0 theme state via `xistoh-v0-theme` so public/admin v0 shells now use the same persisted theme source and the public shell toggle updates live route output
- removed remaining rounded editor chrome from the `v0` variant by flattening TipTap code-block framing and cover-image preview rendering

### What was reviewed
- `v0app/app/page.tsx` admin subtrees for overview, content, manage-posts, newsletter, and settings
- live admin runtime routes under:
  - `app/admin/login/page.tsx`
  - `app/(dashboard)/admin/layout.tsx`
  - `app/(dashboard)/admin/analytics/page.tsx`
  - `app/(dashboard)/admin/posts/page.tsx`
  - `app/(dashboard)/admin/posts/[postId]/page.tsx`
  - `app/(dashboard)/admin/newsletter/page.tsx`
  - `app/(dashboard)/admin/settings/page.tsx`
  - `app/(dashboard)/admin/community/page.tsx`
- live data/action sources:
  - `lib/data/analytics.ts`
  - `lib/data/posts.ts`
  - `lib/data/newsletter.ts`
  - `lib/data/community.ts`
  - `lib/ops/readiness.ts`
  - `lib/actions/newsletter.actions.ts`
  - `lib/actions/community.actions.ts`
  - `lib/auth.ts`
- validation outcomes from:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `APP_URL=http://127.0.0.1:3300 pnpm ops:smoke`
  - `curl -I http://127.0.0.1:3300/admin/login`
  - `curl -I http://127.0.0.1:3300/admin/newsletter`
  - `curl -I http://127.0.0.1:3300/admin/settings`
- public re-audit findings from the comparison subagent covering P1/P2/P3 residual drift against docs, user requirements, and `v0app`

### Parity checks performed
- [x] analytics live data did not replace the v0 overview shell with dashboard cards
- [x] manage-posts live data now binds into row/table terminal language instead of the legacy card/table shell
- [x] settings/community bound screens avoid the old dashboard-card wall and render as terminal rows/logs
- [x] login binding now performs real credential auth while preserving the v0 access-gate language
- [x] `pnpm lint` passed
- [x] `pnpm typecheck` passed
- [x] `pnpm build` passed
- [x] `APP_URL=http://127.0.0.1:3300 pnpm ops:smoke` passed
- [x] `/admin/login` returned HTTP 200 against `next start`
- [x] at P4 verification time, `/admin/newsletter` and `/admin/settings` still redirected to `/admin/login` while the legacy admin shell remained active pre-cutover
- [x] cookie-driven dark/light rendering changed live public SSR output on `/notes`
- [x] at P4 acceptance time, Playwright browser interaction confirmed the public theme toggle mutated `xistoh-v0-theme`; the later in-place toggle recovery is tracked in P5

### Drift risks found
- at P4 acceptance time, admin live routes still mounted the legacy admin shell, so no route-level screenshot parity existed yet for P4; P5 remained the first legal admin cutover point
- the editor and newsletter bound screens now use real logic, but they still need screenshot review against v0 reference states before any route adoption
- at P4 acceptance time, P3 still remained open because screenshot parity review against captured v0 reference states was incomplete
- LinkedIn/public social-link fidelity remains limited by missing verified production data, which is documented but still a live gap against exact v0 affordance parity

### Decisions / approvals / rejections
- accepted: extend read-only analytics/newsletter loader output where needed to support more faithful v0 admin bindings without changing runtime schemas
- accepted: create explicit `*-bound.tsx` admin entry points instead of silently repurposing legacy route files during P4
- accepted: move the settings screen from the obsolete mock profile editor to a readiness terminal surface because the approved migration spec requires real readiness payload rendering in v0 language
- accepted: add a `v0` variant to the existing post editor and TipTap editor to keep production logic while preparing the literal admin shell for P5
- rejected: switching live admin routes during P4
- rejected: keeping the old rounded admin dashboard/card language inside the new bound screens

### Post-implementation audit checklist
- [x] no admin live route switched early
- [x] accepted / rejected explicitly recorded
- [x] no generic admin fallback widgets remain

---

## P5 Audit Record — admin atomic cutover

### Status
- accepted

### Expected scope under audit
- full admin cutover across login, analytics, posts, editor, newsletter, settings, and community

### Pre-implementation checklist
- [x] P4 accepted
- [x] admin cutover group enumerated
- [x] auth boundary behavior validated

### Cutover gate checklist
- [x] screenshot parity reviewed against v0 reference states
- [x] full sibling-route consistency confirmed
- [x] no legacy shell remains in the admin cutover group
- [x] redirect/link/canonical changes verified where applicable
- [x] no non-v0 fallback UI remains at the code/runtime level after the P5 drift pass

### What changed
- switched the live admin route entrypoints to the v0 bound screen layer:
  - `app/admin/login/page.tsx`
  - `app/(dashboard)/admin/analytics/page.tsx`
  - `app/(dashboard)/admin/posts/page.tsx`
  - `app/(dashboard)/admin/posts/[postId]/page.tsx`
  - `app/(dashboard)/admin/newsletter/page.tsx`
  - `app/(dashboard)/admin/settings/page.tsx`
  - `app/(dashboard)/admin/community/page.tsx`
- removed the legacy admin layout shell from `app/(dashboard)/admin/layout.tsx`; it now only enforces the auth boundary
- changed `app/(dashboard)/admin/page.tsx` to redirect to `/admin/analytics`
- changed `components/v0/admin/login-screen.tsx` default redirect target to `/admin/analytics`
- extended `components/v0/admin/admin-shell.tsx` for live P5 behavior:
  - `[+] New Content` now targets `/admin/content`
  - `Community` is exposed as a documented shell extension so the live moderation route is reachable and active
  - `currentSection` now allows shell-owned fallback states with no forced sibling tab active
- changed `app/(dashboard)/admin/content/page.tsx` from a compatibility redirect into a draft-creation entrypoint that redirects into the editor
- added admin-group fallback surfaces:
  - `app/(dashboard)/admin/loading.tsx`
  - `app/(dashboard)/admin/error.tsx`
  - `app/(dashboard)/admin/not-found.tsx`
- updated Playwright coverage to the canonical v0 UI for:
  - `e2e/admin-community.spec.ts`
  - `e2e/admin-posts.spec.ts`
  - `e2e/admin-settings.spec.ts`
  - `e2e/newsletter.spec.ts`
  - `e2e/media-access.spec.ts`
  - `e2e/engagement.spec.ts`
- allowed the local production test harness to keep using the test email driver and outbox by updating:
  - `lib/email/provider.ts`
  - `lib/email/providers/test.ts`
  - `scripts/test-env.ts`
- inherited the repaired `v0app` reference build from the P3 parity work; full admin screenshot parity capture is now technically possible, but authenticated current-admin capture/review is still pending
- fixed `scripts/capture-v0-parity.ts` so public/admin outputs no longer collide in the same directory, current admin capture includes login/content/community, and current admin waits on stable route-specific markers
- regenerated `docs/migration/parity/2026-03-27-admin/` against a production build using test URLs aligned to the active capture port
- implemented shared v0 theme state across the app shell:
  - `app/layout.tsx` now renders the persisted theme on `<html>` and `<body>`
  - `lib/site/v0-theme.ts` and `lib/site/v0-theme.server.ts` now expose shared client/server theme helpers
  - `components/v0/use-v0-theme-controller.ts` now drives in-place theme updates and persistence
  - `components/v0/public/public-shell.tsx`, `components/v0/admin/admin-shell.tsx`, and `components/v0/admin/login-screen.tsx` now update theme without route reload
- normalized post editor validation output in `lib/actions/post.actions.ts` so the v0 terminal editor renders concise validation lines such as `[Title is required]` instead of raw Zod payloads
- tightened the direct-match admin recovery:
  - `components/v0/admin/manage-posts-screen.tsx` now keeps search, filters, counts, and pagination inside the inline command/footer row language instead of a larger dashboard-like block
  - `components/admin/post-editor.tsx` now keeps production-only fields below the primary v0 hierarchy in collapsed `[meta]`, `[project links]`, and `[attachments]` blocks
- changed the v0 editor recovery so state transitions are owned by the primary actions (`Save Draft`, `Publish`, `Archive`) and the `[meta]` block now exposes a read-only state line instead of a conflicting status selector
- updated `e2e/media-access.spec.ts` to validate published/archive file access through the canonical primary actions and updated `e2e/admin-posts.spec.ts` to reveal `[meta]` before editing `Slug`
- added the parity/design automation layer:
  - `package.json` now exposes `pnpm parity:capture`
  - `.github/workflows/design-parity.yml` now runs lint, typecheck, build, parity capture, smoke, and the required E2E subset
  - `scripts/capture-v0-parity.ts` now captures the required direct-match route states for `admin/posts` and `admin/posts/[postId]`, including deterministic upload-pending capture
- added missing reference-build lint plugins (`eslint-plugin-react-hooks`, `@next/eslint-plugin-next`) so `pnpm --dir v0app build` completes without plugin-resolution errors
- updated `e2e/admin-posts.spec.ts` to the canonical v0 control model and added accessibility labels in `components/v0/admin/manage-posts-screen.tsx` for search/apply/prev/next and inline filter tokens
- completed the final direct-match recovery pass:
  - `components/v0/admin/manage-posts-screen.tsx` now uses the lighter command-row + footer-row control model and drops the extra views/page-number density that had kept the screen above the literal v0 shell
  - `components/admin/post-editor.tsx` now moves project URL editing and preview-card handling into the primary v0 hierarchy for project-mode states
  - `components/admin/tiptap-editor.tsx` now uses the literal v0 toolbar set (`B`, `I`, `U`, `H1`, `H2`, `link`, `list`, `code`) and an `h-64` editor surface for the v0 variant
  - `app/layout.tsx` now pins `color-scheme` on both `<html>` and `<body>` so the SSR theme matches the persisted mode from first paint
- regenerated `docs/migration/parity/2026-03-27-admin/` and `docs/migration/parity/2026-03-27-public/` against aligned production-mode servers at `3311` and `3410`
- reran the strict-close QA stack on aligned servers:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm --dir v0app build`
  - `CURRENT_BASE_URL=http://127.0.0.1:3311 V0_BASE_URL=http://127.0.0.1:3410 pnpm parity:capture`
  - `APP_URL=http://127.0.0.1:3311 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke`
  - `pnpm test:e2e e2e/smoke.spec.ts e2e/admin-posts.spec.ts e2e/admin-settings.spec.ts e2e/admin-community.spec.ts e2e/engagement.spec.ts e2e/media-access.spec.ts e2e/newsletter.spec.ts`
- manually reviewed the regenerated admin capture pairs again and accepted `manage-posts` and `content` as sufficiently aligned with their fixed direct v0 reference subtrees
- updated `e2e/admin-settings.spec.ts` so the readiness assertions follow the corrected read-only settings-shell fields after the v0-shell re-alignment

### What was reviewed
- live admin route entry files under `app/admin/login` and `app/(dashboard)/admin/*`
- `components/v0/admin/*` against the P5 cutover requirements in the migration tracker/spec
- P1-P4 audit findings returned by the subagents covering:
  - documentation drift versus live runtime
  - `content` versus `manage-posts` mapping drift
  - missing admin fallback surfaces
  - live selector drift in the admin/public QA suite
- validation outcomes from:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test:e2e e2e/smoke.spec.ts e2e/admin-posts.spec.ts e2e/admin-settings.spec.ts e2e/admin-community.spec.ts e2e/newsletter.spec.ts e2e/media-access.spec.ts e2e/engagement.spec.ts`
  - `APP_URL=http://127.0.0.1:3300 pnpm ops:smoke`
  - `curl -I http://127.0.0.1:3300/admin/analytics`
- follow-up validation outcomes from:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test:e2e e2e/admin-settings.spec.ts`
  - `APP_URL=http://127.0.0.1:3313 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke`
- `v0app/app/page.tsx` admin navigation and section shells while validating current admin shell mappings
- repository search results confirming there is still no verified LinkedIn URL to restore
- regenerated admin parity artifacts under `docs/migration/parity/2026-03-27-admin/`
- the regenerated admin route/state artifact set after the latest recovery pass, including:
  - `current-manage-posts-default`
  - `current-manage-posts-search-active`
  - `current-manage-posts-filtered`
  - `current-manage-posts-empty-result`
  - `current-manage-posts-paginated`
  - `current-content-default`
  - `current-content-project-toggle`
  - `current-content-publish-ready`
  - `current-content-validation-error`
  - `current-content-upload-pending`
- local theme-integrity QA for `/notes` and `/admin/login`, confirming in-place theme flips with stable URLs and no hydration errors
- dead import / dead component scans for retired public/admin shells and stale `/knowledge` runtime references
- local browser network errors during QA, confirming that the only 404 came from `/_vercel/insights/script.js` outside the Vercel host

### Parity checks performed
- [x] `/admin/login` now mounts the v0 login bound screen
- [x] `/admin/analytics` now mounts the v0 analytics bound screen
- [x] `/admin/posts` now mounts the v0 manage-posts bound screen
- [x] `/admin/posts/[postId]` now mounts the v0 editor bound screen
- [x] `/admin/newsletter` now mounts the v0 newsletter bound screen
- [x] `/admin/settings` now mounts the v0 settings bound screen
- [x] `/admin/community` now mounts the v0 community bound screen
- [x] admin auth redirects still send unauthenticated requests to `/admin/login`
- [x] public/admin/login theme toggles now update in place without route reload during QA
- [x] `pnpm lint` passed
- [x] `pnpm typecheck` passed
- [x] `pnpm build` passed
- [x] `pnpm parity:capture` passed with the required admin route/state set
- [x] targeted and group E2E coverage passed against the production artifact
- [x] `pnpm --dir v0app build` passed without missing-plugin lint errors
- [x] `APP_URL=http://127.0.0.1:3300 pnpm ops:smoke` passed
- [x] regenerated admin parity artifacts under `docs/migration/parity/2026-03-27-admin/` and manually reviewed the direct-reference admin pairs
- [x] `pnpm test:e2e e2e/admin-settings.spec.ts` passed after the selector update for the corrected settings shell
- [x] `APP_URL=http://127.0.0.1:3313 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke` passed against the parity-capture server
- [x] `pnpm test:e2e e2e/smoke.spec.ts e2e/admin-posts.spec.ts e2e/admin-settings.spec.ts e2e/admin-community.spec.ts e2e/engagement.spec.ts` passed after the recovery pass
- [x] `pnpm test:e2e e2e/media-access.spec.ts e2e/newsletter.spec.ts` passed after the primary-action status fix
- [x] `APP_URL=http://127.0.0.1:3321 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke` passed against the aligned test-env current server
- [x] `CURRENT_BASE_URL=http://127.0.0.1:3311 V0_BASE_URL=http://127.0.0.1:3410 pnpm parity:capture` passed against the final current/reference set
- [x] local theme-integrity QA confirmed in-place theme flips on `/notes` and `/admin/login` without URL reload

### Drift risks found
- no blocking admin drift remains after the final direct-match recovery pass
- `components/admin/post-editor.tsx` and `components/admin/tiptap-editor.tsx` still preserve production editor logic, but the current adapter structure was accepted after the regenerated parity review
- verified external profile links remain governed by the honesty rule; LinkedIn is intentionally non-linked because the repository does not expose a verified production URL
- non-blocking local-only QA noise remains:
  - headless Playwright logs WebGL unsupported for the shader panel
  - local `/_vercel/insights/script.js` returns 404 outside the Vercel production host

### Decisions / approvals / rejections
- accepted: move the live admin route group to the v0 bound screen layer before final screenshot parity acceptance, with that remaining gate explicitly tracked in docs
- accepted: expose `Community` as a documented admin-shell extension so the live route is reachable within the cutover group
- accepted: make `/admin/content` a draft-creation entrypoint so `[+] New Content` maps to an actual content-editor flow instead of collapsing into manage-posts
- accepted: add admin-group loading/error/not-found surfaces in the v0 shell language
- accepted: update E2E expectations to the canonical v0 UI instead of preserving legacy selector assumptions
- accepted: allow the local production test harness to use the test email provider/outbox during `next start` validation
- accepted: implement theme persistence with shared client/server helpers as long as the visible interaction stays in-place and flash-free
- accepted: use deterministic capture for animation timing, effect state, and upload-pending parity-only input as long as production UX is unchanged
- accepted: close the former `admin/posts` and `admin/posts/[postId]` hold routes after the final literal recovery pass and regenerated parity review
- rejected: leaving the tracker/audit in a state where P5 is marked “not started” while live admin routes already run on the v0 layer
- rejected: keeping legacy admin selector expectations such as `Create draft`, `Provider readiness`, rounded moderation cards, or placeholder campaign copy after the cutover
- rejected: restoring direct-match admin routes with mixed legacy shell fragments when parity remains open
- rejected: accepting `admin/posts` before the extra command/footer control density was reduced closer to the literal v0 row-list shell
- rejected: accepting `admin/posts/[postId]` before the default editor tab/body structure was reduced closer to the literal v0 content subtree

### Post-implementation audit checklist
- [x] admin cutover implementation status explicitly recorded as accepted
- [x] residual admin drift risks recorded
- [x] post-cutover follow-up items recorded

---

## P6 Audit Record — parity lock, cleanup, and stabilization

### Status
- accepted

### Expected scope under audit
- dead code cleanup
- legacy shell removal
- doc updates
- test updates
- post-cutover parity review
- guarded extraction of duplicated literal blocks

### Pre-implementation checklist
- [x] P3 accepted
- [x] P5 accepted
- [x] cleanup candidates identified
- [x] cleanup drift risks documented

### What changed
- added parity and design automation scaffolding for closeout:
  - `.github/workflows/design-parity.yml`
  - `pnpm parity:capture`
  - expanded `scripts/capture-v0-parity.ts` state coverage
- refreshed migration governance to track reject/hold handling, theme integrity, deterministic capture, and verified external profile link rules
- deleted dead legacy public/admin shell files and duplicate runtime artifacts, including the retired `components/site/*`, `components/admin/admin-nav.tsx`, `components/admin/posts-management-shell.tsx`, `components/subscription-module.tsx`, `components/newsletter-manager.tsx`, `components/portfolio-layout.tsx`, and numbered duplicate route files
- updated `tsconfig.json` and `eslint.config.mjs` to remove stale references to deleted files and to ignore transient `test-results/**` / `.tmp/**` artifacts during root linting
- updated core runtime docs to match the shipped runtime after cleanup:
  - `docs/00_system_overview.md`
  - `docs/01_core_architecture.md`
  - `docs/03_server_actions_api.md`
  - `docs/04_frontend_ui_mapping.md`
  - `docs/05_operations_runbook.md`
  - `docs/06_release_checklist.md`
- fixed the test/reference lint dependency drift by adding `eslint-plugin-react-hooks` and `@next/eslint-plugin-next` so `pnpm --dir v0app build` can be used as a stable reference validation step
- completed parity/ops validation on aligned servers:
  - `CURRENT_BASE_URL=http://127.0.0.1:3321 V0_BASE_URL=http://127.0.0.1:3421 pnpm parity:capture`
  - `APP_URL=http://127.0.0.1:3321 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke`
- completed final strict-close validation on the canonical aligned servers:
  - `CURRENT_BASE_URL=http://127.0.0.1:3311 V0_BASE_URL=http://127.0.0.1:3410 pnpm parity:capture`
  - `APP_URL=http://127.0.0.1:3311 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke`
  - `pnpm test:e2e e2e/smoke.spec.ts e2e/admin-posts.spec.ts e2e/admin-settings.spec.ts e2e/admin-community.spec.ts e2e/engagement.spec.ts e2e/media-access.spec.ts e2e/newsletter.spec.ts`
- completed metadata/profile-link closeout:
  - confirmed `app/layout.tsx` remains the sole metadata authority with `metadataBase=https://xistoh.com`
  - confirmed `/knowledge` still returns `308 -> /notes`
  - confirmed `lib/site/profile.ts` remains the verified profile-link source with GitHub verified and LinkedIn intentionally null

### What was reviewed
- migration governance docs against the implemented recovery behavior
- parity artifact directories under `docs/migration/parity/2026-03-27-public/` and `docs/migration/parity/2026-03-27-admin/`
- current CI/workflow coverage for parity, smoke, and route-level regression tests
- root runtime after deleting retired legacy shells and duplicate files
- `v0app` reference build after restoring missing lint plugins
- local theme-integrity QA for `/notes` and `/admin/login`
- dead import / dead component scans for retired public/admin shells
- non-migration docs/runtime scans for stale `/knowledge` references

### Parity checks performed
- [x] parity capture automation now covers the documented public/admin route-state set
- [x] cleanup did not alter public route output
- [x] cleanup did not alter admin route output
- [x] extracted shared pieces are screenshot-equivalent by virtue of no new shared extraction being introduced during closeout
- [x] no `/knowledge` references remain except accepted historical/audit references
- [x] public metadata/canonical closeout is fully verified
- [x] verified external profile links are fully closed or intentionally documented
- [x] local PR-equivalent design CI command path completed successfully and regenerated parity artifacts

### Drift risks found
- no blocking closeout risks remain
- non-blocking local-only QA noise remains:
  - headless Playwright logs WebGL unsupported for the shader panel
  - local `/_vercel/insights/script.js` returns 404 outside the Vercel production host

### Decisions / approvals / rejections
- accepted: begin design CI and parity-closeout preparation before final P3/P5 acceptance
- accepted: close P6 after metadata, parity, and cleanup gates were all verified on aligned production-mode servers
- accepted: remove dead legacy public/admin shells and duplicate runtime files once route ownership is fully on `components/v0/*`
- accepted: treat worker-route `401` during smoke as an environment-alignment issue when the current server is started without the test cron secret; the aligned test-env smoke must pass before recording success

### Post-implementation audit checklist
- [x] cleanup accepted or rejected explicitly
- [x] final parity lock recorded
- [x] final residual risks recorded
- [x] migration closeout status recorded

---

## Open issues / explicit approvals required

Use this section for any implementation conflict that cannot be resolved without an explicit plan update.

- None yet.
