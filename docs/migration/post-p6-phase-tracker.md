# Post-P6 Exact-v0 Enhancement Phase Tracker

## Status

- Last updated: 2026-03-28
- Current overall status: E1 through E8 complete

## Governance rule

This file is the execution tracker for the post-P6 exact-v0 enhancement phase.

It must be updated when:
- a phase starts
- a phase is blocked
- a phase completes
- scope changes
- parity gates pass or fail
- a route enters or leaves hold status

Canonical references:
- spec: `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- schema/compatibility: `docs/migration/post-p6-schema-compatibility-plan.md`
- route ownership: `docs/migration/post-p6-route-ownership-plan.md`
- audit log: `docs/migration/post-p6-audit-log.md`

No phase is complete unless:
- this tracker reflects the final status
- the corresponding audit entry is written and accepted

## Phase summary

| Phase | Title | Status | Blocking dependency |
|---|---|---|---|
| E1 | Governance lock and baseline inventory | done | none |
| E2 | Schema and compatibility foundation | done | E1 |
| E3 | Shared app-shell runtime | done | E1 |
| E4 | Contact/guestbook integration + baseline system | done | E3 |
| E5 | Markdown-first editor and block writer | done | E2 + E3 |
| E6 | Reader rollout for block content | done | E2 + E5 |
| E7 | Profile/CV runtime rollout | done | E2 + E3 |
| E8 | SEO and final enhancement parity lock | done | E4 + E6 + E7 |

---

## E1 — Governance lock and baseline inventory

### Status
- done

### Objective
Create the canonical document set and record the repository baseline for post-P6 exact-v0 enhancement work.

### Scope
- canonical enhancement governance docs
- baseline inventory
- locked defaults
- initial QA scope

### Concrete tasks
- create:
  - `docs/migration/post-p6-exact-v0-enhancement-spec.md`
  - `docs/migration/post-p6-schema-compatibility-plan.md`
  - `docs/migration/post-p6-route-ownership-plan.md`
  - `docs/migration/post-p6-phase-tracker.md`
  - `docs/migration/post-p6-audit-log.md`
- inventory residual `Jimin Bag` references
- inventory current route/effect/editor/profile/SEO ownership
- record locked defaults for:
  - `/guestbook` anchored reuse
  - single live profile source
  - persistent Jitter ownership
  - Markdown-first editor

### Affected routes/files
- `docs/migration/*`
- baseline references in:
  - `lib/site/profile.ts`
  - `app/layout.tsx`
  - `components/v0/public/*`
  - `components/v0/admin/*`
  - `prisma/schema.prisma`

### Dependencies
- P6 complete

### Blockers
- none

### Acceptance criteria
- five canonical docs exist
- baseline findings are recorded
- locked defaults are recorded
- open decisions count is zero
- audit entry for E1 is accepted

### Pre-implementation checklist
- [x] P6 baseline confirmed
- [x] repo truth explored before writing docs
- [x] locked product defaults selected

### Parity validation checklist
- [x] governance docs preserve strict v0 identity as the highest rule
- [x] schema/route ownership plans reflect current repo truth
- [x] tracker and audit are aligned

### Post-implementation audit checklist
- [x] created documents are logged in audit
- [x] baseline inventory is logged in audit
- [x] status updated here

---

## E2 — Schema and compatibility foundation

### Status
- done

### Objective
Introduce schema and compatibility scaffolding for Markdown-first authoring, block content, and structured profile data without breaking current runtime reads.

### Scope
- Prisma schema
- contracts
- readers/writers compatibility
- migration path

### Concrete tasks
- add `markdownSource` to `Post` and `PostRevision`
- define canonical block document contract
- add structured profile tables and `sortOrder`
- add mixed old/new content read logic
- add bootstrap rule for DB profile fallback
- document migration sequence and compatibility guarantees

### Affected routes/files
- `prisma/schema.prisma`
- `lib/contracts/posts.ts`
- `lib/data/posts.ts`
- `lib/actions/post.actions.ts`
- `lib/contracts/profile.ts`
- `lib/profile/bootstrap.ts`
- `lib/data/profile.ts`

### Dependencies
- E1 complete

### Blockers
- none for E2 close; provider-specific preview metadata extension remains deferred beyond E2

### Execution notes
- added `markdownSource` to `Post` and `PostRevision` in `prisma/schema.prisma`
- added migration `20260327230000_add_post_p6_schema_foundation`
- added structured profile schema foundation:
  - `Profile`
  - `ProfileEducation`
  - `ProfileExperience`
  - `ProfileAward`
  - `ProfileLink`
- added block-content compatibility contracts in `lib/contracts/content-blocks.ts`
- added `lib/content/post-content.ts` with explicit compatibility mode selection for legacy and canonical block documents
- extended `lib/contracts/posts.ts`, `lib/data/posts.ts`, and `lib/actions/post.actions.ts` to carry `markdownSource`, `contentVersion`, and `contentMode` as compatibility-safe foundation fields
- added profile bootstrap foundation in:
  - `lib/contracts/profile.ts`
  - `lib/profile/bootstrap.ts`
  - `lib/data/profile.ts`
- updated `prisma/seed.ts` so the primary profile row can be bootstrapped from the static profile source
- updated `prisma/seed.ts` so reseeding also re-syncs nested education, experience, award, and link rows
- updated `scripts/test-db.ts` to include the new profile tables in test database resets
- completed the static/source-side global correction from `Jimin Bag` to `Jimin Park` in:
  - `lib/site/profile.ts`
  - `e2e/smoke.spec.ts`
  - `scripts/capture-v0-parity.ts`
- validated schema deployment with `pnpm test:db:prepare`

### Acceptance criteria
- mixed old/new content is readable
- no big-bang rewrite is required
- profile DB bootstrap is possible
- schema and compatibility rules are documented and tested
- audit entry for E2 is accepted
- `pnpm db:generate`, `pnpm db:validate`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass
- targeted compatibility tests pass
- smoke E2E passes after the `Jimin Park` correction

### Pre-implementation checklist
- [x] schema/compatibility plan reviewed
- [x] legacy reader behavior captured
- [x] profile bootstrap strategy documented

### Parity validation checklist
- [x] legacy content still renders
- [x] new content contract stays compatible with v0 reader design
- [x] no forced content rewrite path exists
- [x] `Jimin Park` correction is reflected in the current static profile source and baseline smoke/parity assertions

### Post-implementation audit checklist
- [x] schema changes logged
- [x] compatibility decisions logged
- [x] test coverage logged
- [x] status updated here

---

## E3 — Shared app-shell runtime

### Status
- done

### Objective
Introduce the shared runtime foundation that owns persistent Jitter, theme integrity, right-panel continuity, and the centralized transition contract.

### Scope
- shared app-shell runtime
- centralized transition ownership contract
- persistent Jitter engine
- theme integrity root behavior

### Concrete tasks
- add shared runtime above public/admin shells
- move right-panel ownership out of route pages
- add route descriptor contract for Jitter modes
- add continuity-safe runtime ownership for future transition choreography
- preserve no-FOUC and no-hydration-mismatch theme behavior

### Affected routes/files
- `app/layout.tsx`
- shared runtime files to be introduced under `components/v0/`
- `components/v0/public/public-shell.tsx`
- `components/v0/admin/admin-shell.tsx`

### Dependencies
- E1 complete

### Blockers
- none

### Execution notes
- added `components/v0/runtime/v0-experience-runtime.tsx` as the shared runtime root
- wrapped app body content with the shared runtime in `app/layout.tsx`
- moved theme ownership to the runtime root while preserving `useV0ThemeController` compatibility
- updated `components/v0/public/public-shell.tsx` and `components/v0/admin/admin-shell.tsx` to:
  - reserve a right-panel slot
  - measure the slot frame
  - register route descriptors with the shared runtime
- updated `/admin/login` to use the shared runtime through an admin-access surface
- updated the shared runtime handoff so the active panel stays mounted until the next shell registration arrives
- added fallback admin runtime continuity for loading/error/not-found surfaces
- removed route-local right-panel effect ownership from:
  - `components/v0/public/home-screen.tsx`
  - `components/v0/public/notes-screen.tsx`
  - `components/v0/public/projects-screen.tsx`
  - `components/v0/public/contact-screen.tsx`
  - `components/v0/admin/analytics-screen.tsx`
  - `components/v0/admin/newsletter-screen.tsx`
  - `components/v0/admin/login-screen.tsx`
- added explicit route descriptors for null-nav public routes:
  - note detail
  - project detail
  - guestbook
  - subscription result surfaces

### Acceptance criteria
- Jitter mounts once
- route navigation does not remount the visual engine
- no FOUC
- no hydration mismatch
- no admin fallback surface drops the right panel
- audit entry for E3 is accepted

### Pre-implementation checklist
- [x] route ownership plan reviewed
- [x] current route-local effect ownership inventoried
- [x] theme integrity baseline captured

### Parity validation checklist
- [x] no abrupt right-panel remount feeling
- [x] right-panel continuity preserved across public/admin nav
- [x] admin right panel exists on every admin surface

### Post-implementation audit checklist
- [x] ownership changes logged
- [x] parity evidence logged
- [x] hold/reject routes recorded if any
- [x] status updated here

---

## E4 — Contact/guestbook integration + baseline system

### Status
- done

### Objective
Integrate guestbook into contact and fix the control/baseline system globally without redesigning the UI.

### Scope
- `/contact`
- `/guestbook`
- global control height / line-height tokens
- audited form surfaces

### Concrete tasks
- place guestbook below the contact form
- make `/guestbook` an anchored reuse of `/contact`
- implement shared baseline/control tokens
- audit newsletter, notes footer, contact, editor, and settings rows

### Affected routes/files
- `app/contact/page.tsx`
- `app/guestbook/page.tsx`
- `components/v0/public/contact-screen.tsx`
- `components/v0/public/guestbook-screen.tsx`
- relevant form/control CSS and shared control components

### Dependencies
- E3 complete

### Blockers
- none

### Execution notes
- updated `app/contact/page.tsx` to bind guestbook/session data into the contact route
- reused the same integrated composition for `/guestbook` by routing `components/v0/public/guestbook-screen.tsx` through `components/v0/public/contact-screen.tsx`
- added `components/v0/public/guestbook-terminal-panel.tsx` as a terminal/log extension block under the existing contact composition
- introduced shared control-height and line-height tokens in `app/globals.css`
- applied baseline tokens across the audited E4 surfaces:
  - `components/v0/public/contact-terminal-form.tsx`
  - `components/v0/public/notes-screen.tsx`
  - `components/v0/admin/newsletter-manager.tsx`
  - `components/v0/admin/settings-screen.tsx`
  - `components/admin/post-editor.tsx`
  - `components/admin/tiptap-editor.tsx`
- added focused parity/regression coverage in `e2e/contact-guestbook.spec.ts`

### Acceptance criteria
- `/contact` and `/guestbook` share the same composition
- guestbook feels like a terminal/log extension, not a separate feed
- global baseline fixes propagate across audited forms
- audit entry for E4 is accepted

### Pre-implementation checklist
- [x] contact and guestbook baseline captured
- [x] anchored reuse rule documented in route ownership plan
- [x] baseline audit target list confirmed

### Parity validation checklist
- [x] no card/feed UI introduced
- [x] text/input/button share one baseline grid
- [x] no arbitrary padding-only fixes remain in audited surfaces

### Post-implementation audit checklist
- [x] integration changes logged
- [x] baseline fixes logged
- [x] route parity evidence logged
- [x] status updated here

---

## E5 — Markdown-first editor and block writer

### Status
- done

### Objective
Replace the current TipTap-first experience with a Markdown-first authoring system inside the v0 editor shell.

### Scope
- `/admin/posts/[postId]`
- editor contracts
- writer pipeline

### Concrete tasks
- add Markdown-first authoring surface
- support live formatting while typing
- support inline and block LaTeX
- write canonical block JSON plus derived HTML
- support inline image/embed insertion without leaving the v0 shell

### Affected routes/files
- `components/v0/admin/editor-screen.tsx`
- `components/admin/post-editor.tsx`
- `components/admin/tiptap-editor.tsx`
- post contracts/actions

### Dependencies
- E2 complete
- E3 complete

### Blockers
- none

### Execution notes
- added `lib/content/markdown-blocks.ts` to normalize Markdown into canonical block content and derived HTML
- added `components/admin/v0-markdown-editor.tsx` as the Markdown-first live authoring surface for the v0 editor route
- updated `components/admin/post-editor.tsx` so the v0 editor path writes:
  - `markdownSource`
  - canonical block `content`
  - derived `htmlContent`
  - block-schema `contentVersion`
- kept `components/admin/tiptap-editor.tsx` only as a non-v0/default compatibility path
- added snippet insertion for:
  - headings
  - quotes
  - lists
  - code fences
  - math fences
  - rules
  - inline asset/link insertion into the Markdown body
- updated post writer/read helpers in:
  - `lib/actions/post.actions.ts`
  - `lib/data/posts.ts`
  - `lib/content/draft-state.ts`
- added unit coverage for Markdown normalization and block-writer compatibility in:
  - `tests/unit/markdown-blocks.test.ts`
  - `tests/unit/draft-state.test.ts`
- updated `e2e/admin-posts.spec.ts` to assert the Markdown-first writer path
- closed E2-E4 QA follow-up findings that were safe to fix during E5:
  - shared runtime no longer blanks the right panel during pathname handoff
  - admin loading/error/not-found now keep a fallback right-panel descriptor
  - contact/guestbook life-mode descriptors now transform from the current dither variant instead of hard-coding `home`
  - guestbook width rhythm now matches the contact composition column more closely
  - notes footer toggle controls now use a shared token-backed micro-control class
  - newsletter HTML editing now uses the shared control-area baseline token
  - contact form restored exact literal v0 field/button metrics instead of over-normalized shared control sizing

### Acceptance criteria
- Markdown-first UX is live
- no separate preview mode exists
- LaTeX works
- writer outputs canonical block content
- audit entry for E5 is accepted
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass
- focused unit and E2E coverage for the new writer path pass

### Pre-implementation checklist
- [x] legacy editor behavior inventoried
- [x] block writer contract finalized
- [x] image/embed insertion behavior defined

### Parity validation checklist
- [x] editor remains inside the v0 shell
- [x] no SaaS editor chrome appears
- [x] authoring flow stays dense and terminal-like
- [x] contact-form metric regressions introduced during E4 follow-up were removed before E5 close
- [x] E2-E4 QA follow-up findings were triaged into fixed vs residual-risk categories

### Post-implementation audit checklist
- [x] editor changes logged
- [x] writer changes logged
- [x] route parity review logged
- [x] status updated here

---

## E6 — Reader rollout for block content

### Status
- done

### Objective
Roll out the new block reader for note/project detail screens while keeping legacy content readable during migration.

### Scope
- note detail
- project detail
- block renderer
- mixed-content validation

### Concrete tasks
- build v0-faithful block reader
- render image blocks with captions
- render embeds in v0 reading language
- keep legacy read path for non-migrated posts
- verify mixed old/new detail rendering

### Affected routes/files
- `app/notes/[slug]/page.tsx`
- `app/projects/[slug]/page.tsx`
- `components/v0/public/detail-content.tsx`
- post readers and detail mappers

### Dependencies
- E2 complete
- E5 complete

### Blockers
- none

### Execution notes
- replaced `components/v0/public/detail-content.tsx` with a canonical block-aware detail renderer that:
  - prefers canonical block documents
  - falls back to legacy structured content
  - falls back to stored HTML only when neither richer path exists
- added block rendering for:
  - headings
  - paragraphs
  - quotes
  - lists
  - code fences
  - math blocks
  - image blocks with captions
  - embed blocks in terminal/native v0 reading language
  - thematic breaks
- updated note and project detail screens so the shared reader path is active on both routes
- updated `lib/data/posts.ts` so published detail routes synthesize preview-backed inline link context for block embed URLs through `LinkPreviewCache` even when explicit `PostLink` rows do not exist yet
- added orphan-resource filtering so note/project footer link or asset lists only render items not already owned by inline body blocks
- tightened content-mode compatibility rules in `lib/content/post-content.ts` so block mode is selected by canonical block shape or active `markdownSource`, not by legacy revision-counter growth
- updated `lib/actions/post.actions.ts` so non-block writer saves clear `markdownSource` instead of leaving stale block-mode selectors behind
- added focused mixed-content coverage in `e2e/detail-reader.spec.ts`
- completed E2-E5 sub-agent QA during E6 and triaged findings into fixed vs deferred items

### Acceptance criteria
- new detail rendering stays inside v0 reading language
- YouTube and GitHub preview behaviors work
- old/new mixed content is validated
- audit entry for E6 is accepted
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm --dir v0app build` pass
- focused unit and E2E coverage for detail-reader compatibility pass

### Pre-implementation checklist
- [x] legacy detail reader behavior captured
- [x] embed variants defined
- [x] mixed-content dataset prepared

### Parity validation checklist
- [x] widget-like blocks do not appear
- [x] old and new posts both render safely
- [x] route/state parity evidence recorded

### Post-implementation audit checklist
- [x] reader rollout logged
- [x] compatibility outcomes logged
- [x] parity review logged
- [x] status updated here

---

## E7 — Profile/CV runtime rollout

### Status
- done

### Objective
Move Home, resume, and admin settings to the DB-backed structured profile system.

### Scope
- profile schema runtime
- `/admin/settings`
- Home/contact/guestbook profile rendering
- resume output

### Concrete tasks
- bootstrap initial profile data
- build profile CRUD and reorder flow
- switch Home to DB-backed reads
- switch contact and guestbook profile consumers to DB-backed reads
- switch resume generation to DB-backed reads
- move readiness out of primary `/admin/settings`

### Affected routes/files
- `components/v0/admin/settings-screen.tsx`
- `components/v0/admin/settings-screen-bound.tsx`
- `components/v0/admin/profile-settings-editor.tsx`
- `components/v0/admin/analytics-screen.tsx`
- `components/v0/public/home-screen-bound.tsx`
- `app/contact/page.tsx`
- `components/v0/public/guestbook-screen-bound.tsx`
- `lib/site/profile.ts`
- `lib/data/profile.ts`
- `lib/actions/profile.actions.ts`
- `app/resume.pdf/route.ts`
- `e2e/admin-settings.spec.ts`
- `e2e/helpers/profile.ts`

### Dependencies
- E2 complete
- E3 complete

### Blockers
- none

### Acceptance criteria
- `/admin/settings` is the real profile editor
- Home, contact, guestbook, and resume use DB-backed profile data
- `Jimin Park` correction is complete
- audit entry for E7 is accepted
- focused E7 regression passes

### Pre-implementation checklist
- [x] profile bootstrap mapping documented
- [x] readiness relocation documented
- [x] external profile-link verification rule applied

### Parity validation checklist
- [x] Home layout and tone stay v0-faithful
- [x] settings remains terminal-like and non-dashboard
- [x] resume output matches the new profile source
- [x] contact and guestbook profile rows use the same DB-backed source

### Post-implementation audit checklist
- [x] profile rollout logged
- [x] name correction completion logged
- [x] route parity review logged
- [x] status updated here

---

## E8 — SEO and final enhancement parity lock

### Status
- done

### Objective
Close the enhancement work with route-level SEO, metadata correctness, CI parity evidence, and final QA.

### Scope
- route metadata
- article metadata
- OG/Twitter
- sitemap/robots
- internal-link audit
- final parity and QA closeout

### Concrete tasks
- add route-level metadata
- add detail-page article metadata and structured data
- add sitemap and robots where applicable
- verify `/knowledge` redirect and canonical cleanup
- audit internal links and stale metadata
- extend CI and parity coverage

### Affected routes/files
- public route files
- `app/layout.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `.github/workflows/design-parity.yml`

### Dependencies
- E4 complete
- E6 complete
- E7 complete

### Blockers
- none

### Acceptance criteria
- metadata, canonical, and structured data are aligned
- design CI succeeds on a PR-equivalent path and uploads parity artifacts
- no reject or hold route remains open
- audit entry for E8 is accepted

### Execution notes
- added `lib/seo/metadata.ts` to centralize public/article/admin metadata generation and structured data helpers
- added route-level metadata to:
  - `app/page.tsx`
  - `app/contact/page.tsx`
  - `app/notes/page.tsx`
  - `app/projects/page.tsx`
  - `app/guestbook/page.tsx`
  - `app/subscribe/confirm/page.tsx`
  - `app/unsubscribe/page.tsx`
- added article metadata and JSON-LD output to:
  - `app/notes/[slug]/page.tsx`
  - `app/projects/[slug]/page.tsx`
- added admin noindex metadata to:
  - `app/(dashboard)/admin/layout.tsx`
  - `app/admin/login/page.tsx`
- added:
  - `app/sitemap.ts`
  - `app/robots.ts`
- extended `.github/workflows/design-parity.yml` with focused SEO/detail/contact parity validation
- added `e2e/seo.spec.ts`
- reran parity capture against current and v0 reference builds
- completed E2 through E7 QA closure with sub-agent findings recorded in audit and reflected into runtime/docs

### Pre-implementation checklist
- [x] metadata baseline captured
- [x] OG image fallback strategy documented
- [x] internal-link audit scope confirmed

### Parity validation checklist
- [x] route/state parity accept or reject is recorded for all audited routes
- [x] no stale metadata remains
- [x] no stale internal links remain
- [x] sitemap excludes `/knowledge`
- [x] admin routes emit noindex metadata

### Post-implementation audit checklist
- [x] final SEO changes logged
- [x] final QA findings logged
- [x] final parity lock logged
- [x] status updated here
