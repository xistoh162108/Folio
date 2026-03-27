# v0 Fidelity Migration Phase Tracker

## Status

- Last updated: 2026-03-27
- Current overall status: P1 through P6 are implemented and accepted; direct-match admin recovery is closed, parity and final QA are complete, and closeout docs/design CI are aligned with the shipped runtime

## Governance rule

This file is the execution tracker for the v0 fidelity migration.

It must be updated when:
- a phase starts
- a phase is blocked
- a phase completes
- scope changes
- cutover gates pass or fail

Canonical references:
- spec: `docs/migration/v0-fidelity-production-migration-spec.md`
- audit log: `docs/migration/v0-audit-log.md`

No phase is complete unless:
- this tracker reflects the final status
- the corresponding audit entry is written and accepted

## Phase summary

| Phase | Title | Status | Blocking dependency |
|---|---|---|---|
| P1 | v0 literal extraction scaffold | done | none |
| P2 | public screen bindings | done | P1 |
| P3 | public atomic cutover + `/knowledge` removal | done | P2 |
| P4 | admin screen bindings | done | P1 |
| P5 | admin atomic cutover | done | P4 |
| P6 | parity lock, cleanup, and post-cutover stabilization | done | P3 + P5 |

---

## P1 — v0 literal extraction scaffold

### Status
- done

### Objective
Create the exact v0-derived production screen layer and shell/effect hosts without adopting routes yet.

### Scope
- add `components/v0/public/*`
- add `components/v0/admin/*`
- add `components/v0/effects/*`
- align runtime shell support in `app/layout.tsx` and `app/globals.css`

### Concrete tasks
- create literal extraction targets for:
  - public home
  - public contact
  - public notes
  - public projects
  - public note detail
  - public project detail
  - public guestbook
  - public subscription result surfaces
  - admin login
  - admin analytics
  - admin manage-posts
  - admin editor
  - admin newsletter
  - admin settings
  - admin community
- create safe first-pass hosts:
  - `components/v0/public/public-shell.tsx`
  - `components/v0/admin/admin-shell.tsx`
  - `components/v0/effects/dithering-panel.tsx`
  - `components/v0/effects/digital-rain-panel.tsx`
  - `components/v0/effects/text-scramble-panel.tsx`
- align global runtime styles only as needed for exact v0 rendering
- do not switch any live routes

### Affected routes/files
- `app/layout.tsx`
- `app/globals.css`
- new `components/v0/public/*`
- new `components/v0/admin/*`
- new `components/v0/effects/*`

### Dependencies
- approved migration spec

### Blockers
- unresolved mismatch between v0 literal classes and current global runtime behavior
- missing effect dependency or incompatible runtime behavior for exact shader/rain/scramble rendering

### Execution notes
- repo-level validation was initially blocked by reference-only `v0app/**` files and numbered legacy duplicates (`app/page 2.tsx`, `app/page 3.tsx`, `components/newsletter-manager 2.tsx`, `lib/email/provider 2.ts`)
- root `tsconfig.json` and `eslint.config.mjs` were updated to exclude those non-runtime artifacts from root validation scope
- public/admin scaffold drift found by comparison agents was corrected inside `components/v0/*` before verification was finalized

### Acceptance criteria
- extracted screen files exist for all target public/admin surfaces
- shells and effect hosts exist
- no live route has switched
- no new abstraction changes v0 output
- audit entry for P1 is written
- `pnpm build`, `pnpm lint`, and `pnpm typecheck` pass after scaffold changes
- `APP_URL=http://127.0.0.1:3100 pnpm ops:smoke` passes against the built app

### Pre-implementation checklist
- [x] spec reviewed
- [x] exact v0 source subtree identified for every target screen
- [x] current shared abstractions marked as non-authoritative

### Parity validation checklist
- [x] shell frame visually matches v0 baseline
- [x] mono font baseline and global spacing behavior match v0
- [x] shader host is visually equivalent
- [x] contact effect hosts are visually equivalent
- [x] notes sticky subscribe footer restored from the literal v0 subtree
- [x] public/admin shell active-state behavior allows non-nav detail/extension screens without forcing a sibling tab active
- [x] admin shell/sidebar and newsletter internals were corrected after agent drift review

