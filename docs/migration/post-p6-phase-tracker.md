# Post-P6 Exact-v0 Enhancement Phase Tracker

## Status

- Last updated: 2026-04-04
- Current overall status: R1-R9 accepted baseline; H0-H8 complete; T1 complete
- Cross-phase QA follow-up for R2 continuity exactness and database-backed Playwright proof in this local environment is recorded in the audit log.

## Governance rule

This file tracks execution for the post-P6 exact-v0 enhancement lineage.

Canonical references:

- spec: `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- schema/compatibility: `docs/migration/post-p6-schema-compatibility-plan.md`
- route ownership: `docs/migration/post-p6-route-ownership-plan.md`
- audit log: `docs/migration/post-p6-audit-log.md`

No phase is complete unless:

- this tracker reflects the final status
- the corresponding audit entry is written and accepted

## Phase summary

| Phase | Title                                                                | Status | Blocking dependency |
| ----- | -------------------------------------------------------------------- | ------ | ------------------- |
| R1    | Governance refresh and baseline responsive/runtime audit             | done   | none                |
| R2    | Shared runtime and Jitter continuity correction                      | done   | R1                  |
| R3    | Responsive shell adaptation across viewport classes                  | done   | R2                  |
| R4    | Guestbook route split and public log-language refinement             | done   | R2 + R3             |
| R5    | Storage bootstrap, upload reliability, and inline media/embed writer | done   | R1                  |
| R6    | Detail reader enrichment and responsive detail fidelity              | done   | R5                  |
| R7    | Profile/CV and admin scroll/runtime fixes                            | done   | R3                  |
| R8    | Performance diagnostics and admin transition acceleration            | done   | R2 + R3 + R7        |
| R9    | SEO, responsive parity CI, and final lock                            | done   | R4 + R6 + R7 + R8   |

## Hardening lineage summary

| Phase | Title                                                     | Status | Blocking dependency |
| ----- | --------------------------------------------------------- | ------ | ------------------- |
| H0    | Governance reset and exact-v0 hardening issue matrix      | done   | R1-R9 baseline      |
| H1    | Theme, brand navigation, public-link exposure, wrap fixes | done   | H0                  |
| H2    | Home composition, search/tags/pagination, RSS             | done   | H0 + H1             |
| H3    | Comments, guestbook, moderation pagination, view audit    | done   | H0 + H2             |
| H4    | Editor/delete/renderer integrity                          | done   | H2 + H3             |
| H5    | Profile/CV and resume management                          | done   | H0                  |
| H6    | Newsletter/subscriber/email hardening                     | done   | H0 + H1             |
| H7    | Admin performance, service log, final admin scroll close  | done   | H3 + H4 + H5 + H6   |
| H8    | Final QA, parity review, documentation lock               | done   | H1-H7               |

## Targeted patch lineage summary

| Line | Title                                              | Status | Blocking dependency |
| ---- | -------------------------------------------------- | ------ | ------------------- |
| T1   | Targeted production fix sprint (`T1-01` - `T1-08`) | done   | H0-H8 baseline      |

---

## R1 — Governance refresh and baseline responsive/runtime audit

### Status

- done

### Objective

Replace the prior post-P6 enhancement lineage with the new integrated governance package and record the current repo truth honestly.

### Scope

- canonical doc replacement
- baseline runtime/schema/layout audit
- locked defaults and product decisions
- responsive/runtime issue inventory

### Concrete tasks

- rewrite:
  - `docs/migration/post-p6-exact-v0-enhancement-spec.md`
  - `docs/migration/post-p6-schema-compatibility-plan.md`
  - `docs/migration/post-p6-route-ownership-plan.md`
  - `docs/migration/post-p6-phase-tracker.md`
  - `docs/migration/post-p6-audit-log.md`
- record current repo truth for:
  - shared runtime
  - shell geometry
  - guestbook/contact relationship
  - Markdown-first editor
  - storage buckets/bootstrap gap
  - SEO/runtime state
- reset phase lineage from `E1-E8` to `R1-R9`
- lock the standalone `/guestbook` decision and responsive/runtime rules

### Affected routes/files

- `docs/migration/post-p6-*.md`

### Dependencies

- P6 parity lock complete

### Blockers

- none

### Acceptance criteria

- the five canonical docs are rewritten to the integrated package
- current repo truth is recorded honestly
- open product decisions count is zero
- standalone `/guestbook` and responsive/runtime decisions are documented
- audit entry for `R1` is accepted

### Pre-implementation checklist

- [x] current runtime/layout/storage/schema truth explored
- [x] prior post-P6 lineage reviewed
- [x] locked defaults selected

### Parity validation checklist

- [x] strict v0 identity remains the top-level rule
- [x] current repo truth matches the new docs
- [x] `R1-R9` lineage is consistent across spec/tracker/audit
- [x] no conflicting guestbook/contact decision remains in the canonical docs

### Post-implementation audit checklist

- [x] doc replacement logged
- [x] baseline audit logged
- [x] locked defaults logged
- [x] status updated here

---

## H0 — Governance reset and exact-v0 hardening issue matrix

### Status

- done

### Objective

Reopen the post-P6 line with a hardening lineage that treats documentation as a release gate for every load-bearing change.

### Scope

- issue matrix for the production hardening backlog
- hardening lineage `H0-H8`
- documentation rule for product/runtime/schema/route/feed/email/renderer/query changes

### Concrete tasks

- record the 41-item hardening issue matrix in the canonical plan set
- lock the owner decisions for:
  - Light default theme
  - home brand-link ownership
  - Home-only Instagram exposure
  - Notes/Projects RSS
  - Home recent-notes/projects/logs composition
- define documentation acceptance rules for load-bearing changes only

### Acceptance criteria

- the hardening issue matrix is recorded
- `H0-H8` exists in the canonical docs
- no undocumented load-bearing change is allowed going forward
- audit entry for `H0` is accepted

### Post-implementation audit checklist

- [x] hardening lineage recorded
- [x] documentation gate recorded
- [x] owner decisions aligned across canonical docs

---

## H1 — Theme, brand navigation, public-link exposure, wrap fixes

### Status

- done

### Objective

Correct first-load theme, brand navigation, Instagram exposure, and shell-adjacent wrap ownership without changing the exact-v0 world.

### Scope

- Light default theme
- home-link brand mark
- Home-only Instagram exposure
- Contact/Guestbook width usage
- notes/footer shared wrap/baseline corrections

### Concrete tasks

- switch theme fallback to Light while preserving persistence and no-FOUC
- make public/admin brand mark resolve to `/`
- remove Instagram from Contact and Guestbook while keeping Home exposure
- widen Contact and Guestbook one token step inside the existing shell grammar
- retain existing public/admin switch removal and lock it in docs/tests

### Acceptance criteria

- first load is Light
- brand resolves home
- Instagram is Home-only
- Contact/Guestbook/note-strip wrap behavior no longer wastes space or collides at desktop-like widths

### Post-implementation audit checklist

- [x] product-rule change recorded
- [x] runtime/public-link behavior recorded
- [x] responsive/baseline behavior recorded

---

## H2 — Home composition, search/tags/pagination, RSS

### Status

- done

### Objective

Make Notes and Projects real publishing surfaces that scale, while keeping them inside the same exact-v0 terminal world.

### Scope

- Home composition
- Notes/Projects search
- Notes/Projects tag filters
- Notes/Projects server pagination
- project short-description truth
- separate Notes/Projects RSS feeds and autodiscovery

### Concrete tasks

- expand Home to 5 recent notes, 2 recent projects, and 2 recent visitor logs
- add server-backed `q`, `tag`, and `page` query behavior to Notes and Projects
- use project `excerpt` as the only short description and remove fake fallback prose
- expose project tags and project views in the list
- add `/notes/rss.xml` and `/projects/rss.xml`
- add feed autodiscovery and terminal-native `[rss ->]` affordances

### Acceptance criteria

- Home matches the locked product rules
- Notes/Projects query states work without design-language drift
- filtered/paginated query states avoid duplicate-canonical ambiguity
- RSS routes validate and remain exact-v0-consistent

### Post-implementation audit checklist

- [x] route/canonical/feed behavior recorded
- [x] home product-rule change recorded
- [x] pagination/search/filter behavior recorded
- [x] non-literal RSS/search extension justification recorded

---

## H3 — Comments, guestbook, moderation pagination, and view audit

### Status

- done

### Objective

Allow community surfaces to scale without switching to a card/feed product language, and audit view counting through existing analytics runtime behavior.

### Scope

- note/project comment pagination
- guestbook latest-first pagination
- admin/community pagination
- delete-control consistency
- comment contrast token correction
- note/project view-count audit

### Concrete tasks

- add paginated GET reads for note/project comments
- add paginated GET reads for guestbook
- add independent admin/community pagination for comments and guestbook
- normalize admin delete-button sizing across both moderation sections
- make comment body foreground explicit in the public log
- add analytics route proof for first-view increment and duplicate suppression

### Acceptance criteria

- comments, guestbook, and admin/community no longer hard-stop at fixed snapshots
- guestbook stays latest-first and terminal-native
- comment text remains readable across theme states
- analytics route proof exists for note/project view-count increment behavior

### Post-implementation audit checklist

- [x] pagination/runtime behavior recorded
- [x] moderation control consistency recorded
- [x] view-count audit evidence recorded
- [x] blocked e2e environment caveat recorded in audit

---

## H4 — Editor/delete/renderer integrity

### Status

- done

### Objective

Close ambiguous delete semantics, isolate editor action state, and align Markdown-first authoring with published code/math rendering without leaving dead support UI.

### Scope

- permanent delete workflow
- per-action pending state
- code and math rendering integrity
- code-copy terminal wording
- uploaded asset and cover workflow cleanup
- editor shell dead-UI removal

### Concrete tasks

- add explicit permanent delete beside archive in the existing editor shell
- ensure only the active editor action changes button state
- align canonical writer HTML with published reader expectations for code-language metadata
- replace escaped math placeholders with rendered KaTeX output
- change code-copy feedback from `copied` to `yanked`
- collapse upload, insertion, asset visibility, and cover selection into one `[assets]` support block

### Acceptance criteria

- delete/archive is no longer ambiguous
- only the active editor action shows a pending label
- uploaded assets are visibly insertable and images can be selected as cover from the same workflow
- code blocks preserve language metadata from writer to reader
- math renders as math in the published reader
- no dead preview/attachment UI remains in the active v0 editor path

### Post-implementation audit checklist

- [x] delete/archive behavior recorded
- [x] renderer/parser behavior recorded
- [x] assets/cover workflow recorded
- [x] targeted proof captured in audit

---

## H5 — Profile/CV and resume management

### Status

- done

### Objective

Align the profile editor with what the public runtime actually renders and make `/resume.pdf` directly manageable without introducing a second route or schema fork.

### Scope

- Experience editor/runtime alignment
- direct resume PDF upload/remove management
- `/resume.pdf` uploaded-override + generated-fallback behavior
- settings-shell usability guard

### Concrete tasks

- remove `Role / Position`, `Description`, and `Year` from the active Experience editor model
- make `Short Label` + `Period` the active Experience contract used by Home and generated resume output
- keep the existing Prisma columns for compatibility while mapping saves into the existing schema
- add `/api/admin/profile/resume` for admin-only upload/remove actions
- keep `/resume.pdf` as the only public resume route and serve uploaded override first

### Acceptance criteria

- Experience editing matches the public runtime model
- admins can upload and remove a real resume PDF from settings
- `/resume.pdf` serves uploaded override when present and generated fallback otherwise
- no second public resume route or non-v0 settings UI is introduced

### Post-implementation audit checklist

- [x] profile/runtime contract change recorded
- [x] resume workflow recorded
- [x] route ownership recorded
- [x] targeted proof captured in audit

---

## H6 — Newsletter/subscriber/email hardening

### Status

- done

### Objective

Bring subscription lifecycle, newsletter email framing, and `/admin/newsletter` operations up to production-ready behavior without leaving the exact-v0 terminal world.

### Scope

- newsletter audience taxonomy replacement
- public subscribe/confirm/unsubscribe state machine
- welcome/signature/banner email lifecycle
- newsletter queue/targeting/asset workflow
- paginated subscriber/campaign/delivery management

### Concrete tasks

- replace old newsletter segmentation with:
  - `All`
  - `Project & Info`
  - `Log`
- normalize legacy topic aliases into the locked canonical topic set
- update public subscribe strips and request actions to use the new taxonomy
- make repeat subscribe/confirm/unsubscribe flows resolve to explicit success-state language instead of raw errors
- send a welcome email after successful confirmation
- apply one exact-v0 mail frame with:
  - static Jitter banner
  - shared signature
  - natural unsubscribe wording
- extend `/admin/newsletter` to support:
  - draft-backed queue ordering
  - topic or selected-recipient targeting
  - send-unsent-only reruns
  - image/file uploads
  - attachment toggles
  - subscriber unsubscribe/delete
  - paginated campaigns, deliveries, and subscribers
- keep newsletter compose/preview Markdown-first inside the same admin shell

### Acceptance criteria

- public subscribe flows use the locked topic taxonomy and explicit status-machine copy
- successful confirmation sends a welcome email
- newsletter emails use the shared exact-v0 frame and natural unsubscribe wording
- `/admin/newsletter` supports queue edits, reruns, attachments, targeted sends, and pagination without introducing a second design language
- load-bearing H6 docs and audit evidence are recorded

### Post-implementation audit checklist

- [x] taxonomy and lifecycle rule changes recorded
- [x] schema/data-contract changes recorded
- [x] route ownership and worker/upload ownership recorded
- [x] email-frame/lifecycle changes recorded
- [x] targeted proof captured in audit

---

## H7 — Admin performance, service log, final admin scroll close

### Status

- done

### Objective

Turn admin diagnostics into a real attribution surface and close remaining shell-level scroll containment drift without changing the exact-v0 admin language.

### Scope

- lightweight service log in analytics
- per-surface admin performance attribution
- final admin route wrapper containment cleanup

### Concrete tasks

- extend admin analytics with a service-log projection built from:
  - `AuditLog`
  - `WebhookDelivery`
  - `NewsletterCampaign`
  - `NewsletterDelivery`
- extend admin performance diagnostics to measure:
  - session lookup
  - posts index
  - post editor load
  - settings editor load
  - newsletter dashboard load
  - community moderation load
- keep diagnostics terminal-native and inline; no monitoring dashboard widgets
- tighten admin route wrappers with explicit `min-h-0` and bottom breathing room so long content surfaces remain reachable
- close the remaining newsletter unsubscribe-notification and campaign-delete operational correctness risks surfaced during H0-H6 audit

### Acceptance criteria

- `/admin/analytics` exposes a lightweight service log in the same v0 language
- performance diagnostics attribute multiple admin surfaces instead of one opaque server number
- admin content/settings/newsletter/community wrappers keep a single reachable scroll owner
- no new admin design language is introduced
- H7 docs and audit evidence are recorded

### Post-implementation audit checklist

- [x] analytics/service-log behavior recorded
- [x] performance attribution behavior recorded
- [x] scroll-owner containment change recorded
- [x] targeted proof captured in audit

---

## H8 — Final QA, parity review, documentation lock

### Status

- done

### Objective

Re-run the full hardening proof set, close the last production-facing runtime gap discovered during final smoke, and lock the canonical post-P6 docs to the implemented H0-H8 state.

### Scope

- final build/unit/runtime smoke review
- H0-H7 sub-agent production-readiness audit
- public resume fallback hardening
- documentation lock for final accepted behavior

### Concrete tasks

- re-audit H0-H7 for:
  - API and functional correctness
  - user-flow risk
  - exact-v0 design consistency
  - docs/schema/ORM/transaction alignment
  - shell-only or non-substantive feature risk
- rerun:
  - `pnpm db:validate`
  - `pnpm db:generate`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test`
