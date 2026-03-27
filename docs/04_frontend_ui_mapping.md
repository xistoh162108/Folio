# 04. Frontend Mapping

The frontend is split between a public reading/product surface and a protected admin dashboard. The brand label shown in the UI is `xistoh.log`, while the canonical runtime URL is `https://xistoh.com`.

## Public routes

- `/`
  - v0 split-panel identity home
  - compact recent notes list
  - inline compact subscription module
- `/contact`
  - split-panel terminal contact route
  - integrated contact + guestbook composition
- `/notes`
  - notes-only v0 row list
- `/notes/[slug]`
  - v0 note detail
- `/projects`
  - projects-only v0 list
- `/projects/[slug]`
  - v0 project detail
- `/guestbook`
  - anchored guestbook view reusing the `/contact` composition
- `/subscribe/confirm`
  - token result page
- `/unsubscribe`
  - token result page
- `/resume.pdf`
  - generated PDF route

## Admin routes

- `/admin/login`
  - credentials login
- `/admin`
  - admin landing page
- `/admin/posts`
  - canonical post list
  - draft creation
  - search, type filter, status filter, pagination
- `/admin/posts/[postId]`
  - canonical editor route
- `/admin/community`
  - moderation for comments and guestbook
- `/admin/analytics`
  - dashboard for pageviews, dwell, latency, realtime, referrers, top content
  - readiness / diagnostics terminal surface
- `/admin/newsletter`
  - campaign creation, test send, start, retry, delivery status
- `/admin/settings`
  - Profile / CV editor
- `/admin/content`
  - draft-creation entrypoint that redirects into `/admin/posts/[postId]`
- `/admin/content/[postId]`
  - redirect alias to `/admin/posts/[postId]`

## Main public component bindings

- `components/v0/runtime/v0-experience-runtime.tsx`
  - shared app-shell runtime owning right-panel continuity and theme integrity
- `components/v0/public/public-shell.tsx`
  - canonical public shell for migrated public routes
- `components/v0/public/home-screen.tsx`
  - v0 home layout
- `components/v0/public/home-screen-bound.tsx`
  - binds homepage live data into the v0 home shell
- `components/v0/public/contact-screen.tsx`
  - v0 contact shell and live terminal form with integrated guestbook terminal block
- `components/v0/public/notes-screen.tsx`
  - v0 notes list with literal sticky subscribe footer
- `components/v0/public/notes-screen-bound.tsx`
  - binds published notes into the v0 notes list
- `components/v0/public/projects-screen.tsx`
  - v0 projects list
- `components/v0/public/projects-screen-bound.tsx`
  - binds published projects into the v0 projects list
- `components/v0/public/detail-note-screen.tsx`
  - v0 note detail shell
- `components/v0/public/detail-content.tsx`
  - v0-style live note content renderer
- `components/v0/public/detail-note-screen-bound.tsx`
  - binds real note detail data, likes, comments, links, and assets
- `components/v0/public/detail-project-screen.tsx`
  - v0 project detail shell
- `components/v0/public/detail-project-screen-bound.tsx`
  - binds real project detail data, likes, comments, and assets
- `components/v0/public/guestbook-screen.tsx`
  - v0-language guestbook surface
- `components/v0/public/guestbook-screen-bound.tsx`
  - binds guestbook write and moderation flows inside the anchored contact composition
- `components/v0/public/confirm-subscription-screen-bound.tsx`
  - binds token confirmation flow into the v0 result shell
- `components/v0/public/unsubscribe-screen-bound.tsx`
  - binds unsubscribe flow into the v0 result shell
- `components/v0/public/post-like-button.tsx`
  - binds to like API
- `components/v0/public/comments-log.tsx`
  - binds to comment create + PIN delete
- `components/analytics-tracker.tsx`
  - pageview, pageload, heartbeat sender; skipped on admin routes

## Main admin component bindings

- `components/v0/admin/admin-shell.tsx`
  - canonical admin shell and navigation
- `components/v0/admin/manage-posts-screen.tsx`
  - canonical admin post list shell
- `components/v0/admin/editor-screen.tsx`
  - canonical admin editor shell
- `components/admin/post-editor.tsx`
  - runtime adapter for draft/save/archive and upload/link flows inside the v0 editor shell
- `components/admin/tiptap-editor.tsx`
  - TipTap editing surface inside the v0 editor shell
- `components/v0/admin/newsletter-manager.tsx`
  - newsletter manager UI
- `components/v0/admin/settings-screen.tsx`
  - real Profile / CV editor shell
- `components/v0/admin/profile-settings-editor.tsx`
  - DB-backed structured profile CRUD + reorder UI inside the v0 settings shell

## Current UX rules

- Admin mutations require authentication before execution.
- Subscription confirm and unsubscribe do not mutate on GET.
- Public analytics uses `sendBeacon` first and `fetch(... keepalive)` fallback.
- Public file downloads always go through the signed download route.
- Comments and guestbook use honeypot protection.
- Community moderation is admin-only.
- Home, contact, guestbook, admin settings, and `resume.pdf` share one DB-backed profile runtime source.
- Public routes emit route-level metadata; note/project detail routes also emit article metadata and JSON-LD.
- Admin routes emit noindex metadata.

## Runtime notes

- `/notes` and `/projects` are the only public knowledge surfaces.
- `/contact` is the canonical public contact route.
- `/knowledge` is removed from product IA and permanently redirected to `/notes`.
- `app/sitemap.ts` and `app/robots.ts` reflect the shipped IA and canonical host.
- previously excluded suffixed duplicate files were removed during cleanup and are not part of the current runtime.