### Post-implementation audit checklist
- [x] files created are documented in audit log
- [x] no route adoption occurred
- [x] no synthesized multi-view screen was introduced
- [x] repo-level build, lint, typecheck, and ops smoke outcomes recorded
- [x] status updated here

---

## P2 — public screen bindings

### Status
- done

### Objective
Bind live production data and workflows into the literal public v0 screens without cutting over live public routes yet.

### Scope
- public home
- contact
- notes
- projects
- note/project detail
- guestbook
- subscribe confirm
- unsubscribe

### Concrete tasks
- bind homepage live data from `getHomepagePosts()`
- bind notes/projects to `getPublishedPostsByType()`
- bind detail screens to `getPublishedPostDetail()`
- bind contact to `submitContactMessage`
- bind subscription flows to existing subscriber actions
- bind likes/comments/guestbook to current APIs/actions
- create `app/contact/page.tsx`
- implement real loading/error/empty/result states in v0 language only
- keep current public routes live until P3

### Affected routes/files
- new `app/contact/page.tsx`
- `components/v0/public/*`
- `components/contact-form.tsx`
- `components/subscription-module.tsx`
- `components/site/comments-section.tsx`
- `components/site/guestbook-log.tsx`
- `components/site/post-like-button.tsx`
- `components/site/link-previews.tsx`
- `components/site/asset-gallery.tsx`

### Dependencies
- P1 complete

### Blockers
- real state handling forces non-v0 fallback UI
- data binding requires structural change that would break literal parity

### Execution notes
- added public bound wrappers for home, notes, projects, note detail, project detail, guestbook, confirm-subscription, and unsubscribe surfaces under `components/v0/public/*-bound.tsx`
- added live contact route shell in `app/contact/page.tsx` and bound the contact form to `submitContactMessage`
- wired newsletter subscription behavior into the v0 public subscription module and the notes sticky footer using `requestSubscription`
- wired guestbook submission/moderation to the existing guestbook APIs and kept the public shell language intact
- wired note/project detail data to `getPublishedPostDetail()` and moved live likes/comments/assets/link sections out of the literal base detail screens into bound runtime extensions
- corrected P1/P2 public drift during binding:
  - restored shared contact intensity between the form and digital-rain panel
  - restored fixed notes filter chips from the literal v0 set
  - removed the views-based note status heuristic and synthetic tag-filter fallback; live notes now use real tag membership and a non-fabricated default status glyph
  - restored the notes sticky subscribe footer inline inside `notes-screen.tsx`
  - gave the public shell default route navigation and changed detail back controls to real links
  - replaced the generic live note `dangerouslySetInnerHTML` branch with a v0-specific detail-content renderer that preserves the Tokyo Night code shell and `[y]/[copied]` behavior for real content
  - removed non-literal project detail header metadata and made detail runtime extension chrome theme-aware instead of hardcoded dark-mode markup
- verified runtime integrity with `pnpm lint`, `pnpm typecheck`, `pnpm build`, `APP_URL=http://127.0.0.1:3100 pnpm ops:smoke`, and direct `GET /contact`, `GET /notes`, `GET /projects` 200 checks against `next start`
- the new `/contact` route exists for branch-level binding validation, but it does not count as public cutover acceptance; public sibling-route consistency is still gated to P3

### Acceptance criteria
- all public literal screens are data-bound
- all required public workflows function against real backend behavior
- no live public route has switched yet
- audit entry for P2 is written

### Pre-implementation checklist
- [x] public route-to-v0 subtree mapping reconfirmed
- [x] each public screen has identified live data/action inputs
- [x] `/knowledge` is excluded from any new screen creation

### Parity validation checklist
- [x] real data did not change v0 structure
- [x] loading/error/empty/result states use v0 language only
- [x] contact form still looks exactly like v0
- [x] note/project detail still match v0 framing under live content after runtime sections were moved out of the literal base screens

### Post-implementation audit checklist
- [x] all bindings logged in audit file
- [x] fallback UI reviewed and accepted/rejected
- [x] no public cutover happened early
- [x] status updated here

---

## P3 — public atomic cutover + `/knowledge` removal

### Status
- done

### Objective
Switch the full public group to the v0 public shell in one cutover and remove `/knowledge` from product scope.

### Scope
- `/`
- `/contact`
- `/notes`
- `/notes/[slug]`
- `/projects`
- `/projects/[slug]`
- `/guestbook`
- `/subscribe/confirm`
- `/unsubscribe`
- `/knowledge` removal
- redirect and link cleanup

