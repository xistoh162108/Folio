# v0 Fidelity Production Migration Spec

## Status

- Approved for execution
- Last updated: 2026-03-27
- Canonical migration authority: this file

## Authority and execution rule

This document is the active source of truth for the v0 fidelity migration.

Implementation, review, and cutover decisions must conform to this file.
If implementation reveals a conflict, ambiguity, or feasibility issue, it must be recorded here and in `docs/migration/v0-audit-log.md` before the implementation is allowed to diverge.

This migration must not be executed in an undocumented way.
No phase is complete unless:
- the relevant phase entry is updated in `docs/migration/v0-phase-tracker.md`
- the relevant audit entry is updated in `docs/migration/v0-audit-log.md`

## Top-level goal

Ship a production-grade application that preserves the exact v0 UI.

This is not a mood-preservation exercise.
This is not a "spirit of v0" exercise.
This is not an approximation exercise.

The goal is:

- same UI
- same composition
- same shell language
- same typography rhythm
- same spacing
- same motion/effects
- same interaction feel

while upgrading the implementation from mock/demo behavior to real production behavior:

- real backend integration
- real auth boundaries
- real loading/error/empty/result handling
- real content state
- real newsletter/contact/community/admin workflows
- real route behavior
- production-safe edge-case handling

None of those production concerns may visually degrade, reinterpret, or redesign the v0 output.

## Non-negotiable constraints

### 1. v0 is the visual source of truth

The visual source of truth is:

- `v0app/app/page.tsx`
- `v0app/components/subscription-module.tsx`
- `v0app/components/newsletter-manager.tsx`
- `v0app/components/digital-rain.tsx`
- `v0app/components/text-scramble.tsx`

### 2. Literal extraction first, reuse later

When a production screen maps to a specific v0 view, its first implementation must be derived from the closest literal subtree in `v0app/app/page.tsx`, and only its directly supporting v0 components where necessary.

Do not:
- synthesize a screen from multiple v0 views
- redesign spacing or typography to fit the current system
- build a reusable abstraction first and then tune it toward v0
- rebuild from "understood intent"

Do:
- copy the closest literal subtree
- preserve DOM structure and class composition
- bind real data into that exact output
- validate parity
- only then extract shared pieces if the output stays identical

### 3. Consistency rule

Do not partially migrate visual systems.

For the public route group:
- all surfaces must use the same v0 public shell and primitive language

For the admin route group:
- all surfaces must use the same v0 admin shell and primitive language

Never allow:
- mixed old/new UI on the same route
- mixed visual systems across sibling routes

### 4. Domain rule

- display/service name: `xistoh.log`
- canonical/auth/email-link URL: `https://xistoh.com`

Do not use `xistoh.log` as a runtime URL.

## Current repository findings

### Runtime architecture

The production app is a real route-based Next.js App Router application with a functioning backend.

Key runtime areas:
- public routes under `app/`
- admin routes under `app/(dashboard)/admin` and `app/admin/login`
- backend actions under `lib/actions`
- read models/loaders under `lib/data`
- APIs and workers under `app/api`

### Backend/content model

`PostKind` is only:
- `NOTE`
- `PROJECT`

There is no `KNOWLEDGE` content type.

`/knowledge` was only an aggregate frontend route over published posts. It is removed from the live runtime and retained only as a compatibility redirect to `/notes`.

### Existing frontend abstractions are not authoritative

If an existing shared component is not pixel-faithful to v0, it must be replaced or bypassed.

This includes:
- `components/site/site-header.tsx`
- `components/site/post-card.tsx`
- `components/site/post-detail-view.tsx`
- `components/site/signal-panel.tsx`
- `components/site/contact-panel.tsx`
- `components/admin/admin-nav.tsx`
- `components/admin/posts-management-shell.tsx`
- `components/admin/post-editor.tsx`
- `components/newsletter-manager.tsx`
- `components/ui/*`

## Public information architecture

The public information architecture is:

- `/`
- `/contact`
- `/notes`
- `/notes/[slug]`
- `/projects`
- `/projects/[slug]`
- `/guestbook`
- `/subscribe/confirm`
- `/unsubscribe`

`/knowledge` is removed from product scope.

## Route-to-v0 mapping

### Public

- `/`
  - maps to the `publicPage === "home"` subtree
  - fidelity target: exact preserve + bind live data

- `/contact`
  - maps to the `publicPage === "contact"` subtree
  - fidelity target: exact preserve + bind live data

- `/notes`
  - maps to the `publicPage === "notes"` subtree
  - fidelity target: exact preserve + bind live data

- `/projects`
  - maps to the `publicPage === "projects"` subtree
  - fidelity target: exact preserve + bind live data