- run production-build route smoke and ops smoke against a live local `next start`
- harden `/resume.pdf` so public read-path fallback stays generated when override storage is unreadable or unconfigured, while admin write paths remain fail-closed
- update spec/compat/route/tracker/audit docs to the final H0-H8 accepted state

### Acceptance criteria

- H0-H7 sub-agent audit reports no production blockers and no exact-v0 blocker
- production build, unit suite, and local ops smoke pass
- public core routes, feeds, admin auth redirect, and `/resume.pdf` succeed on a live production build
- canonical docs match the implemented H0-H8 runtime behavior
- remaining risk is limited to external environment proof gaps rather than accepted code/runtime failure

### Post-implementation audit checklist

- [x] H0-H7 sub-agent verdict recorded
- [x] final build/unit/runtime smoke recorded
- [x] public resume fallback hardening recorded
- [x] final documentation lock recorded

---

## T1 — Targeted production fix sprint (`T1-01` - `T1-08`)

### Status

- done

### Objective

Close the remaining narrowly-scoped production defects discovered after the accepted `H0-H8` line, without reopening redesign or schema-expansion work.

### Scope

- delete/create workflow correctness
- public code-block renderer cleanup
- project summary truth and editability
- exact-v0 assets workflow cleanup
- public comment moderation removal
- contact webhook dispatch diagnostics and authority
- Notes/Projects control-height parity
- outgoing sender identity normalization

