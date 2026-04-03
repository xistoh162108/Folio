# 03. Actions, APIs, and Workers

This app uses Server Actions for authenticated or form-bound mutations and Route Handlers for uploads, analytics, signed downloads, auth, public community APIs, and worker execution.

## Server Actions

### Posts

- `createDraftPost()`
  - creates a fresh `DRAFT` post and audit log entry
- `savePost(input)`
  - creates or updates a post
  - snapshots `PostRevision`
  - syncs tags, links, and retained assets
  - enforces that `coverImageUrl` matches one uploaded image asset URL for the same post
  - marks removed assets for cleanup
  - records audit
- `archivePost(id)`
  - moves a post to `ARCHIVED`
  - records audit

Callers:

- admin post list
- admin post editor

### Subscribers

- `requestSubscription(payload)`
  - validates email, honeypot, and topic selection
  - upserts the subscriber
  - sends a confirmation email through `EmailProvider`
- `confirmSubscription(token)`
  - validates the hashed confirm token and confirms the subscriber
- `unsubscribeSubscription(token)`
  - unsubscribes the subscriber and attempts to send a confirmation email

Callers:

- `components/v0/public/subscription-module.tsx`
- `/subscribe/confirm`
- `/unsubscribe`

### Contact

- `submitContactMessage(payload)`
  - validates form and honeypot
  - inserts `ContactMessage`
  - inserts `WebhookDelivery`
  - attempts to trigger the webhook worker
  - attempts to send a transactional acknowledgement email

Caller:

- `components/contact-form.tsx`

### Newsletter

- `createCampaign(input)`
  - creates the campaign and delivery fan-out only
- `startCampaign(input)`
  - flips the campaign to `SENDING` and dispatches the newsletter worker
- `sendTestCampaign(input)`
  - sends a single test email through the configured provider
- `retryDelivery(deliveryId)`
  - resets a failed delivery row to `PENDING`
  - reopens the campaign
  - dispatches the newsletter worker

Caller:

- `components/v0/admin/newsletter-manager.tsx`

### Community moderation

- `softDeleteComment(commentId)`
- `softDeleteGuestbookEntry(entryId)`

Caller:

- `/admin/community`

## Route Handlers

### Auth

- `GET/POST /api/auth/[...nextauth]`
- NextAuth credentials provider backed by the `User` table

### Analytics

- `POST /api/analytics`
- single write path for raw analytics events
- skips `/admin` paths intentionally
- returns:
  - `200` for success
  - `200` with `skipped` for intentional admin-path skip
  - `400` for invalid payloads
  - `429` for rate limiting
  - `503` for schema/config drift
  - `500` for unexpected failures

Caller:

- `components/analytics-tracker.tsx`

### Uploads and downloads

- `POST /api/admin/uploads`
  - requires admin session
  - upload policy:
    - images: `image/jpeg`, `image/png`, `image/webp`, max 8 MB
    - files: `application/pdf`, `text/plain`, max 20 MB
- `GET /api/files/[assetId]`
  - rejects assets already marked with `pendingDeleteAt`
  - checks requester access
  - returns a 10-minute signed Supabase download URL

Caller:

- admin post editor
- public and admin post detail download links

### Community APIs

- `POST /api/guestbook`
  - creates guestbook entries
- `POST /api/posts/[postId]/comments`
  - creates comments
- `POST /api/comments/[commentId]/delete`
  - deletes comment by PIN flow
- `POST /api/posts/[postId]/like`
  - toggles a session like row
- `POST /api/admin/comments/[commentId]`
  - admin comment soft delete
- `POST /api/admin/guestbook/[entryId]`
  - admin guestbook soft delete

Callers:

- `components/v0/public/guestbook-screen.tsx`
- `components/v0/public/comments-log.tsx`
- `components/v0/public/post-like-button.tsx`
- admin community UI

### Workers

- `POST /api/worker/webhook`
  - processes pending webhook rows in batches with backoff
- `POST /api/worker/asset-cleanup`
  - marks or deletes stale assets
  - deletes in `pendingDeleteAt ASC, createdAt ASC, id ASC` order
  - treats missing storage objects as successful cleanup
- `POST /api/worker/newsletter`
  - claims pending deliveries in `createdAt ASC, id ASC`
  - sends up to 20 deliveries per run
  - refreshes campaign aggregates
  - self-dispatches when more work remains

`GET` is still accepted for worker routes, but automation, systemd, cron, and smoke checks should use `POST`.

### Test-only support

- `GET /api/test-storage`
  - helper route used by the test storage driver during local QA and E2E

## Email provider integration

`lib/email/provider.ts` is the abstraction boundary. It exposes:

- `sendTransactionalEmail()`
- `sendTestEmail()`
- `sendCampaignEmails()`

Drivers:

- production default: Resend
- local/test: test driver sink

Production must fail closed if:

- `APP_URL` is missing
- `EMAIL_FROM` is missing
- `RESEND_API_KEY` is missing

## Worker dispatch model

Interactive flows do not wait for worker completion. They call `kickWorkerRoute()` instead:

- contact submit -> `/api/worker/webhook`
- post save with removed assets -> `/api/worker/asset-cleanup`
- campaign start or retry -> `/api/worker/newsletter`

In production, self-dispatch uses `APP_URL` and fails closed if it is missing. Development and test may fall back to local values.