### Concrete tasks
- switch all public routes to the v0 public shell together
- delete `app/knowledge/page.tsx`
- remove `getPublishedKnowledgePosts()` from `lib/data/posts.ts`
- add permanent redirect `/knowledge -> /notes`
- replace homepage and nav references to `/knowledge`
- remove "unified knowledge" copy
- update `e2e/smoke.spec.ts`
- audit docs and internal links for `/knowledge`

### Affected routes/files
- `app/page.tsx`
- `app/contact/page.tsx`
- `app/notes/page.tsx`
- `app/notes/[slug]/page.tsx`
- `app/projects/page.tsx`
- `app/projects/[slug]/page.tsx`
- `app/guestbook/page.tsx`
- `app/subscribe/confirm/page.tsx`
- `app/unsubscribe/page.tsx`
- `app/knowledge/page.tsx`
- `components/site/site-header.tsx`
- `lib/data/posts.ts`
- `next.config.mjs`
- `e2e/smoke.spec.ts`

### Dependencies
- P2 complete

### Blockers
- none

### Acceptance criteria
- every public sibling route uses the same v0 public shell
- `/knowledge` no longer exists as a live route
- `/knowledge` permanently redirects to `/notes`
- no legacy public shell remains
- audit entry for P3 is accepted

### Execution notes
- switched the full live public route group to `components/v0/public/*`:
  - `/`
  - `/contact`
  - `/notes`
  - `/notes/[slug]`
  - `/projects`
  - `/projects/[slug]`
  - `/guestbook`
  - `/subscribe/confirm`
  - `/unsubscribe`
- deleted `app/knowledge/page.tsx`
- removed `getPublishedKnowledgePosts()` from `lib/data/posts.ts`
- added permanent redirect `/knowledge -> /notes` in `next.config.mjs`
- updated stale runtime navigation in `components/site/site-header.tsx`
- updated documentation surfaces tied to the public IA:
  - `docs/00_system_overview.md`
  - `docs/01_core_architecture.md`
  - `docs/04_frontend_ui_mapping.md`
  - `docs/06_release_checklist.md`
- updated `e2e/smoke.spec.ts` to validate the new IA and to self-seed a published detail route for comment-flow smoke coverage
- completed a DB-backed `/knowledge` content audit against `Post`, `PostRevision`, and `NewsletterCampaign`; no persisted matches remained in live HTML/text fields or JSON content casts at review time
- changed `scripts/start-e2e-server.ts` from `next dev` to production `next build` + `next start` so Playwright validates the same build artifact as the cutover target
- repaired the `v0app` reference build by closing an unbalanced admin overview wrapper in `v0app/app/page.tsx`, which removed the blocker that had prevented screenshot parity capture
- generated the full public route/state artifact set under `docs/migration/parity/2026-03-27-public/`, including note detail, project detail, guestbook, confirm, and unsubscribe surfaces
- manually reviewed the direct-reference public capture pairs and accepted the shipped public shell as v0-faithful with production-only runtime extensions kept inside the same public language
- manually spot-checked the public capture pairs and fixed the most visible runtime drift found during review: `/projects` now renders `[ NO_PUBLISHED_PROJECTS ]` instead of degrading to a blank list surface when live data is empty
- addressed follow-up public drift found during P3 verification:
  - restored external project link rows on `/projects`
  - converted detail comments toward terminal-row rendering
  - removed standalone bordered-card framing from confirm/unsubscribe result surfaces
  - changed the guestbook writer to a single-line terminal input
  - made note/project footer actions live for share/copy-link
  - removed dead GitHub placeholder links and replaced unknown LinkedIn links with honest non-clickable text
- added explicit terminal empty states for `/notes` and `/projects` so no public index route falls back to a blank surface when live data is absent
- subagent P1/P2 audit confirmed the public cutover happened in code and that `/knowledge` removal/redirect and domain rules were respected
- a later QA pass completed the missing detail/guestbook/result captures on a test-env current server and closed the public screenshot evidence gap

### Pre-implementation checklist
- [x] public bindings complete
- [x] `/knowledge` impact analysis reviewed
- [x] redirect target confirmed as `/notes`
- [x] test plan updated for `/knowledge` removal