### Sub-issue summary

| Issue | Title                                      | Status |
| ----- | ------------------------------------------ | ------ |
| T1-01 | Delete Post create-side-effect removal     | done   |
| T1-02 | Public code-block render corruption fix    | done   |
| T1-03 | Canonical project summary editor/runtime   | done   |
| T1-04 | Exact-v0 asset workflow cleanup            | done   |
| T1-05 | Public admin-moderation affordance removal | done   |
| T1-06 | `CONTACT_SUBMIT` webhook dispatch repair   | done   |
| T1-07 | Notes/Projects search-reset control parity | done   |
| T1-08 | Sender display-name normalization          | done   |

### Concrete tasks

- lock `CREATE_DRAFT_POST` to explicit navigation/create actions only
- remove idle/hover prefetch of `/admin/content`
- replace markup-mutating code highlighting with raw-code-only rendering
- keep LaTeX on the current math path
- expose `Post.excerpt` in the exact-v0 editor and remove project fallback prose injection
- clarify `coverImageUrl` as the selected share image inside the single `[assets]` workflow
- expand upload support only to the explicit safe text/document allowlist
- remove `[admin remove]` from public comments while preserving admin/community moderation
- align Notes/Projects reset controls to the shared inline control token
- normalize outgoing sender identity to `xistoh <hello@xistoh.com>`
- make webhook dispatch env-authoritative, timeout-bounded, and diagnostically classified

