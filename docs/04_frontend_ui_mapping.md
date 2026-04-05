# 04. Frontend UI Mapping

This document maps the current user-visible runtime to the active component owners.

## Public routes

### `/`

- owner:
  - `app/page.tsx`
  - `components/v0/public/home-screen-bound.tsx`
  - `components/v0/public/home-screen.tsx`
- behavior:
  - exact-v0 split home
  - recent notes, projects, visitor logs
  - Home-only Instagram when verified
  - inline subscription module

### `/contact`

- owner:
  - `app/contact/page.tsx`
  - `components/v0/public/contact-screen.tsx`
  - `components/v0/public/contact-terminal-form.tsx`
  - `components/v0/public/guestbook-terminal-panel.tsx`
- behavior:
  - contact is canonical contact route
  - guestbook appears only as a lightweight preview/jump
  - Instagram is intentionally absent here

### `/guestbook`

- owner:
  - `app/guestbook/page.tsx`
  - `components/v0/public/guestbook-screen-bound.tsx`
  - `components/v0/public/guestbook-screen.tsx`
  - `components/v0/public/guestbook-screen-client.tsx`
- behavior:
  - standalone canonical guestbook archive
  - latest-first linear rows
  - pagination
  - no public moderation controls

### `/notes`

- owner:
  - `app/notes/page.tsx`
  - `components/v0/public/notes-screen-bound.tsx`
  - `components/v0/public/notes-screen.tsx`
- behavior:
  - search + tag + page query state
  - inline RSS affordance
  - terminal-native subscribe footer

### `/notes/[slug]`

- owner:
  - `components/v0/public/detail-note-screen-bound.tsx`
  - `components/v0/public/detail-note-screen.tsx`
  - `components/v0/public/detail-content.tsx`
  - `components/v0/public/comments-log.tsx`
- behavior:
  - markdown/code/math detail rendering
  - footer-native previous/next note navigation
  - likes
  - paginated comments
  - terminal-native code yank feedback

### `/projects`

- owner:
  - `app/projects/page.tsx`
  - `components/v0/public/projects-screen-bound.tsx`
  - `components/v0/public/projects-screen.tsx`
- behavior:
  - search + tag + page query state
  - project views
  - short description from `excerpt`
  - inline RSS affordance

### `/projects/[slug]`

- owner:
  - `components/v0/public/detail-project-screen-bound.tsx`
  - `components/v0/public/detail-note-screen.tsx`
  - `components/v0/public/detail-content.tsx`
- behavior:
  - same reader shell language as notes
  - code/math/assets/links

### `/subscribe/confirm` and `/unsubscribe`

- owner:
  - `components/v0/public/confirm-subscription-screen-bound.tsx`
  - `components/v0/public/unsubscribe-screen-bound.tsx`
  - `components/v0/public/subscription-result-screen.tsx`
- behavior:
  - explicit lifecycle state machine
  - pending / expired / confirmed / already-subscribed / unsubscribed states

### `/resume.pdf`

- owner:
  - `app/resume.pdf/route.ts`
- behavior:
  - uploaded override first
  - generated fallback second

## Admin routes

### Shared admin shell

- owner:
  - `components/v0/admin/admin-shell.tsx`
- behavior:
  - brand links to `/`
  - switch UI remains removed

### `/admin/posts` and `/admin/posts/[postId]`

- owner:
  - `components/v0/admin/manage-posts-screen.tsx`
  - `components/v0/admin/editor-screen.tsx`
  - `components/admin/post-editor.tsx`
- behavior:
  - paginated content list
  - Markdown-first editor
  - note-only `previous note` selector in the metadata area
  - save/publish/archive/permanent delete
  - unified assets / cover workflow

### `/admin/community`

- owner:
  - `components/v0/admin/community-screen-bound.tsx`
  - `components/v0/admin/community-screen.tsx`
- behavior:
  - comments + guestbook moderation
  - independent pagination
  - normalized delete button sizing

### `/admin/newsletter`

- owner:
  - `components/v0/admin/newsletter-screen-bound.tsx`
  - `components/v0/admin/newsletter-screen.tsx`
  - `components/v0/admin/newsletter-manager.tsx`
- behavior:
  - compose / subscriber / preview views
  - draft queue ordering
  - topics or selected-subscriber targeting
  - send-unsent-only option
  - inline images + file attachments
  - subscriber unsubscribe/delete

### `/admin/settings`

- owner:
  - `components/v0/admin/settings-screen-bound.tsx`
  - `components/v0/admin/settings-screen.tsx`
  - `components/v0/admin/profile-settings-editor.tsx`
- behavior:
  - DB-backed profile editor
  - experience active model is `Short Label + Period`
  - resume upload/remove management

### `/admin/analytics`

- owner:
  - `components/v0/admin/analytics-screen.tsx`
- behavior:
  - key metrics
  - top content
  - readiness diagnostics
  - service log
  - performance diagnostics

## Shared runtime rules

- Light is the default first-load theme.
- `xistoh.log` brand text resolves to `/`.
- Jitter palette is route-owned through runtime descriptors and palette resolver.
- Public mobile uses document scroll; desktop keeps the split-shell model.
- Contact and Guestbook use widened but still exact-v0 column constraints.
- Notes footer, newsletter controls, and terminal controls share control tokens rather than per-screen padding hacks.
- Notes date/meta wrapping is delayed until truly narrow widths.

## Non-literal but accepted UI extensions

These exist because literal `v0app` was insufficient for production behavior:

- search and pagination controls on notes/projects
- RSS affordances on notes/projects
- subscription lifecycle result states
- service log in analytics
- resume upload controls in settings
- unified assets panel in the editor

All of them are intentionally kept inside the same exact-v0 shell grammar and terminal tone.