### Parity validation checklist
- [x] screenshot parity reviewed against v0 reference states
- [x] full sibling-route consistency confirmed
- [x] no legacy shell remains in the public cutover group
- [x] no non-v0 fallback UI remains at the code/runtime level after the P3 drift pass
- [x] redirect/link/canonical changes verified
- [x] `pnpm lint` passed
- [x] `pnpm typecheck` passed
- [x] `pnpm build` passed
- [x] `CURRENT_BASE_URL=http://127.0.0.1:3321 V0_BASE_URL=http://127.0.0.1:3421 pnpm parity:capture` passed with the full public route/state set
- [x] `pnpm test:e2e e2e/smoke.spec.ts` passed
- [x] `APP_URL=http://127.0.0.1:3300 pnpm ops:smoke` passed
- [x] `APP_URL=http://127.0.0.1:3321 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke` passed against the aligned test-env parity server
- [x] `curl -I /knowledge` returned `308` with `location: /notes`

### Post-implementation audit checklist
- [x] route cutover recorded in audit log
- [x] `/knowledge` removal recorded in audit log
- [x] docs/internal-link findings recorded
- [x] final public parity acceptance recorded in audit log
- [x] status updated here

---

## P4 — admin screen bindings

### Status
- done

### Objective
Bind real admin data, auth, editor, newsletter, settings, and moderation workflows into literal admin v0 screens without cutting over live admin routes yet.

### Scope
- admin login
- analytics
- posts list
- post editor
- newsletter
- settings
- community moderation

### Concrete tasks
- bind admin analytics to current dashboard loaders
- bind admin posts list to current query/filter/pagination behavior
- bind editor to draft/save/archive/upload/link workflows
- bind newsletter to create/test/start/retry/delivery flows
- bind settings to readiness payload
- bind community to moderation actions
- preserve auth boundary behavior
- keep all rendering inside exact v0 admin language

### Affected routes/files
- `components/v0/admin/*`
- `components/admin/post-editor.tsx`
- `components/admin/tiptap-editor.tsx`
- `components/newsletter-manager.tsx`
- `app/admin/login/page.tsx`
- `app/(dashboard)/admin/*`

### Dependencies
- P1 complete

### Blockers
- live admin workflow requires new UI that cannot be expressed in v0 language
- editor/newsletter state introduces non-v0 fallback shells

### Execution notes
- added bound admin screen entry points:
  - `components/v0/admin/login-screen-bound.tsx`
  - `components/v0/admin/analytics-screen-bound.tsx`
  - `components/v0/admin/manage-posts-screen-bound.tsx`
  - `components/v0/admin/editor-screen-bound.tsx`
  - `components/v0/admin/newsletter-screen-bound.tsx`
  - `components/v0/admin/settings-screen-bound.tsx`
  - `components/v0/admin/community-screen-bound.tsx`
- rewired `components/v0/admin/analytics-screen.tsx` from fixtures to `getAnalyticsDashboardSummary()` via a bound wrapper
- rewrote `components/v0/admin/manage-posts-screen.tsx` to render real search/filter/pagination/query data from `getAdminPosts()` in v0 row language instead of fixture drag-delete rows
- realigned `components/v0/admin/settings-screen.tsx` back toward the literal v0 profile/CV editor structure while binding `getAdminReadinessDashboard()` inside that shell as read-only runtime data
- rewrote `components/v0/admin/community-screen.tsx` to render live moderation rows and real delete forms for comments and guestbook entries
- rewired `components/v0/admin/newsletter-screen.tsx` and replaced `components/v0/admin/newsletter-manager.tsx` with a real action/data-bound v0 manager using:
  - `getNewsletterDashboardData()`
  - `createCampaign()`
  - `startCampaign()`
  - `sendTestCampaign()`
  - `retryDelivery()`
- extended newsletter dashboard data with a read-only subscriber snapshot so the literal subscribers tab can bind to real data
- wrapped the existing live post editing logic in `components/v0/admin/editor-screen.tsx` and added a `v0` variant to:
  - `components/admin/post-editor.tsx`
  - `components/admin/tiptap-editor.tsx`
