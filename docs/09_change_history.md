# 09. Change History

This document summarizes how the current repo arrived at its present state.

## Historical lines

### Prototype / pre-migration research

- `DEVELOPMENT_LOG.md`
- role:
  - prototype-era audit
  - concept extraction
  - not current runtime truth

### v0 fidelity migration line

- `docs/migration/v0-fidelity-production-migration-spec.md`
- `docs/migration/v0-phase-tracker.md`
- `docs/migration/v0-audit-log.md`
- role:
  - earlier migration work that established the initial exact-v0 cutover
  - historical only

## Current accepted lines

### R1-R9 baseline

Source of truth:

- `docs/migration/post-p6-phase-tracker.md`
- `docs/migration/post-p6-audit-log.md`

Meaning:

- the post-P6 responsive/runtime baseline is accepted
- shared runtime, split-shell behavior, standalone guestbook, SEO, and admin performance foundation were established here

### H0-H8 hardening line

Source of truth:

- `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- `docs/migration/post-p6-schema-compatibility-plan.md`
- `docs/migration/post-p6-route-ownership-plan.md`
- `docs/migration/post-p6-phase-tracker.md`
- `docs/migration/post-p6-audit-log.md`

Meaning:

- the production hardening program is accepted
- current repo truth includes:
  - Light default theme
  - home-link brand ownership
  - Home-only Instagram
  - Home recent notes/projects/logs composition
  - Notes/Projects RSS
  - search/tag/pagination on public publishing surfaces
  - guestbook/comments/community pagination
  - editor/delete/asset/math/code hardening
  - profile/runtime alignment and resume override
  - newsletter lifecycle and admin hardening
  - admin service log and performance diagnostics
  - final QA/documentation lock

### T1 targeted production patch line

Source of truth:

- `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- `docs/migration/post-p6-schema-compatibility-plan.md`
- `docs/migration/post-p6-route-ownership-plan.md`
- `docs/migration/post-p6-phase-tracker.md`
- `docs/migration/post-p6-audit-log.md`

Meaning:

- a narrow correction pass accepted after `H0-H8`
- current repo truth additionally includes:
  - explicit-only draft creation on `/admin/content`
  - clean public code rendering without leaked style tokens
  - canonical project summary editing through `Post.excerpt`
  - clarified exact-v0 share-image semantics inside the single assets workflow
  - public comments without admin moderation affordances
  - env-authoritative webhook dispatch diagnostics for `CONTACT_SUBMIT`
  - shared-height search/reset controls on Notes and Projects
  - normalized sender identity `xistoh <hello@xistoh.com>`

### Post-T1 follow-up patches

Meaning:

- small exact-v0-consistent public runtime refinements accepted after `T1`
- current repo truth additionally includes:
  - project detail pages now expose the same published-date and estimated read-time metadata grammar already used on note detail pages
  - the change reuses the existing `formatDetailMeta()` contract instead of introducing a second detail-meta path
  - the root favicon/manifest set now includes multi-format browser, touch, Android, and Windows tile assets with live metadata wiring

## Current readiness summary

As of the last final verification:

- codebase status:
  - production-acceptable
- documentation status:
  - canonical docs and governance docs aligned
- unit/build/runtime smoke:
  - passed

Remaining non-code readiness items are environment-specific:

- production deployment must still run the latest migration set on the target DB
- `OPS_WEBHOOK_URL` must point to a real ops relay target in the deployed env
- local disposable Playwright DB at `127.0.0.1:54329` may still need to be restored before full local e2e proof

## How to extend history from here

For future changes:

1. update the relevant canonical docs in `docs/`
2. if the change belongs to an accepted workstream, update the governance docs too
3. add new accepted lineages instead of rewriting historical ones
4. record operational blockers separately from code-complete status