### Acceptance criteria

- deleting a post does not appear to recreate a replacement draft
- public code blocks render clean code without leaked class/style text
- LaTeX still renders correctly
- project summary derives only from editable `excerpt`
- share-image selection remains real and no dead cover UI remains
- public comments expose no admin moderation affordance
- `CONTACT_SUBMIT` dispatch uses the current env target and produces actionable diagnostics on failure
- Notes/Projects search and reset controls share the same control height
- outgoing sender identity renders as `xistoh <hello@xistoh.com>`

### Post-implementation audit checklist

- [x] T1 sub-issues recorded in canonical docs
- [x] targeted renderer/editor/webhook tests passed
- [x] lint/typecheck/build rerun after T1 implementation
- [x] exact-v0 preservation note recorded in audit

---

## R2 — Shared runtime and Jitter continuity correction

### Status

- done

### Objective

Correct shared runtime ownership so the right panel is a true persistent engine with real route-to-route continuity.

### Scope

- shared runtime
- slot registration
- persistent engine ownership
- route interpolation
- tall-screen geometry

### Concrete tasks

- replace fixed overlay/frame-copy ownership with slot registration + portal ownership
- keep one engine instance alive across route changes
- implement real dither-to-dither interpolation
- implement dither-to-Life transform and Life-to-dither decay
- remove Life Game grid overlay
- correct tall-screen/pivot geometry so the right panel fully fills the intended region

### Affected routes/files

- `app/layout.tsx`
- `components/v0/runtime/v0-experience-runtime.tsx`
- `components/v0/public/public-shell.tsx`
- `components/v0/admin/admin-shell.tsx`
- `components/v0/admin/login-screen.tsx`

### Dependencies

- R1 complete

### Blockers

- none

### Execution notes

- updated `components/v0/runtime/v0-experience-runtime.tsx` to replace primary fixed-overlay ownership with slot registration plus portal-based runtime hosting
- retained measured frame fallback only for shell handoff gaps so the right panel does not blank during navigation
- added runtime descriptor interpolation for dither-to-dither continuity and Life overlay continuity
- removed pathname-coupled Life reseeding so contact/guestbook continuity no longer hard-resets purely because the route key changes
- replaced the old mid-transition discrete dither flip with a single-field discrete-family transition path that avoids ghosted double exposure
- removed Life Game grid lines from the shared runtime field
- updated:
  - `components/v0/public/public-shell.tsx`
  - `components/v0/admin/admin-shell.tsx`
  - `components/v0/admin/login-screen.tsx`
    to:
  - register right-panel slots
  - observe slot geometry through `ResizeObserver`
  - use `h-[100svh] min-h-[100svh]` shell ownership
  - preserve exact desktop split identity while fixing tall-screen slot collapse
- removed route-level viewport height math from `components/v0/public/contact-screen.tsx` so contact centering now follows shell-owned geometry
- added `e2e/runtime-panel.spec.ts` to lock visible right-panel runtime ownership and tall-screen slot height on public/admin access shells

### Acceptance criteria

- one persistent engine instance survives route changes
- slot registration + portal ownership replaces frame-copy ownership
- dither-to-dither interpolation is visible
- contact transforms into Life Game without replacement/reset
- Life grid lines are removed
- tall-screen clipping is gone

### Pre-implementation checklist

- [x] current runtime lifecycle measured
- [x] slot registration interface designed
- [x] tall-screen failure cases captured

### Parity validation checklist

- [x] no abrupt right-panel blanking during shell handoff
- [x] no missing admin right panel
- [x] contact continuity remains on the shared runtime path
- [x] Life continuity is no longer keyed to pathname-only route changes
- [x] route-to-route dither continuity avoids shell blanking while exact field-level interpolation remains tracked in audit
- [x] desktop visual identity remains v0-faithful

### Post-implementation audit checklist

- [x] engine ownership change logged
- [x] continuity evidence logged
- [x] tall-screen evidence logged
- [x] status updated here

---

## R3 — Responsive shell adaptation across viewport classes

### Status

- done

### Objective

Adapt the shared shell across viewport classes without introducing a second UI language.

### Scope

- public shell responsive ownership
- admin shell responsive ownership
- mobile/tablet/tall desktop layout behavior

### Concrete tasks

- replace rigid `h-screen`/`w-1/2` assumptions with viewport-class-aware shell geometry
- preserve split identity on desktop/tablet
- introduce condensed Jitter band stacked shell on mobile
- change admin mobile to horizontal command strip
- keep one scroll owner per page in constrained layouts

### Affected routes/files

- `components/v0/public/public-shell.tsx`
- `components/v0/admin/admin-shell.tsx`
- `components/v0/admin/login-screen.tsx`
- shell-owned child surfaces affected by overflow containment

### Execution notes

- updated:
  - `components/v0/public/public-shell.tsx`
  - `components/v0/admin/admin-shell.tsx`
  - `components/v0/admin/login-screen.tsx`
    to:
  - keep exact desktop-wide split identity at `lg`
  - use a 56/44 content-to-Jitter split on tablet
  - switch mobile to a stacked shell with a condensed Jitter band
  - expose the admin sidebar as a horizontal command strip on mobile instead of a drawer/hamburger