- normalized admin v0 scaffold defaults to the production brand label `xistoh.log`
- added shared cookie-backed v0 theme state for both public and admin v0 shells via `xistoh-v0-theme`, then validated dark/light rendering and live browser toggle behavior against the public runtime
- removed remaining rounded CMS chrome from the `v0` editor path by flattening TipTap code-block output and cover-image preview framing
- P4 binding work was completed before live route adoption; P5 now owns the route-entry cutover and runtime QA

### Acceptance criteria
- all admin literal screens are data-bound
- admin auth and mutations still work
- no live admin route had switched at P4 completion
- audit entry for P4 is written

### Pre-implementation checklist
- [x] admin route-to-v0 subtree mapping reconfirmed
- [x] auth boundary behavior documented
- [x] editor/newsletter live-state requirements reviewed

### Parity validation checklist
- [x] admin data binding did not change v0 structure
- [x] editor/upload states still render in v0 language
- [x] newsletter states still render in v0 language
- [x] settings/community do not introduce dashboard-card fallback

### Post-implementation audit checklist
- [x] bindings recorded in audit log
- [x] fallback UI decisions recorded
- [x] no admin cutover had happened at P4 completion
- [x] status updated here

---

## P5 — admin atomic cutover

### Status
- done

### Objective
Switch the full admin group to the v0 admin shell in one cutover.

### Scope
- `/admin/login`
- `/admin/analytics`
- `/admin/posts`
- `/admin/posts/[postId]`
- `/admin/newsletter`
- `/admin/settings`
- `/admin/community`

### Concrete tasks
- switch all admin routes to the v0 admin shell together
- remove all remaining legacy admin shell usage
- verify auth redirects and admin navigation behavior
- verify editor, newsletter, settings, and moderation under live routes

### Affected routes/files
- `app/admin/login/page.tsx`
- `app/(dashboard)/admin/layout.tsx`
- `app/(dashboard)/admin/analytics/page.tsx`
- `app/(dashboard)/admin/posts/page.tsx`
- `app/(dashboard)/admin/posts/[postId]/page.tsx`
- `app/(dashboard)/admin/newsletter/page.tsx`
- `app/(dashboard)/admin/settings/page.tsx`
- `app/(dashboard)/admin/community/page.tsx`

### Dependencies
- P4 complete
- P5 cutover gate passed

### Blockers
- none

### Acceptance criteria
- every admin sibling route uses the same v0 admin shell
- no legacy admin shell remains
- auth boundary behavior is correct
- audit entry for P5 is accepted
- no direct-match admin route remains in reject or hold status

### Execution notes
- switched the live admin route group to `components/v0/admin/*-bound.tsx`:
  - `/admin/login`
  - `/admin/analytics`
  - `/admin/posts`
  - `/admin/posts/[postId]`
  - `/admin/newsletter`
  - `/admin/settings`
  - `/admin/community`
- removed the legacy admin shell wrapper from `app/(dashboard)/admin/layout.tsx` so live routes now own their v0 shell directly
- updated `/admin` to redirect to `/admin/analytics`
- changed the admin shell section mapping so `[+] New Content` routes through `/admin/content`
- changed `app/(dashboard)/admin/content/page.tsx` to create a draft and redirect into the live editor route
- added admin-group fallback surfaces:
  - `app/(dashboard)/admin/loading.tsx`
  - `app/(dashboard)/admin/error.tsx`
  - `app/(dashboard)/admin/not-found.tsx`
- added a documented `Community` sidebar extension in the v0 admin shell so the live moderation route is reachable and active-state aware
- reconciled P1-P4 QA drift from subagent review:
  - brought tracker/audit status back in sync with the fact that live admin routes are already on the v0 layer
  - updated admin/community/posts/settings/newsletter/engagement/media-access Playwright expectations to the canonical v0 output instead of the retired legacy UI
  - allowed the local production test harness to use the test email driver so newsletter and subscription flows can be validated against the outbox during `next start`