- `/notes/[slug]`
  - maps to the `publicPage === "post-detail"` subtree
  - fidelity target: exact preserve + add real comments/assets/links

- `/projects/[slug]`
  - maps to the `publicPage === "project-detail"` subtree
  - fidelity target: exact preserve + add real previews/assets

- `/guestbook`
  - no direct v0 route equivalent
  - must be extended in exact public v0 language using the closest log/terminal patterns

- `/subscribe/confirm`
  - no direct v0 route equivalent
  - must be extended in exact public v0 language

- `/unsubscribe`
  - no direct v0 route equivalent
  - must be extended in exact public v0 language

### Admin

- `/admin/login`
  - no direct route equivalent
  - must be rendered as an exact admin terminal access surface

- `/admin/analytics`
  - maps to the `adminSection === "overview"` subtree
  - fidelity target: exact preserve + bind live data

- `/admin/posts`
  - maps to the `adminSection === "manage-posts"` subtree
  - fidelity target: exact preserve + bind live data

- `/admin/posts/[postId]`
  - maps to the `adminSection === "content"` subtree
  - fidelity target: exact preserve + add real editor state

- `/admin/newsletter`
  - maps to the `adminSection === "newsletter"` subtree
  - fidelity target: exact preserve + bind live data

- `/admin/settings`
  - maps to the `adminSection === "settings"` subtree
  - fidelity target: exact preserve + add real readiness payload

- `/admin/community`
  - no direct route equivalent
  - must be extended in exact admin terminal language using the closest manage-posts/newsletter row patterns

## Shared primitive policy

### Safe first-pass hosts

Only these may be introduced before parity is proven:

- `components/v0/public/public-shell.tsx`
- `components/v0/admin/admin-shell.tsx`
- `components/v0/effects/dithering-panel.tsx`
- `components/v0/effects/digital-rain-panel.tsx`
- `components/v0/effects/text-scramble-panel.tsx`

### Deferred extraction targets

These may only be extracted after literal screen parity is demonstrated:

- terminal row
- metadata row
- section frame
- action row
- terminal field
- state shell
- progress shell
- editor scaffold

## Brand identity and design philosophy guardrails

- keep the monochrome terminal language
- keep compact density and split-panel hierarchy
- treat effect panels as part of the shell, not optional decoration
- absorb production complexity into row, log, tab, footer, and meta language
- do not reintroduce cards, widgets, dashboard blocks, or SaaS chrome

## Recovery and hold rules

### Rollback / hold rule

- if a direct-match route fails parity review, do not merge a mixed fallback
- keep the route in hold status and continue correcting the literal subtree implementation
- reintroducing legacy shell fragments is forbidden
- old shell rollback is forbidden; only the new literal subtree may be corrected

### Reject handling rule

If a direct-match route is rejected in parity review:
- record reject status in `docs/migration/v0-audit-log.md`
- mark the route or phase hold state in `docs/migration/v0-phase-tracker.md`
- record the exact divergence and the fix direction
- require re-review before phase acceptance

### Theme integrity rule

- initial theme must match persisted state without flash-of-incorrect-theme
- no hydration mismatch or visible theme flicker is allowed
- theme toggle must update in place without route reload or hard refresh

### Verified external profile links rule

- all external profile links must come from verified production sources
- no guessed URLs are allowed
- if not verified, keep intentional non-link or disabled affordance
- this rule applies to LinkedIn, GitHub, Instagram, and similar profile links

## Direct-match admin recovery rules

### Admin manage-posts control placement rule

- search must live in the top command row
- filter tokens must remain inline and compact
- counts and pagination must live in footer or status rows
- bulk or secondary actions must remain in action or footer rows
- no production control may become a standalone panel, summary block, or dashboard widget

### Production-only field placement priority

For editor-only production fields such as cover URL, links, and assets:
1. absorb into existing v0 tabs
2. use terminal-style collapsed support blocks
3. use footer, status, or meta areas

Forbidden:
- standalone cards
- side panels
- large config sections that alter the primary v0 hierarchy

### Direct-match parity state requirements

For `/admin/posts`, capture and review at least:
- default populated state
- search active state
- filtered state
- empty-result state
- paginated non-first-page state

For `/admin/posts/[postId]`, capture and review at least:
- default edit state
- project toggle variants
- upload pending state
- validation or error state
- publish-ready state

## Parity capture and design CI

### Parity capture state set

For every audited route, capture at least:
- default populated state
- loading or pending state where applicable
- empty state where applicable
- error or result state where applicable
- theme variants if supported

### Deterministic capture rule

Deterministic capture mode may fix:
- animation timing
- effect seed or state
- time or date-dependent output
- parity-only test input data

It must not alter production UX behavior.

### Design CI

Design parity automation is tracked in:
- `.github/workflows/design-parity.yml`

