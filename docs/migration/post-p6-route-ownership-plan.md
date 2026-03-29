# Post-P6 Route Ownership Plan

## Status

- Approved for execution
- Last updated: 2026-03-28
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

`/projects`
- public shell + shared runtime
- route owns dense list content
- route provides projects descriptors

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

`/notes/[slug]` and `/projects/[slug]`
- public shell + shared runtime
- route owns detail data and reading surface
- route provides detail-mode descriptors

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