- inherited the repaired `v0app` reference build from the P3 parity work
- fixed `scripts/capture-v0-parity.ts` so public/admin artifact output is separated correctly, current admin capture waits on stable screen markers, and current login/content/community screenshots are emitted as part of the admin set
- regenerated the admin parity artifact set under `docs/migration/parity/2026-03-27-admin/` against a production build running with test URLs aligned to the capture port
- implemented shared server/client v0 theme control so public/admin/login toggles update in place, persist to the `xistoh-v0-theme` cookie, and render the initial SSR theme directly on `<html>` and `<body>`
- normalized `savePost()` validation failures to terminal-friendly messages so the editor validation state renders `[Title is required]` instead of raw Zod JSON
- compressed `components/v0/admin/manage-posts-screen.tsx` into a single inline command row plus footer/status row, keeping search/filter/count/pagination inside v0 row language instead of dashboard blocks
- moved production-only editor support fields in `components/admin/post-editor.tsx` below the primary v0 hierarchy and into collapsed support blocks so title/toggle/upload/tabs/body/tags/actions remain the layout owner path
- added `.github/workflows/design-parity.yml` and the `pnpm parity:capture` script so parity capture, smoke checks, and the required E2E subset are now tracked in CI
- regenerated admin parity captures after the latest manage-posts/editor recovery pass, including the required direct-match route states for search/filter/pagination and toggle/upload/error/publish readiness
- realigned `/admin/settings` closer to the literal v0 shell after parity review showed the prior readiness-only layout had drifted too far from the direct v0 subtree
- updated `e2e/admin-settings.spec.ts` so readiness assertions match the read-only v0-shell fields exposed by the corrected settings surface
- changed the v0 editor recovery so status transitions are owned by the primary actions (`Save Draft`, `Publish`, `Archive`) and the `[meta]` block now exposes a read-only state line instead of a conflicting status selector
- updated `e2e/media-access.spec.ts` to validate published/archive file access through the canonical primary actions and updated `e2e/admin-posts.spec.ts` to reveal `[meta]` before editing `Slug`
- added missing reference-build lint plugins (`eslint-plugin-react-hooks`, `@next/eslint-plugin-next`) so `pnpm --dir v0app build` runs without plugin-resolution errors
- completed the final direct-match recovery pass:
  - reduced `components/v0/admin/manage-posts-screen.tsx` to the lighter command-row + footer-row control model and removed extra row density such as the views badge and page-number block
  - moved project URL editing and preview-card handling into the primary v0 hierarchy inside `components/admin/post-editor.tsx`
  - reduced `components/admin/tiptap-editor.tsx` to the literal v0 toolbar set (`B`, `I`, `U`, `H1`, `H2`, `link`, `list`, `code`) and a `h-64` editor surface for the v0 variant
  - pinned `color-scheme` on `<html>` and `<body>` in `app/layout.tsx` so the SSR theme matches persisted state
- regenerated the admin direct-match artifact set on the aligned test-env current server and completed the final accept/reject review
- closed the former hold routes:
  - `admin/posts` accepted against the literal `manage-posts` subtree
  - `admin/posts/[postId]` accepted against the literal `content` subtree

### Pre-implementation checklist
- [x] admin bindings complete
- [x] auth boundary behavior verified off-route
- [x] editor/newsletter/settings/community live states reviewed

### Parity validation checklist
- [x] screenshot parity reviewed against v0 reference states
- [x] full sibling-route consistency confirmed
- [x] no legacy shell remains in the admin cutover group
- [x] no non-v0 fallback UI remains at the code/runtime level after the P5 drift pass
- [x] redirect/link/canonical changes verified where applicable
- [x] in-place theme toggle behavior replaced the earlier refresh-based implementation across public/admin/login surfaces
- [x] direct-match `admin/posts` state set captured for default, search active, filtered, empty result, and paginated states
- [x] direct-match `admin/posts/[postId]` state set captured for default, project toggle, publish-ready, validation error, and upload-pending states
- [x] `pnpm parity:capture` passed against the regenerated current/reference admin set
- [x] `pnpm lint` passed
- [x] `pnpm typecheck` passed
- [x] `pnpm build` passed
- [x] `pnpm --dir v0app build` passed without missing-plugin lint errors
- [x] `pnpm test:e2e e2e/smoke.spec.ts e2e/admin-posts.spec.ts e2e/admin-settings.spec.ts e2e/admin-community.spec.ts e2e/engagement.spec.ts` passed after aligning the admin-posts test to the canonical v0 control model
- [x] `pnpm test:e2e e2e/media-access.spec.ts e2e/newsletter.spec.ts` passed after aligning status control to the canonical primary-action flow
- [x] `APP_URL=http://127.0.0.1:3300 pnpm ops:smoke` passed
- [x] `/admin/analytics` redirected to `/admin/login` when unauthenticated
- [x] regenerated admin parity captures on a production server with aligned test URLs and manually reviewed the direct-reference admin pairs
- [x] `pnpm test:e2e e2e/admin-settings.spec.ts` passed after the settings-shell selector update
- [x] `APP_URL=http://127.0.0.1:3313 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke` passed against the parity-capture server
- [x] `APP_URL=http://127.0.0.1:3321 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke` passed against the aligned test-env current server
- [x] `CURRENT_BASE_URL=http://127.0.0.1:3311 V0_BASE_URL=http://127.0.0.1:3410 pnpm parity:capture` passed against the final current/reference admin set
- [x] theme integrity QA passed for public/admin/login without URL reload and without hydration errors during the Playwright browser check

