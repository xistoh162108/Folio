# 03. Actions, APIs, and Workers

This repository uses:

- Server Actions for authenticated or form-bound mutations
- Route Handlers for uploads, public writes, auth, workers, downloads, and feeds
- read-side server-component queries in `lib/data/*` for public/admin list/detail loading

There is no separate public JSON API for notes/projects listing. Those surfaces are rendered directly from `lib/data/posts.ts`.

## Server Actions

### Posts

- `createDraftPost()`
  - creates a real draft row and audit entry
- `savePost(input)`
  - persists markdown/block/html state
  - syncs tags, links, retained assets, cover image
  - writes revision and audit state
- `archivePost(postId)`
  - archives the post
- `deletePostPermanently(postId)`
  - destructive delete
  - blocks DB delete if storage cleanup fails

### Subscribers

- `requestSubscription(payload)`
  - validates honeypot and topic selection
  - upserts subscriber state
  - sends confirm email
- `confirmSubscription(token)`
  - confirms subscriber
  - sends welcome email on first real confirmation
- `unsubscribeSubscription(token)`
  - unsubscribes subscriber
  - sends unsubscribe confirmation

### Newsletter admin

- `upsertCampaign(input)`
  - creates or updates a draft campaign
- `startCampaign(input)`
  - queues draft campaign for delivery
- `rerunCampaign(input)`
  - creates a rerun cycle
- `deleteCampaign(input)`
  - deletes draft/completed campaign and campaign-owned assets safely
- `reorderCampaign(input)`
  - queue ordering within draft campaigns
- `sendTestCampaign(input)`
  - sends one preview email
- `retryDelivery(deliveryId)`
  - requeues a failed delivery row
- `unsubscribeSubscriberAsAdmin(input)`
  - unsubscribes one subscriber
  - sends unsubscribe notice
- `deleteSubscriberAsAdmin(input)`
  - removes subscriber row
- `toggleNewsletterAssetAttachment(input)`
  - switches between inline vs attached send mode
- `removeNewsletterAsset(input)`
  - removes one uploaded newsletter asset

### Profile

- `savePrimaryProfile(input)`
  - saves the DB-backed profile runtime/editor state
  - active experience contract is `label + period`

### Contact

- `submitContactMessage(payload)`
  - validates form/honeypot
  - stores `ContactMessage`
  - enqueues `WebhookDelivery`
  - attempts acknowledgement email

### Community moderation

- `deleteCommentAsAdmin(formData)`
- `deleteGuestbookEntryAsAdmin(formData)`

## Route Handlers

### Auth

- `GET/POST /api/auth/[...nextauth]`
  - credentials auth backed by `User`

### Analytics

- `POST /api/analytics`
  - canonical analytics write path
  - skips `/admin` events intentionally

### Uploads and downloads

- `POST /api/admin/uploads`
  - admin post asset uploads
- `POST /api/admin/newsletter/uploads`
  - admin newsletter asset uploads
- `POST /api/admin/profile/resume`
  - upload PDF resume override
- `DELETE /api/admin/profile/resume`
  - remove uploaded resume override
- `GET /api/files/[assetId]`
  - signed file download mediator
  - respects `PUBLISHED` / admin visibility rules

### Public community APIs

- `GET /api/guestbook?page=`
  - paginated guestbook reads
- `POST /api/guestbook`
  - create guestbook entry
- `GET /api/posts/[postId]/comments?page=`
  - paginated comment reads
- `POST /api/posts/[postId]/comments`
  - create comment
- `POST /api/comments/[commentId]/delete`
  - PIN-based comment delete
- `POST /api/posts/[postId]/like`
  - session like toggle

### Admin moderation APIs

- `POST /api/admin/comments/[commentId]`
- `POST /api/admin/guestbook/[entryId]`

### Workers

- `GET/POST /api/worker/webhook`
  - webhook queue processing
- `GET/POST /api/worker/newsletter`
  - newsletter delivery processing
  - self-dispatches when work remains
- `GET/POST /api/worker/asset-cleanup`
  - deferred storage cleanup

Worker automation should use `POST` plus `Authorization: Bearer ${CRON_SECRET}`.

### Test-only helper

- `GET /api/test-storage`
  - local/test storage probe only

## Feed routes

- `GET /notes/rss.xml`
- `GET /projects/rss.xml`

These are publishing surfaces, not generic blog add-ons. Feed autodiscovery is emitted from page metadata on `/notes` and `/projects`.

## Read-side query surfaces

There is no public REST list API for core content. Server components load from:

- `getHomepagePosts()`
- `getPublicPosts()`
- `getPublishedPostDetail()`
- `getPostCommentsPage()`
- `getGuestbookEntriesPage()`
- `getCommunityModerationSnapshot()`
- `getNewsletterDashboardData()`
- `getPrimaryProfileRuntimeSnapshot()`
- `getPrimaryProfileSettingsEditorState()`
- `getAdminReadinessDashboard()`
- `getAdminPerformanceDashboard()`

## Email integration

Abstraction boundary:

- `sendTransactionalEmail()`
- `sendTestEmail()`
- `sendCampaignEmails()`

Drivers:

- `resend`
- `test`

Shared email framing now includes:

- exact-v0 static banner
- exact-v0 signature block
- natural unsubscribe phrasing

Applied lifecycle templates:

- subscribe confirm
- welcome / confirmation-complete
- unsubscribe
- newsletter campaign
- admin unsubscribe notification

## Current runtime contracts worth knowing

- newsletter visible topics are normalized by `lib/newsletter/topics.ts`
- project short description comes from `Post.excerpt`
- profile Instagram exposure is Home-only even though verified links remain in DB
- resume override is storage-backed and intentionally has no dedicated Prisma table
- RSS query states stay on canonical `/notes` and `/projects` routes; filtered/paginated variants are `noindex`
