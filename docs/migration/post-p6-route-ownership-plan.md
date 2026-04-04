# Post-P6 Route Ownership Plan

## Status

- Approved for execution
- Last updated: 2026-04-05
- Canonical route/runtime ownership authority: this file

## Purpose

This document defines:
- shared app-shell runtime ownership
- route ownership boundaries
- persistent Jitter ownership
- transition ownership
- viewport-class shell ownership
- `/contact` and `/guestbook` product ownership

All route/runtime changes must conform to this file.

## 2026-04 hardening route addendum (H1-H7)

This addendum records the first load-bearing route changes after the accepted `R1-R9` baseline.

### Public ownership addendum

- the public/admin brand mark is a route action and resolves to `/`
- `/contact` remains self-canonical and no longer exposes Instagram
- `/guestbook` remains self-canonical and owns the full guestbook archive
- Home now owns recent notes, recent projects, and recent visitor logs in one public surface

### Query-state ownership addendum

`/notes` and `/projects` now own query-driven public list state:

- `q`
- `tag`
- `page`

Rules:

- base route remains the canonical owner
- filtered/paginated query states are functional route states, not new route families
- filtered/paginated query states must be `noindex`

### Feed ownership addendum

RSS is a native publishing feature and lives on:

- `/notes/rss.xml`
- `/projects/rss.xml`

Rules:

- feed discovery belongs to the Notes and Projects route metadata owners
- RSS does not create a second home/blog surface
- RSS affordances stay inline and terminal-native on the Notes and Projects screens

### Community ownership addendum

- note/project detail routes own the first page of comments and pass pagination state into the client log
- `/api/posts/[postId]/comments` owns paginated comment reads and comment writes
- `/api/guestbook` owns paginated guestbook reads and guestbook writes
- `/admin/community` owns two independent moderation page states:
  - `commentPage`
  - `guestbookPage`

### Admin content ownership addendum

- `/admin/posts/[postId]` keeps save, publish, archive, delete, upload, insert, and cover-selection behavior inside the same editor shell
- permanent delete is an editor-owned destructive action and does not move to a separate moderation route
- uploaded assets remain owned by the editor support block; no second asset-manager surface is introduced

### Published detail ownership addendum

- note/project detail routes own the final rendered code/math output for published content
- reader copy affordances stay inline and terminal-native:
  - `[yank]`
  - `[yanked]`

### Profile / resume ownership addendum

- `/admin/settings` owns direct resume upload/remove management inside the existing settings shell
- `/api/admin/profile/resume` owns admin-only resume override writes and removals
- `/resume.pdf` remains the single canonical public resume route
- `/resume.pdf` resolves to:
  - uploaded private resume override first
  - generated profile resume fallback second
- no second public resume route or alternate canonical is introduced

Read-path rule:

- public/read-only resume override lookup must fail open to the generated resume fallback when storage is unavailable or unreadable
- admin resume upload/remove writes remain fail-closed so storage defects still surface as operational errors

### Newsletter ownership addendum

- public subscribe request surfaces keep the existing route family and now own explicit stateful result language:
  - `/subscribe/confirm`
  - `/unsubscribe`
- `/admin/newsletter` remains the single admin newsletter surface and now owns:
  - draft campaign composition
  - queue ordering
  - selected-recipient targeting
  - send-unsent-only reruns
  - subscriber unsubscribe/delete
  - campaign preview inside the same v0 shell
- `/api/admin/newsletter/uploads` owns newsletter asset writes
- `/api/worker/newsletter` owns attachment-aware campaign dispatch

Ownership rules:

- newsletter compose/preview does not move into a second mail-builder route
- topic selection and selected-recipient targeting stay inside `/admin/newsletter`
- asset upload remains inline to the newsletter route rather than becoming a separate asset-manager surface
- public subscribe affordances stay embedded in Notes/Projects/public terminal strips instead of moving into a separate marketing route family

### Analytics / admin scroll ownership addendum

- `/admin/analytics` now owns:
  - readiness diagnostics
  - performance diagnostics
  - lightweight service-log projection
- the service log is read-only and derived from existing operational tables; it does not create a second ops surface
- `/admin/posts`, `/admin/posts/[postId]`, `/admin/settings`, `/admin/newsletter`, and `/admin/community` now keep the shell primary pane as the vertical scroll owner through explicit `min-h-0` wrapper containment

Ownership rules:

- service diagnostics remain inside `/admin/analytics` and do not move into a separate monitoring route
- admin shell fixes remain containment/scroll-owner corrections only
- no modal/drawer/card workaround is introduced for long admin surfaces

## Current repository truth

### Root ownership

- `app/layout.tsx` is the metadata/theme root.
- `components/v0/runtime/v0-experience-runtime.tsx` already mounts from the root tree.
- Public/admin shells now register a right-panel slot and a measured fallback frame into the runtime.
- The runtime now portals a persistent engine into the active slot as the primary ownership model.
- A measured fixed overlay is retained only as a handoff fallback when the old shell unmounts before the next slot registers.

### Public ownership

- `components/v0/public/public-shell.tsx` owns the current public shell.
- `/guestbook` is now a standalone public route with its own full log surface.
- `/contact` now keeps only a compact guestbook preview/jump.
- Public shell now uses `100svh` height ownership with:
  - exact desktop-wide split parity at `lg`
  - a 56/44 content-to-Jitter split on tablet widths
  - a stacked mobile shell with a condensed Jitter band

### Admin ownership

- `components/v0/admin/admin-shell.tsx` owns the current admin shell.
- `components/v0/admin/login-screen.tsx` uses a similar split geometry.
- Admin shell and admin access shell now use `100svh` height ownership with:
  - exact desktop-wide split parity at `lg`
  - a 56/44 content-to-Jitter split on tablet widths
  - a stacked mobile shell with a condensed Jitter band
