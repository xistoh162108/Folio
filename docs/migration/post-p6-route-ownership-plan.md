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
- guestbook/contact ownership
- admin right-panel ownership

All route/runtime changes must conform to this file.

## Current repository truth

### Root ownership

- `app/layout.tsx` is the current metadata and theme root
- the shared runtime provider now mounts from `app/layout.tsx`
- activation is driven by public/admin shell frame registration rather than route-page-owned effect panels
- the shared runtime now preserves the active registration until the next shell frame registers, avoiding blank right-panel gaps during navigation

### Public ownership

- `components/v0/public/public-shell.tsx` owns top nav and theme toggle
- route screens no longer mount right-panel effects directly
- public shell now reserves the right-panel slot and registers its frame with the shared runtime
- `/contact` and `/guestbook` now reuse the same integrated left-column composition
- `/guestbook` is now an anchored route variant that reuses the `/contact` composition instead of owning a second standalone guestbook surface
- note/project detail routes now keep ownership of their left-panel reading surface while the reader itself prefers canonical block documents with legacy fallback

### Admin ownership

- `components/v0/admin/admin-shell.tsx` owns the admin header and sidebar
- admin shell now reserves the right-panel slot and registers its frame with the shared runtime
- admin login uses the same runtime through an admin-access surface
- admin right-panel continuity now exists through the shared runtime
- admin loading, error, and not-found surfaces now inherit fallback right-panel continuity through the shared shell descriptor

## Target ownership model

## Shared app-shell runtime

A new shared post-P6 app-shell runtime mounts once above public and admin shells.

It owns:
- transition coordinator
- persistent Jitter engine
- theme integrity and persistence
- route-level motion state
- continuity between public and admin route transitions

It does not own:
- route-specific content loaders
- route-specific left-panel business data
- per-route editor data binding

### Mounting rule

The shared runtime must:
- mount once at the shared app-shell runtime level
- not be owned by route pages
- not be recreated by layout segment boundaries

This is required to prevent Jitter reset and transition remount drift.

### Frame registration rule

The shared runtime reads measured frame coordinates from the active shell.

Public shell:
- owns the visible left content column
- reserves the right-side panel slot
- registers the slot frame to the shared runtime

Admin shell:
- owns the header, sidebar, and visible left content column
- reserves the right-side panel slot
- registers the slot frame to the shared runtime

This keeps panel ownership out of route pages while preserving exact shell geometry.

## Transition ownership

Transition ownership lives in the shared runtime.

Rules:
- route pages do not create their own page-replacement transitions
- shared-element-like continuity is preferred
- key text uses scramble/progressive reveal
- secondary text uses low-amplitude continuity
- generic fade/scale is forbidden

Current implementation note:
- E3 establishes centralized runtime ownership and right-panel continuity as the active foundation
- broader left-panel text choreography remains incremental and must not be approximated with route-local replacement animations

### Stable transition anchors

The shared runtime coordinates continuity for:
- section labels
- titles
- list rows
- footer bars
- right-panel overlays

These are continuity anchors, not permission to redesign the underlying layout.

## Persistent Jitter ownership

The persistent Jitter engine is a shared runtime primitive.

### Engine contract

The engine accepts route descriptors only:
- `mode`
- `variant`
- `overlay`
- optional transformation hints

Route pages must not:
- mount their own right-panel canvas/shader stack after E3
- reset Jitter state on navigation
- own contact/admin right-panel lifecycle

### Mode mapping

- home -> dithering
- notes -> dithering variant
- projects -> dithering variant
- contact -> Life Game transformation mode
- admin -> same engine with admin-safe overlays and continuity rules

### Contact rule

Entering contact transforms the current Jitter field into Life Game.

Forbidden:
- unmounting the old panel
- replacing the panel with a fresh canvas
- hard reset of the field state

### Admin rule

Every admin screen must have the same right-side Jitter presence as public screens.
No admin route may ship without the shared right panel once E3 is complete.

## Route-by-route ownership

### Public

`/`
- public shell + shared runtime
- route provides home content and home Jitter descriptor

`/notes`
- public shell + shared runtime
- route provides notes list content and notes Jitter descriptor

`/projects`
- public shell + shared runtime
- route provides project list content and projects Jitter descriptor

`/contact`
- public shell + shared runtime
- route owns contact content
- shared runtime owns transformed Life Game right panel
- integrated guestbook lives under this route composition

`/guestbook`
- public shell + shared runtime
- reuses the `/contact` integrated composition
- guestbook section is the default focus/anchor state
- this is an anchored route variant, not a second standalone guestbook design

`/notes/[slug]` and `/projects/[slug]`
- public shell + shared runtime
- route owns content/detail data
- route provides detail-mode Jitter descriptor

### Admin

`/admin/login`
- admin shell-adjacent access surface + shared runtime
- shared runtime still owns right-side Jitter continuity

`/admin/analytics`
- admin shell + shared runtime
- route owns analytics content
- readiness/diagnostics belong here if retained

`/admin/posts`
- admin shell + shared runtime
- route owns list data and list interactions
- shared runtime owns right-side Jitter presence and continuity

`/admin/posts/[postId]`
- admin shell + shared runtime
- route owns v0 content subtree and the active Markdown-first editor adapter host
- shared runtime owns continuity and right-side Jitter

`/admin/newsletter`
- admin shell + shared runtime
- route owns newsletter data/actions

`/admin/settings`
- admin shell + shared runtime
- route owns real Profile/CV editing inside the v0 settings shell
- readiness/diagnostics no longer own this route

`/admin/community`
- admin shell + shared runtime
- route owns community moderation content

## Ownership change sequence

- E3 introduces the shared runtime and persistent Jitter ownership
- E4 moves contact/guestbook to the integrated ownership model
- E5 and E6 keep route data ownership while the shared runtime stays stable
- E7 reassigns `/admin/settings` from readiness-centric ownership to Profile/CV ownership
- E8 validates that no route still owns an obsolete per-screen effect runtime

## Guardrails

Forbidden after E3:
- route-local right-panel effect ownership
- missing admin right panel
- route-controlled theme remounts
- duplicate guestbook composition
- separate public/admin transition stacks

Required after E3:
- one shared runtime
- one persistent Jitter engine
- route descriptors instead of route-owned effect panels
- theme integrity at the runtime root

## Acceptance rules

Ownership acceptance requires:
- right panel continuity across public and admin navigation
- no route-page-owned Jitter remounts
- no layout-segment remount drift
- `/guestbook` and `/contact` use the same composition
- `/admin/settings` owns Profile/CV, not readiness, once E7 is complete

## Defaults

- `app/layout.tsx` remains metadata/theme root
- shared runtime sits above public/admin shells, not above the whole React tree indiscriminately
- route pages remain responsible for data and left-panel content
- right-panel and transition continuity are centralized