- updated shell-owned route surfaces to follow the new shell geometry without introducing a second design language:
  - `components/v0/public/home-screen.tsx`
  - `components/v0/public/projects-screen.tsx`
  - `components/v0/public/contact-screen.tsx`
  - `components/v0/public/detail-note-screen.tsx`
  - `components/v0/public/detail-project-screen.tsx`
  - `components/v0/public/subscription-result-screen.tsx`
  - `components/v0/public/notes-screen.tsx`
  - `components/v0/admin/analytics-screen.tsx`
  - `components/v0/admin/community-screen.tsx`
  - `components/v0/admin/manage-posts-screen.tsx`
  - `components/v0/admin/editor-screen.tsx`
  - `components/v0/admin/settings-screen.tsx`
  - `components/v0/admin/newsletter-screen.tsx`
- converted the notes subscribe strip to:
  - remain fixed and split-owned on tablet/desktop
  - become an in-flow terminal strip on mobile so narrow viewports no longer inherit a broken half-width fixed footer
- added `e2e/responsive-shell.spec.ts` for:
  - wide desktop split parity
  - standard desktop split parity
  - tall desktop slot height parity
  - tablet portrait split ownership
  - tablet landscape split ownership
  - mobile portrait stacked Jitter band behavior
  - mobile landscape stacked Jitter band behavior
  - mobile admin command strip
- expanded `e2e/runtime-panel.spec.ts` to include authenticated admin-shell evidence so `R2` claims remain backed by real verification

### Dependencies

- R2 complete

### Blockers

- none

### Acceptance criteria

- mobile portrait/landscape, tablet portrait/landscape, standard desktop, tall desktop, and wide desktop all render coherently
- Jitter identity remains present across all viewport classes
- no desktop-wide parity regression against the current parity-locked shell

### Pre-implementation checklist

- [x] viewport matrix captured
- [x] tall/pivot and narrow/mobile failures reproduced
- [x] shell ownership rules aligned with route ownership plan

### Parity validation checklist

- [x] desktop parity retained
- [x] no second mobile design language introduced
- [x] no hamburger/drawer/tab-bar regression
- [x] admin mobile uses command strip language only

### Post-implementation audit checklist

- [x] viewport evidence logged
- [x] desktop regression check logged
- [x] hold/re-review states recorded if needed
- [x] status updated here

---

## R4 — Guestbook route split and public log-language refinement

### Status

- done

### Objective

Separate `/guestbook` back into a canonical public route while preserving the same v0 design world as `/contact`.

### Scope

- `/guestbook`
- `/contact`
- guestbook public presentation
- canonical strategy

### Concrete tasks

- make `/guestbook` a standalone public surface again
- reduce `/contact` to compact guestbook preview/jump
- remove public admin controls from guestbook
- refine guestbook rows into linear terminal log rhythm
- implement `/contact` and `/guestbook` self-canonical strategy

### Affected routes/files

- `app/contact/page.tsx`
- `app/guestbook/page.tsx`
- `components/v0/public/contact-screen.tsx`
- `components/v0/public/guestbook-screen.tsx`
- guestbook-bound public components

### Dependencies

- R2 complete
- R3 complete

### Blockers

- none

### Execution notes

- updated:
  - `app/contact/page.tsx`
  - `app/guestbook/page.tsx`
  - `components/v0/public/contact-screen.tsx`
  - `components/v0/public/guestbook-screen-bound.tsx`
  - `components/v0/public/guestbook-screen.tsx`
  - `components/v0/public/guestbook-screen-client.tsx`
  - `components/v0/public/guestbook-terminal-panel.tsx`
    to:
  - restore `/guestbook` as a standalone public route
  - reduce `/contact` to a compact preview/jump only
  - remove public moderation controls from the guestbook surface
  - keep linear terminal log rows instead of card/feed styling
  - keep guestbook and contact inside the same shared shell/runtime world
- updated guestbook metadata/canonical ownership so `/contact` and `/guestbook` are self-canonical and no longer compete as duplicate full guestbook surfaces
- separated the standalone guestbook UI into an explicit client entry component so the route no longer leaks client hook ownership into the server page module
- tightened the contact preview and guestbook row density so the preview remains a secondary terminal trace instead of a second full content module
- ran follow-up R2-R3 QA and absorbed the drift fixes that surfaced there:
  - Life continuity no longer re-seeds on active/intensity changes
  - discrete dither-family transitions no longer double-expose the panel
  - notes subscribe feedback stays inline in the terminal strip
  - responsive evidence now covers standard desktop, tall desktop, tablet landscape, and mobile landscape

### Acceptance criteria

- `/guestbook` is standalone
- `/contact` shows preview/jump only
- public admin controls are gone
- guestbook uses linear terminal log language
- canonical strategy is implemented

### Pre-implementation checklist

- [x] contact/guestbook product decision reflected in docs
- [x] public moderation ownership confirmed as admin-only
- [x] canonical rule captured

### Parity validation checklist

- [x] guestbook remains inside same v0 world
- [x] contact composition remains coherent
- [x] no feed/card styling introduced
- [x] no duplicate canonical ambiguity

### Post-implementation audit checklist

- [x] guestbook route split logged
- [x] public log-language evidence logged
- [x] canonical evidence logged
- [x] status updated here

---

## R5 — Storage bootstrap, upload reliability, and inline media/embed writer

### Status

- done

### Objective

Make upload reliable through storage bootstrap/readiness and add real inline body media/embed authoring to the Markdown-first editor.

### Scope

- storage bootstrap
- readiness diagnostics
- upload error mapping
- inline body media/embed writer
- editor layout containment

### Concrete tasks

- add `pnpm storage:bootstrap`
- validate/create `post-media` and `post-files`
- expose bucket/env readiness in admin analytics
- improve missing-bucket error mapping
- add image/file insertion at cursor inside the Markdown writer
- normalize bare URL lines into embed blocks
- fix editor scrolling/containment structurally

### Affected routes/files

- storage and upload runtime
- admin analytics readiness surface
- `components/admin/post-editor.tsx`
- Markdown normalization helpers

### Dependencies

- R1 complete

### Blockers

- none

### Execution notes

