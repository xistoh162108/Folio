# 08. Feature Inventory

This is the current feature-level inventory of the shipped codebase.

## Public publishing

| Feature ID | Surface | Status | Source of truth | External dependency |
| --- | --- | --- | --- | --- |
| `FEAT-PUBLIC-HOME-COMPOSITION` | `/` | implemented | `lib/data/posts.ts`, `components/v0/public/home-screen*.tsx` | DB |
| `FEAT-PUBLIC-NOTES-SEARCH` | `/notes` | implemented | `lib/data/posts.ts`, `app/notes/page.tsx` | DB |
| `FEAT-PUBLIC-PROJECTS-SEARCH` | `/projects` | implemented | `lib/data/posts.ts`, `app/projects/page.tsx` | DB |
| `FEAT-PUBLIC-NOTES-PAGINATION` | `/notes` | implemented | `lib/data/posts.ts` | DB |
| `FEAT-PUBLIC-PROJECTS-PAGINATION` | `/projects` | implemented | `lib/data/posts.ts` | DB |
| `FEAT-PUBLIC-TAGS` | `/notes`, `/projects` | implemented | `Tag`, `lib/data/posts.ts` | DB |
| `FEAT-PUBLIC-RSS-NOTES` | `/notes/rss.xml` | implemented | `lib/feeds/rss.ts` | none |
| `FEAT-PUBLIC-RSS-PROJECTS` | `/projects/rss.xml` | implemented | `lib/feeds/rss.ts` | none |
| `FEAT-PUBLIC-CODE-MATH-RENDER` | note/project detail | implemented | `lib/content/markdown-blocks.ts`, `lib/content/math-render.ts` | none |

## Community

| Feature ID | Surface | Status | Source of truth | External dependency |
| --- | --- | --- | --- | --- |
| `FEAT-GUESTBOOK-STANDALONE` | `/guestbook` | implemented | `components/v0/public/guestbook-screen*.tsx` | DB |
| `FEAT-GUESTBOOK-PAGINATION` | `/guestbook`, `/api/guestbook` | implemented | `lib/data/guestbook.ts`, route handler | DB |
| `FEAT-COMMENTS-PAGINATION` | note detail | implemented | `lib/data/posts.ts`, `/api/posts/[postId]/comments` | DB |
| `FEAT-COMMUNITY-ADMIN-PAGINATION` | `/admin/community` | implemented | `lib/data/community.ts` | DB |
| `FEAT-COMMENT-PIN-DELETE` | note detail | implemented | `/api/comments/[commentId]/delete` | DB |

## Profile and resume

| Feature ID | Surface | Status | Source of truth | External dependency |
| --- | --- | --- | --- | --- |
| `FEAT-PROFILE-DB-RUNTIME` | Home/Contact/Guestbook/Settings | implemented | `lib/data/profile.ts` | DB |
| `FEAT-PROFILE-HOME-INSTAGRAM` | `/` | implemented | `lib/profile/public-links.ts` | DB |
| `FEAT-PROFILE-RESUME-OVERRIDE` | `/admin/settings`, `/resume.pdf` | implemented | `lib/profile/resume.ts`, `/api/admin/profile/resume` | Supabase Storage |
| `FEAT-PROFILE-EXPERIENCE-ALIGNMENT` | `/admin/settings` | implemented | `lib/contracts/profile.ts`, profile editor | DB |

## Newsletter and subscriber lifecycle

| Feature ID | Surface | Status | Source of truth | External dependency |
| --- | --- | --- | --- | --- |
| `FEAT-SUBSCRIBER-STATE-MACHINE` | public subscription flows | implemented | `lib/actions/subscriber.actions.ts` | DB + email |
| `FEAT-NEWSLETTER-TAXONOMY-H6` | public + admin | implemented | `lib/newsletter/topics.ts` | DB |
| `FEAT-NEWSLETTER-DRAFT-QUEUE` | `/admin/newsletter` | implemented | `lib/actions/newsletter.actions.ts`, `NewsletterCampaign.queueOrder` | DB |
| `FEAT-NEWSLETTER-SELECTED-SEND` | `/admin/newsletter` | implemented | `NewsletterRecipientMode`, newsletter actions | DB |
| `FEAT-NEWSLETTER-ASSETS` | `/admin/newsletter` | implemented | `NewsletterAsset`, upload route | DB + Supabase Storage |
| `FEAT-NEWSLETTER-EMAIL-FRAME` | outbound mail | implemented | `lib/email/templates/frame.ts` | Resend/test driver |

## Content editor and admin CMS

| Feature ID | Surface | Status | Source of truth | External dependency |
| --- | --- | --- | --- | --- |
| `FEAT-EDITOR-MARKDOWN-FIRST` | `/admin/posts/[postId]` | implemented | `components/admin/post-editor.tsx` | DB |
| `FEAT-EDITOR-ASSETS-PANEL` | `/admin/posts/[postId]` | implemented | post editor + upload route | DB + Supabase Storage |
| `FEAT-EDITOR-COVER-WORKFLOW` | `/admin/posts/[postId]` | implemented | post editor + `coverImageUrl` | DB |
| `FEAT-EDITOR-PERMANENT-DELETE` | `/admin/posts/[postId]` | implemented | `deletePostPermanently()` | DB + storage cleanup |
| `FEAT-EDITOR-ACTION-STATE-ISOLATION` | `/admin/posts/[postId]` | implemented | post editor state | none |

## Analytics and operations

| Feature ID | Surface | Status | Source of truth | External dependency |
| --- | --- | --- | --- | --- |
| `FEAT-ANALYTICS-RAW-EVENTS` | `/api/analytics` | implemented | analytics route + `Analytics` model | DB |
| `FEAT-ADMIN-READINESS` | `/admin/analytics` | implemented | `lib/ops/readiness.ts` | env + DB + storage |
| `FEAT-ADMIN-SERVICE-LOG` | `/admin/analytics` | implemented | `lib/ops/readiness.ts` | DB |
| `FEAT-ADMIN-PERFORMANCE-DIAGNOSTICS` | `/admin/analytics` | implemented | `lib/ops/admin-performance.ts` | DB + client runtime |
| `FEAT-OPS-SMOKE` | CLI | implemented | `scripts/ops-smoke.ts` | env + running app |

## Known non-code operational dependencies

- real `OPS_WEBHOOK_URL`
- valid Resend production configuration
- applied Prisma migrations on target DB
- Supabase buckets bootstrapped:
  - `post-media`
  - `post-files`

The codebase can be ready while these are still outstanding.