- Admin mobile now expresses navigation as a horizontal command strip rather than a sidebar.

## Shared runtime ownership

The shared runtime mounts once above public/admin shell segment boundaries.

It owns:
- transition coordinator
- persistent Jitter engine
- theme integrity and persistence
- route-level motion state

It does not own:
- route-specific business data fetching
- left-column content composition
- editor data binding

### Critical mount rule

The shared runtime must:
- mount once above route segment boundaries that would otherwise recreate the right-panel engine
- not be owned by route pages
- not be recreated by layout changes

## Persistent Jitter ownership

### Target ownership model

Replace the fixed overlay/frame-copy ownership with:
- one persistent runtime-owned engine
- one active shell slot registration
- portal-based placement into the active shell slot

Shell responsibilities:
- expose a stable slot ref
- reserve geometry for the slot
- never own a visual engine instance

Runtime responsibilities:
- keep a single engine instance alive
- portal it into the active slot
- own interpolation between route descriptors

### Transition ownership

Route pages provide:
- text continuity descriptor
- Jitter mode descriptor

The shared runtime owns:
- route-to-route interpolation state
- continuity timing
- right-panel lifecycle

Generic fade/scale ownership at the route level is forbidden.

## Viewport ownership model

Viewport classes:
- desktop-wide
- desktop-standard
- desktop-tall/pivot
- tablet-landscape
- tablet-portrait
- mobile-landscape
- mobile-portrait

### Shell ownership by viewport

Desktop/tablet:
- split layout remains
- right-side Jitter identity remains visible

Mobile:
- Jitter is not deleted
- shell becomes stacked:
  - header
  - command strip
  - condensed Jitter band
  - content

Current implementation note:
- `R3` now applies this stacked-shell rule to public/admin/admin-access shells while preserving the desktop split at `lg`.
- `R4` now applies the standalone guestbook ownership rule while keeping `/contact` and `/guestbook` in the same shell/runtime world.

Admin mobile:
- no drawer
- no hamburger
- no SaaS app-shell redesign
- sidebar becomes a horizontal command strip

### Tall desktop rule

Tall/pivot desktop keeps split layout and exact split identity.
The shell body must own the geometry so the Jitter slot fills the full intended vertical region below the header without clipping.

## Route-by-route ownership

### Public routes

`/`
- public shell + shared runtime
- route owns home content
- route provides home text/Jitter descriptors

`/notes`
- public shell + shared runtime
- route owns dense list content
- route provides notes descriptors
- route also owns Notes list query state (`q`, `tag`, `page`) and Notes RSS discovery

`/projects`
- public shell + shared runtime
- route owns dense list content
- route provides projects descriptors
- route also owns Projects list query state (`q`, `tag`, `page`) and Projects RSS discovery

`/contact`
- public shell + shared runtime
- route owns contact content
- guestbook appears only as a compact preview/jump
- route provides contact/Life descriptors

`/guestbook`
- public shell + shared runtime
- separate canonical public route
- same design world as contact
- no public admin controls
- full guestbook log ownership lives here
- paginated latest-first archive ownership lives here

`/notes/[slug]` and `/projects/[slug]`
- public shell + shared runtime
- route owns detail data and reading surface
- route provides detail-mode descriptors
- detail routes own the first page of comments while `/api/posts/[postId]/comments` owns older-page retrieval

### Admin routes

`/admin/login`
- admin-access shell surface + shared runtime
- same persistent Jitter continuity model

`/admin/analytics`
- admin shell + shared runtime
- route owns analytics content
- readiness/diagnostics belong here

`/admin/posts`
- admin shell + shared runtime
- route owns list data/interactions
- runtime owns right-panel continuity

`/admin/posts/[postId]`
- admin shell + shared runtime
- route owns v0 content subtree and Markdown-first editor host
- runtime owns right-panel continuity

`/admin/settings`
- admin shell + shared runtime
- route owns Profile/CV editing

`/admin/newsletter`
- admin shell + shared runtime
- route owns newsletter data/actions

`/admin/community`
- admin shell + shared runtime
- route owns moderation content
- route owns independent `commentPage` / `guestbookPage` query state for scalable moderation

## Ownership change sequence

- `R2` introduces slot registration, engine persistence, route interpolation, and tall-screen geometry correction
- `R3` adapts the shell ownership model across viewport classes without changing the design language
- `R4` separates `/guestbook` from `/contact` while keeping both inside the same runtime/shell world
- `R7` validates `/admin/settings` as the Profile/CV owner with corrected scroll/runtime containment
- `R9` confirms that no route still depends on obsolete route-local panel assumptions

## Guardrails

Forbidden after `R2`:
- route-local right-panel engine ownership
- missing admin right panel
- route-driven engine remounts
- duplicate contact/guestbook composition ownership

Required after `R2`:
- one shared runtime
- one persistent Jitter engine
- shell slot registration instead of route-owned effects
- centralized transition ownership
- `100svh` shell geometry on public/admin desktop shells

Required after `R3`:
- public/admin/admin-access shells adapt coherently across desktop, tablet, and mobile viewport classes
- desktop-wide parity remains locked
- admin mobile navigation remains in horizontal command-strip language only

## Acceptance rules

Ownership acceptance requires:
- no route-page-owned Jitter remounts
- one persistent engine instance across route changes
- coherent shell behavior across viewport classes
- `/guestbook` and `/contact` no longer competing as duplicate full guestbook surfaces
- admin mobile uses a horizontal command strip, not a drawer/hamburger redesign

## Defaults

- `app/layout.tsx` remains the root metadata/theme owner
- route pages remain responsible for left-column content and data
- right-panel and transition continuity remain centralized in the shared runtime