- unified `lib/storage/supabase.ts` so one bucket rule set now drives:
  - upload validation
  - bootstrap inspection
  - actionable storage error mapping
  - test-storage URL generation
- added `scripts/storage-bootstrap.ts` and `pnpm storage:bootstrap` as the canonical operational command:
  - the script now loads `.env.local` / `.env`
  - unconfigured shells now fail closed with an actionable storage message instead of raw env-loader noise
  - idempotence was verified against the test storage driver
- updated `lib/ops/readiness.ts` and `components/v0/admin/analytics-screen.tsx` so `/admin/analytics` exposes:
  - storage configured
  - `post-media bucket`
  - `post-files bucket`
  - bucket visibility detail
- updated `app/api/admin/uploads/route.ts` to route bucket/bootstrap failures through the canonical storage error mapper
- extended the Markdown-first writer path across:
  - `components/admin/post-editor.tsx`
  - `components/admin/v0-markdown-editor.tsx`
  - `lib/content/markdown-blocks.ts`
  - `lib/actions/post.actions.ts`
    so uploads now insert `asset://` image/file tokens at the cursor, normalize them into canonical block content, and keep bare-line URL embed normalization on the writer path
- removed the old image-upload side effect that silently overwrote `coverImageUrl`; cover assignment is now explicit again
- fixed asset removal so removing an uploaded asset strips matching `asset://` body references and immediately recomputes block/html payloads
- added a follow-up hardening pass during `R6` QA:
  - `components/v0/admin/editor-screen.tsx` now owns vertical scrolling inside the shell primary pane so lower editor sections stay reachable on desktop/tablet
  - asset removal now strips only matching `asset://` tokens instead of deleting entire lines of prose
  - test storage now fails closed under the production server and `/admin/analytics` reports that state explicitly
  - public profile consumers now read the snapshot path instead of bootstrapping on GET
  - `app/contact/page.tsx` continues to load only the two guestbook rows that the contact preview actually renders
- added/updated validation in:
  - `tests/unit/markdown-blocks.test.ts`
  - `tests/unit/readiness.test.ts`
  - `e2e/admin-analytics.spec.ts`
  - `e2e/media-access.spec.ts`

### Acceptance criteria

- editor scroll/layout is usable
- inline image/file/embed insertion works
- `pnpm storage:bootstrap` is idempotent across the in-repo test/configured branches, and production-equivalent Supabase execution remains an explicit external verification gate recorded in audit
- readiness diagnostics correctly report bucket existence and visibility

### Pre-implementation checklist

- [x] bucket/runtime failure reproduced
- [x] writer token conventions locked
- [x] editor scroll owner identified

### Parity validation checklist

- [x] editor stays inside v0 shell
- [x] no modern editor chrome appears
- [x] upload flow stays terminal-native
- [x] readiness fits admin diagnostics language

### Post-implementation audit checklist

- [x] storage bootstrap behavior logged
- [x] upload/runtime evidence logged
- [x] editor insertion evidence logged
- [x] status updated here

---

## R6 — Detail reader enrichment and responsive detail fidelity

### Status

- done

### Objective

Expand detail readers to render richer canonical block content responsively while keeping the same v0 reading language.

### Scope

- note/project detail readers
- image/embed rendering
- responsive detail behavior
- mixed-content safety

### Concrete tasks

- enrich detail rendering for image/embed blocks
- keep fallback to generic terminal link block when preview metadata is unresolved
- preserve old/new mixed-content compatibility
- adapt detail reading surfaces across viewport classes

### Affected routes/files

- detail reading components
- post content reader helpers
- SEO/detail metadata touchpoints if needed for structural data

### Dependencies

- R5 complete

### Blockers

- none

### Execution notes

- updated:
  - `components/v0/public/detail-content.tsx`
  - `components/v0/public/detail-note-screen.tsx`
  - `components/v0/public/detail-project-screen.tsx`
  - `lib/content/post-content.ts`
  - `tests/unit/post-content-compat.test.ts`
  - `e2e/detail-reader.spec.ts`
    to:
  - keep canonical block readers and legacy readers on the same mixed-content-safe path
  - collect inline body-owned asset and external link references so footer resources do not duplicate content already rendered in the body
  - resolve inline `asset://` links inside paragraph/list/quote text through the same post asset runtime used elsewhere
  - keep unresolved previews on the terminal-native generic link block path
  - harden detail wrapping and width behavior for mobile and narrow layouts without cardifying the reader
- kept YouTube embeds preview-first while switching the detail reader to a native disclosure path that stays inside the same v0 reading surface
- enriched GitHub detail rendering so repo, issue, and PR preview metadata all render as terminal-native rows instead of collapsing everything to repo-only output
- absorbed cross-phase QA fixes discovered while closing `R6`:
  - `components/v0/admin/editor-screen.tsx` now creates a real vertical scroll owner inside the shell primary pane
  - `components/admin/post-editor.tsx` asset removal is token-local and no longer deletes surrounding prose
  - `lib/storage/supabase.ts`, `lib/ops/readiness.ts`, and `app/api/test-storage/route.ts` now fail closed when `STORAGE_DRIVER=test` is used under the production server
- public profile read-path unification was deferred out of the R6 closeout and completed under `R7`

### Acceptance criteria

- images/embeds render terminal-native
- responsive detail fidelity holds across viewport classes
- mixed old/new content remains safe
- unresolved previews degrade to generic terminal link blocks

### Pre-implementation checklist

- [x] legacy/new reader selection revalidated
- [x] viewport matrix for detail pages captured
- [x] preview fallback behavior defined

### Parity validation checklist

- [x] detail surfaces remain linear and dense
- [x] no widget/card preview style appears
- [x] mobile detail remains within the same reading grammar
- [x] desktop detail parity remains intact

### Post-implementation audit checklist

- [x] detail reader enrichment logged
- [x] fallback behavior logged
- [x] responsive evidence logged
- [x] status updated here

---

## R7 — Profile/CV and admin scroll/runtime fixes

### Status

- done

### Objective

Harden Profile/CV runtime truth and fix structural scroll/runtime issues on admin settings and related profile consumers.

### Scope