### Post-implementation audit checklist
- [x] route cutover recorded in audit log
- [x] implementation status and final acceptance explicitly recorded in audit log
- [x] residual drift risks recorded
- [x] status updated here

---

## P6 — parity lock, cleanup, and post-cutover stabilization

### Status
- done

### Objective
Lock parity, remove dead code, update docs, and stabilize the post-cutover system without introducing refactor drift.

### Scope
- dead route/component cleanup
- legacy shell removal
- doc updates
- test updates
- post-cutover parity review
- cautious shared extraction only if output stays identical

### Concrete tasks
- remove dead imports and obsolete shell components
- update core docs to reflect final public IA and shell structure
- update release checklist and smoke expectations
- run full parity review across public and admin groups
- only after parity lock, extract repeated literal fragments that are proven identical
- record all accepted/rejected cleanup decisions

### Affected routes/files
- legacy public/admin shell components
- stale docs under `docs/`
- stale tests under `e2e/`
- migration governance docs under `docs/migration/`

### Dependencies
- P3 and P5 final acceptance complete

### Blockers
- none

### Acceptance criteria
- no dead `/knowledge` references remain
- no legacy shell remains in active runtime
- docs match shipped runtime
- parity review completed after cleanup
- audit entry for P6 is accepted
- design CI is active for parity capture, smoke, and the required E2E subset
- public metadata/canonical state matches the shipped IA

### Pre-implementation checklist
- [x] P5 accepted
- [x] dead-code candidates identified
- [x] cleanup risk list prepared

### Execution notes
- reran the full strict-close validation stack on aligned production-mode servers:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm --dir v0app build`
  - `CURRENT_BASE_URL=http://127.0.0.1:3311 V0_BASE_URL=http://127.0.0.1:3410 pnpm parity:capture`
  - `APP_URL=http://127.0.0.1:3311 CRON_SECRET=codex-test-cron-secret pnpm ops:smoke`
  - `pnpm test:e2e e2e/smoke.spec.ts e2e/admin-posts.spec.ts e2e/admin-settings.spec.ts e2e/admin-community.spec.ts e2e/engagement.spec.ts e2e/media-access.spec.ts e2e/newsletter.spec.ts`
- reran local theme-integrity QA and confirmed in-place theme flips on `/notes` and `/admin/login` without URL reload
- completed the dead import and dead component scan for retired public/admin shells; only historical references remain inside migration docs/audit history
- verified metadata/profile-link closeout:
  - `app/layout.tsx` remains the sole metadata authority with `metadataBase=https://xistoh.com`
  - `/knowledge` still returns `308 -> /notes`
  - non-migration docs only retain intentional `/knowledge` closeout references
  - `lib/site/profile.ts` remains the verified profile-link source with GitHub verified and LinkedIn intentionally null
- recorded the remaining non-blocking local-only QA noise:
  - headless Playwright logs WebGL unsupported for the shader panel
  - local `_vercel/insights/script.js` returns 404 outside the Vercel production host

### Parity validation checklist
- [x] cleanup did not change route output at the public/admin group level, based on rebuilds, E2E coverage, ops smoke, and regenerated parity artifacts
- [x] extracted shared pieces are screenshot-equivalent by virtue of no new shared extraction being introduced during closeout
- [x] no documentation/runtime mismatch remains for shipped public/admin/runtime behavior
- [x] `/knowledge` redirect and canonical cleanup are fully verified in metadata and docs
- [x] verified external profile links rule is resolved or intentionally documented for all profile links

### Post-implementation audit checklist
- [x] cleanup decisions recorded
- [x] dead-code removals recorded
- [x] final parity lock recorded
- [x] final status updated here