Minimum CI gate:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm parity:capture`
- `pnpm ops:smoke`
- the required public/admin E2E subset

## Backend-state UI rules

All production states are mandatory.
All production states must render in v0 language.

### Allowed

- real loading states
- real error states
- real empty states
- real auth-required states
- real upload/progress states
- real moderation/delivery/result states

### Required rendering style

- loading: v0 command/status text
- error: bracketed terminal feedback
- empty: terminal sentence or thin framed block
- auth: redirect or terminal access gate
- progress: exact v0 editor/newsletter language
- moderation/delivery/result: rows/logs/tables, not dashboard cards

### Forbidden

- generic spinners as primary route-state UI
- skeleton-card systems
- generic alert cards
- SaaS progress bars
- rounded dashboard empty states
- fallback UI that is visually outside v0

## Migration phases

- P1: v0 literal extraction scaffold
- P2: public screen bindings
- P3: public atomic cutover + `/knowledge` removal
- P4: admin screen bindings
- P5: admin atomic cutover
- P6: parity lock, cleanup, and post-cutover stabilization

Detailed execution tracking lives in `docs/migration/v0-phase-tracker.md`.

## Cutover gate rule

P3 and P5 may not ship unless all cutover gates pass.

Required cutover gates:
- screenshot parity reviewed against v0 reference states
- full sibling-route consistency confirmed
- no legacy shell remains in the cutover group
- redirect/link/canonical changes verified
- no non-v0 fallback UI remains

## Acceptance rules

### Public group

Public is not complete until all of these are on one v0-faithful public shell:

- `/`
- `/contact`
- `/notes`
- `/notes/[slug]`
- `/projects`
- `/projects/[slug]`
- `/guestbook`
- `/subscribe/confirm`
- `/unsubscribe`

### Admin group

Admin is not complete until all of these are on one v0-faithful admin shell:

- `/admin/login`
- `/admin/analytics`
- `/admin/posts`
- `/admin/posts/[postId]`
- `/admin/newsletter`
- `/admin/settings`
- `/admin/community`

## `/knowledge` removal impact analysis

### Summary

`/knowledge` is removed entirely.
It must not remain as:
- a live route
- an aggregate UI
- a fallback information architecture
- a temporary compatibility surface

Compatibility handling is allowed only as a redirect.

### Affected routes/files

Remove or update:
- `app/knowledge/page.tsx`
- `app/page.tsx`
- `components/site/site-header.tsx`
- `docs/00_system_overview.md`
- `docs/01_core_architecture.md`
- `docs/04_frontend_ui_mapping.md`
- `docs/06_release_checklist.md`
- `e2e/smoke.spec.ts`

### Affected frontend components

No dedicated reusable knowledge-screen component exists in current runtime.
The main impact is:
- route deletion
- link removal
- copy removal
- CTA replacement

### Affected backend/data/query paths

Delete:
- `getPublishedKnowledgePosts()` from `lib/data/posts.ts`

Do not delete:
- `getPublishedPostsByType()`
- `getHomepagePosts()`
- `getPublishedPostDetail()`
- admin post queries
- post DTOs
- Prisma schema
- actions or APIs tied to posts

There is no `KNOWLEDGE` type to remove.

### Redirect handling

Default compatibility handling:
- permanent redirect `/knowledge -> /notes`

Only allowed alternate destination:
- `/`, if repository-specific backlink/audience analysis proves it is safer

### SEO / analytics / internal links

- remove `/knowledge` canonical metadata
- update internal navigation and homepage CTAs
- update tests that assert `/knowledge`
- historical analytics rows for `/knowledge` may remain in storage; no schema change is needed
- audit DB-stored rich content for hard-coded `/knowledge` links before release

### Admin/editor dependency

No admin/editor workflow depends on `/knowledge`.
Admin uses `NOTE | PROJECT` directly.

### Blast-radius assessment

- frontend route/UI: low
- backend/data layer: low
- admin/editor workflows: none
- SEO/internal-link risk: low with redirect, medium without redirect
- overall: low if redirect and content-link audit are included

## Red flags

Do not:
- approximate v0
- preserve only the mood of v0
- mix old and new shells in a cutover group
- build shared abstractions first
- keep `/knowledge` as a live IA branch
- let production concerns justify visual drift

## Documentation-driven execution rule

This migration is governed by three documents:

- `docs/migration/v0-fidelity-production-migration-spec.md`
- `docs/migration/v0-phase-tracker.md`
- `docs/migration/v0-audit-log.md`

Execution rules:
- implementation must reference this spec
- progress must be recorded in the phase tracker
- review, parity checks, accept/reject decisions, and deviations must be recorded in the audit log
- no phase may be marked done without tracker and audit updates
- no silent divergence is allowed