- `/admin/settings`
- Home/contact/guestbook/resume profile consumers
- static fallback retirement

### Concrete tasks

- fix `/admin/settings` scroll ownership structurally
- confirm DB profile truth across runtime consumers
- remove active runtime dependence on static fallback after acceptance
- keep readiness under `/admin/analytics`

### Affected routes/files

- profile runtime/data consumers
- `components/v0/admin/settings-screen.tsx`
- profile actions/data helpers
- resume route

### Dependencies

- R3 complete

### Blockers

- none

### Execution notes

- updated:
  - `components/v0/admin/settings-screen.tsx`
  - `components/v0/admin/editor-screen.tsx`
    so desktop/tablet panes own scrolling structurally while mobile keeps the shell primary pane as the only scroll owner
- updated `components/v0/admin/profile-settings-editor.tsx` to keep the same terminal density while allowing wrapped row layouts across mobile, tablet, and command-strip admin shells
- updated:
  - `components/v0/admin/settings-screen-bound.tsx`
  - `lib/data/profile.ts`
    so settings and public runtime consumers resolve profile data through the runtime snapshot path rather than leaving active runtime on the static snapshot path
- changed `lib/data/profile.ts` bootstrap behavior from blind upsert to create-or-reread so concurrent first-request bootstrap no longer surfaces `P2002` unique-constraint races on `slug`
- updated:
  - `app/page.tsx`
  - `components/v0/public/home-screen-bound.tsx`
  - `app/contact/page.tsx`
  - `components/v0/public/guestbook-screen-bound.tsx`
  - `app/resume.pdf/route.ts`
    to consume `getPrimaryProfileRuntimeSnapshot()` and keep live DB truth aligned across public runtime surfaces
- updated `lib/actions/profile.actions.ts` so profile saves revalidate `/contact` and `/guestbook` alongside home, admin, and resume paths
- absorbed safe follow-up fixes from R2-R6 QA without drifting from v0:
  - `components/v0/public/detail-content.tsx` and `components/v0/public/detail-project-screen.tsx` reduce boxed preview drift into more linear terminal rows
  - `app/resume.pdf/route.ts` now uses UTF-8 byte length and `Cache-Control: no-store`
  - `lib/storage/supabase.ts` now re-applies canonical bucket policy to existing buckets during bootstrap
  - `app/api/admin/uploads/route.ts` now accepts extension-backed MIME fallback for valid `.pdf`, `.txt`, and image uploads
- strengthened verification in `e2e/admin-settings.spec.ts` for:
  - desktop settings scroll ownership
  - mobile command-strip scroll ownership
  - live runtime propagation to home, contact, guestbook, and resume

### Acceptance criteria

- `/admin/settings` scroll is structurally fixed
- Home/resume/profile read DB truth
- `Jimin Park` live runtime verification is complete
- static profile fallback is no longer used in active runtime after `R7` acceptance, except explicitly documented bootstrap paths

### Pre-implementation checklist

- [x] settings scroll failure reproduced across viewport classes
- [x] DB/static fallback call sites inventoried
- [x] release-gate verification for `Jimin Park` prepared

### Parity validation checklist

- [x] settings remains inside v0 shell
- [x] profile rows keep terminal density
- [x] no readiness drift back into settings
- [x] Home/contact/guestbook/resume stay visually unchanged

### Post-implementation audit checklist

- [x] fallback retirement logged
- [x] profile runtime evidence logged
- [x] settings scroll evidence logged
- [x] status updated here

---

## R8 — Performance diagnostics and admin transition acceleration

### Status

- done

### Objective

Measure the causes of admin slowness and apply optimizations that preserve v0 identity.

### Scope

- admin nav latency
- runtime handoff timing
- data-fetch timing
- prefetch/caching opportunities

### Concrete tasks

- instrument admin transition timings
- measure data/runtime bottlenecks
- add admin nav prefetch
- keep Jitter alive while data loads
- move heavy non-visible editor support blocks behind existing v0 tabs only where safe

### Affected routes/files

- shared runtime
- admin navigation surfaces
- admin data loaders
- diagnostics surfaces

### Dependencies

- R2 complete
- R3 complete
- R7 complete

### Blockers

- none

### Execution notes

- added:
  - `lib/contracts/admin-performance.ts`
  - `lib/ops/admin-performance.ts`
  - `lib/ops/admin-performance-client.ts`
    so `/admin/analytics` now exposes a terminal-native performance diagnostics surface with:
  - server-side timings for:
    - `getSession()`
    - `getAdminPosts()`
    - `getAdminPostEditorState()`
    - `getPrimaryProfileRuntimeSnapshot()`
  - client-side timings for:
    - recent admin navigation
    - recent runtime handoff
- updated `components/v0/admin/analytics-screen-bound.tsx` and `components/v0/admin/analytics-screen.tsx` so performance telemetry lives inside the existing analytics shell instead of introducing a new diagnostics UI
- updated `components/v0/admin/admin-shell.tsx` so admin navigation now:
  - records click-to-ready timing
  - keeps hover/focus prefetch
  - replaces eager all-route mount prefetch with idle-neighbors prefetch to reduce cold admin overfetch
- updated `components/v0/runtime/v0-experience-runtime.tsx` so admin/admin-access runtime handoff timings are captured when the persistent Jitter host reattaches to a live slot
- updated `lib/auth.ts` to use request-scope cached session lookup
- updated `lib/data/newsletter.ts` to parallelize independent dashboard reads
- updated `components/v0/admin/newsletter-manager.tsx` to remove the nested inner vertical scroll owner and keep the admin shell primary pane as the scroll owner
- updated `middleware.ts` so the auth POST rate limiter is bypassed only under the dedicated E2E test environment; production/runtime rate limiting is unchanged
- added verification coverage in:
  - `tests/unit/admin-performance.test.ts`
  - `e2e/admin-analytics.spec.ts`

### Acceptance criteria

- measured admin navigation latency baseline is captured
- accepted optimizations are applied
- timing telemetry and accepted mitigations are in place; benchmark-style before/after artifacts are not claimed beyond local QA
- no accepted optimization increases visual drift or remount behavior

