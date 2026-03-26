# 04. Frontend Mapping

The frontend is split between public content routes and a protected admin dashboard.

## Public routes

- `/`: landing page with featured notes and projects, contact form, and subscription module
- `/notes`: note listing
- `/notes/[slug]`: note detail
- `/projects`: project listing
- `/projects/[slug]`: project detail
- `/subscribe/confirm`: confirmation screen plus POST confirmation action
- `/unsubscribe`: unsubscribe screen plus POST unsubscribe action

## Admin routes

- `/admin/login`: credentials login form
- `/admin`: dashboard landing page
- `/admin/posts`: canonical post list and draft creation surface
- `/admin/posts/[postId]`: canonical content editor route
- `/admin/content`: legacy alias that redirects to `/admin/posts`
- `/admin/content/[postId]`: legacy alias that redirects to `/admin/posts/[postId]`
- `/admin/analytics`: analytics summary
- `/admin/newsletter`: campaign creation, start, retry, and status view
- `/admin/settings`: readiness dashboard rendered from the server readiness payload

## Main component bindings

- `components/portfolio-layout.tsx`: public layout shell used by the landing page
- `components/site/post-card.tsx`: post list card shared by public lists
- `components/site/asset-gallery.tsx`: public render for uploaded images and files
- `components/site/link-previews.tsx`: preview cards for YouTube, GitHub, website, docs, and fallback links
- `components/contact-form.tsx`: binds to `submitContactMessage`
- `components/subscription-module.tsx`: binds to `requestSubscription`
- `components/admin/post-editor.tsx`: canonical admin editor bound to draft, save, and archive actions
- `components/newsletter-manager.tsx`: admin newsletter manager bound to create, start, test, and retry actions
- `components/analytics-tracker.tsx`: client-side pageview, page-load, and heartbeat sender; ignored on `/admin`

## UX rules already implemented

- Admin mutations require authentication before the action executes.
- Subscription and unsubscribe flows do not mutate on GET.
- Public analytics writes use `sendBeacon` first and `fetch(... keepalive)` as fallback.
- Public file downloads go through the signed download route instead of exposing the storage bucket directly.
