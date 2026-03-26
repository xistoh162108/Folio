# 03. Actions, APIs, and Workers

This app uses Server Actions for authenticated mutations and Route Handlers for analytics, uploads, signed downloads, auth, and worker execution.

## Server Actions

### Posts

- `createDraftPost()`: creates a fresh `DRAFT` post and audit log entry
- `savePost(input)`: creates or updates a post, snapshots `PostRevision`, resyncs tags and links, and records audit
- `archivePost(id)`: moves a post to `ARCHIVED` and records audit

### Subscribers

- `requestSubscription(payload)`: creates or updates a subscriber, attaches topics, and sends a confirmation email
- `confirmSubscription(token)`: validates the hashed confirm token and marks the subscriber as confirmed
- `unsubscribeSubscription(token)`: marks a subscriber as unsubscribed

### Contact

- `submitContactMessage(payload)`: inserts `ContactMessage`, queues `WebhookDelivery`, and attempts to trigger the webhook worker

### Newsletter

- `createCampaign(input)`: creates the campaign and delivery fan-out only
- `startCampaign(input)`: flips a campaign to `SENDING` and dispatches the newsletter worker
- `sendTestCampaign(input)`: sends a single test email through the configured provider
- `retryDelivery(deliveryId)`: resets a failed delivery to `PENDING`, reopens the campaign, and dispatches the worker

## Route Handlers

### Auth

- `GET/POST /api/auth/[...nextauth]`
- NextAuth credentials provider backed by the `User` table

### Analytics

- `POST /api/analytics`
- Single write path for raw analytics events
- Skips `/admin` paths
- Returns `400` for invalid payloads, `429` for rate limiting, `503` for schema drift, and `500` for unexpected failures

### Uploads and downloads

- `POST /api/admin/uploads`
- Requires admin session
- Upload policy:
  - images: `image/jpeg`, `image/png`, `image/webp`, max 8 MB
  - files: `application/pdf`, `text/plain`, max 20 MB
- `GET /api/files/[assetId]`
- Rejects assets already marked with `pendingDeleteAt`
- Checks whether the requester can access the asset, then returns a 10-minute signed Supabase download URL

### Workers

- `POST /api/worker/webhook`
- Processes pending webhook queue rows in batches with exponential backoff
- `POST /api/worker/asset-cleanup`
- Marks retention candidates when needed, deletes Supabase objects and `PostAsset` rows in `pendingDeleteAt ASC, createdAt ASC, id ASC` order, and treats missing objects as successful cleanup
- `POST /api/worker/newsletter`
- Claims pending deliveries in `createdAt ASC, id ASC` order, sends up to 20 deliveries per run, refreshes campaign aggregates, and self-dispatches again when more rows remain

`GET` is still accepted for both worker routes, but automation and systemd or cron examples should use `POST`.

## Worker dispatch model

Interactive flows do not wait for worker completion. Instead they call `kickWorkerRoute()`:

- contact submit -> `/api/worker/webhook`
- post save with removed assets -> `/api/worker/asset-cleanup`
- start campaign or retry delivery -> `/api/worker/newsletter`

In production, self-dispatch uses `APP_URL` and should fail closed if it is missing. In local development and test environments, `NEXTAUTH_URL` may be used as a fallback.