### Pre-implementation checklist

- [x] baseline timings captured through the live admin performance diagnostics path
- [x] heavy paths identified
- [x] unsafe optimization classes ruled out

### Parity validation checklist

- [x] visual density preserved
- [x] no Jitter identity loss
- [x] no route remount regression
- [x] admin right-panel continuity preserved

### Post-implementation audit checklist

- [x] timing evidence logged
- [x] accepted mitigations logged
- [x] rejected unsafe optimizations logged
- [x] status updated here

---

## R9 — SEO, responsive parity CI, and final lock

### Status

- done

### Objective

Finalize SEO, responsive parity evidence, and CI coverage for the integrated lineage.

### Scope

- route-level SEO
- sitemap/robots validation
- responsive parity evidence
- final QA/audit closeout

### Concrete tasks

- finalize public and detail route metadata
- validate `/contact` and `/guestbook` canonical strategy
- validate sitemap/robots output
- extend design CI to responsive evidence collection where required
- complete final QA and close hold/review states

### Affected routes/files

- SEO helpers and route metadata
- `app/sitemap.ts`
- `app/robots.ts`
- parity/CI workflow
- final audit/tracker closeout docs

### Dependencies

- R4 complete
- R6 complete
- R7 complete
- R8 complete

### Blockers

- none

### Execution notes

- updated:
  - `lib/contracts/posts.ts`
  - `lib/content/preview-metadata.ts`
  - `lib/content/link-preview.ts`
  - `components/v0/public/detail-content.tsx`
  - `tests/unit/link-preview.test.ts`
    so persisted preview metadata now carries a typed YouTube contract with `videoId` while preserving mixed-cache fallback compatibility
- updated `e2e/detail-reader.spec.ts` so checked-in reader evidence now includes:
  - GitHub issue subtype rows
  - GitHub PR subtype rows
  - tablet-portrait and tall-desktop detail rendering checks
- updated `e2e/seo.spec.ts` so route-level SEO coverage now verifies:
  - `/notes`
  - `/projects`
  - `/contact`
  - `/guestbook`
  - `/knowledge -> /notes` redirect
  - detail article metadata and structured data
- updated `scripts/capture-v0-parity.ts` so parity capture now also produces current-app responsive evidence under:
  - `docs/migration/parity/2026-03-27-responsive`
    covering:
  - mobile portrait
  - mobile landscape
  - tablet portrait
  - tablet landscape
  - tall desktop
  - wide desktop
- updated `.github/workflows/design-parity.yml` so focused PR-path verification now includes:
  - `e2e/responsive-shell.spec.ts`
  - `e2e/runtime-panel.spec.ts`
  - `e2e/admin-analytics.spec.ts`
  - `e2e/media-access.spec.ts`
    alongside the existing SEO/detail/admin/public regression set
- removed stale shadow files:
  - `components/v0/admin/community-screen 2.tsx`
  - `components/v0/admin/editor-screen 2.tsx`
  - `components/v0/admin/manage-posts-screen 2.tsx`
  - `components/v0/admin/newsletter-manager 2.tsx`
  - `components/v0/admin/settings-screen 2.tsx`
  - `components/v0/admin/settings-screen 3.tsx`
  - `components/v0/public/detail-content 2.tsx`
    which were confirmed to be unused stale scratch variants rather than live runtime sources

### Acceptance criteria

- route metadata/canonical/OG/Twitter/JSON-LD are complete
- sitemap/robots are validated
- responsive parity evidence and desktop parity evidence are uploaded
- design CI on a PR-equivalent path uploads artifacts
- no reject/hold route remains open

### Pre-implementation checklist

- [x] route metadata matrix captured
- [x] canonical strategy verified
- [x] CI artifact expectations defined

### Parity validation checklist

- [x] desktop parity still holds
- [x] responsive evidence exists for required viewport classes
- [x] `/knowledge` is absent from sitemap
- [x] `/contact` and `/guestbook` are canonical-safe

### Post-implementation audit checklist

- [x] SEO evidence logged
- [x] CI artifact evidence logged
- [x] final hold/review state logged
- [x] status updated here

### Post-lock follow-up — Scroll/container ownership hardening (2026-04-03)

- status: done
- objective: remove residual nested public-route scroll containers using ownership and layout constraints only
- execution notes:
  - updated:
    - `components/v0/public/notes-screen.tsx`
    - `components/v0/public/projects-screen.tsx`
    - `components/v0/public/detail-note-screen.tsx`
    - `components/v0/public/detail-project-screen.tsx`
    - `components/v0/public/contact-screen.tsx`
    - `components/v0/public/guestbook-screen-client.tsx`
    - `components/v0/public/subscription-result-screen.tsx`
  - removed route-level `md:overflow-y-auto` wrappers so the existing `PublicShell` primary pane remains the single desktop/tablet vertical scroll owner
  - kept layout semantics (`min-h-full`, `md:h-full`, existing spacing) intact; no route visual language changes
- explicit redesign rejections (this follow-up):
  - rejected: introducing drawer/hamburger/app-shell variants to "solve" scroll issues
  - rejected: re-spacing, re-typography, or card/chrome redesign as a scroll workaround
  - rejected: any second responsive navigation model; ownership fixes remain structural only

### Post-T1 follow-up — Project detail read-time parity (2026-04-04)

- status: done
- objective: expose the same published-date and estimated read-time metadata grammar on `/projects/[slug]` that note detail pages already use
- execution notes:
  - updated:
    - `components/v0/public/detail-project-screen.tsx`
    - `tests/unit/detail-meta.test.ts`
    - `docs/00_system_overview.md`
    - `docs/09_change_history.md`
  - reused the existing `formatDetailMeta()` contract from the note-detail path
  - kept the exact-v0 project detail shell, summary rules, and section ordering intact
- explicit redesign rejections (this follow-up):
  - rejected: introducing a separate project-specific metadata widget
  - rejected: adding a new read-time data field to Prisma or DTO contracts
  - rejected: replacing the current detail header grammar instead of extending it minimally
