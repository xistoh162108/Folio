# 02. Database Schema

The database runs on PostgreSQL through Prisma. Production schema changes are forward-only: apply migrations with `pnpm db:migrate:deploy`, then run seed and backfill steps when required.

## Core content models

- `User`
  - admin credentials for NextAuth credentials login
- `Post`
  - root record for notes and projects
  - `status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
  - `type`: `NOTE`, `PROJECT`
  - `content` stores canonical TipTap-style JSON
  - `htmlContent` stores rendered HTML alongside the JSON body
- `PostRevision`
  - snapshot of post state before update and archive operations
- `Tag`
  - normalized tag catalog
- `PostAsset`
  - uploaded image and file metadata for Supabase Storage objects
  - includes cleanup fields such as `pendingDeleteAt`, `deleteAttempts`, and `lastDeleteError`
- `PostLink`
  - normalized external link rows attached to a post
- `LinkPreviewCache`
  - preview data keyed by `normalizedUrl`
  - stores provider-specific metadata in `metadata`

## Community models

- `PostLike`
  - session-based like row per post
- `PostComment`
  - anonymous comment with PIN hash and soft-delete support
- `GuestbookEntry`
  - guestbook/system-log entry with soft-delete support

## Audience and messaging models

- `Subscriber`
  - newsletter recipient state
  - stores confirm token hash, confirm expiry, unsubscribe token, and confirmation state
- `NewsletterTopic`
  - normalized topic catalog
- `NewsletterCampaign`
  - campaign envelope and aggregate counters
- `NewsletterDelivery`
  - per-recipient delivery row
  - states: `PENDING`, `SENT`, `FAILED`
  - retry reuses the same row instead of creating a new one
- `ContactMessage`
  - inbound contact submission with moderation status and source metadata
- `WebhookDelivery`
  - queued webhook dispatch row with retry metadata and delivery state

## Audit and analytics models

- `AuditLog`
  - admin mutation history
- `Analytics`
  - raw event stream
  - `eventType`: `PAGEVIEW`, `HEARTBEAT`, `PAGELOAD`, `CONTACT_SUBMIT`, `SUBSCRIBE_REQUEST`
  - stores optional dimensions such as `postId`, `referrerHost`, `countryCode`, `browser`, `deviceType`, `isBot`, and performance fields such as `duration` and `pageLoadMs`

The admin dashboard reads aggregate metrics directly from raw analytics rows instead of maintaining a second materialized summary table.

## Lifecycle and consistency notes

### Content lifecycle

- new admin posts start as real `Post` rows in `DRAFT`
- asset uploads are attached to the draft `postId`
- publishing changes the same row to `PUBLISHED`
- archiving changes the same row to `ARCHIVED`

### Community lifecycle

- comments and guestbook entries are immediately visible unless soft-deleted
- comment self-delete is PIN-based
- admin moderation is soft-delete based

### Newsletter lifecycle

- campaign creation inserts `NewsletterCampaign` and `NewsletterDelivery` rows only
- start moves the campaign to `SENDING`
- worker processes deliveries in `createdAt ASC, id ASC`
- retry sets the same delivery row back to `PENDING`

## Transaction usage

Transactions are used where cross-table consistency matters:

- `createDraftPost()`
- post save plus revision plus audit plus tags/links/assets sync
- post archive plus audit
- subscriber upsert plus topic upsert/attach
- contact message insert plus webhook queue insert
- campaign create plus delivery fan-out
- delivery retry reset plus campaign reopen

Single-row writes such as confirmation, unsubscribe, analytics writes, likes, many worker status updates, and some moderation actions do not wrap the entire flow in one large transaction unless cross-table consistency is required.

## Legacy compatibility notes

Legacy project links still exist on:

- `Post.githubUrl`
- `Post.demoUrl`
- `Post.docsUrl`

New write paths use `PostLink`. Legacy fields remain only as fallback/read compatibility until all old data is backfilled and removed.

## Current migration set

```text
20260326075821_init_architecture
20260326131500_add_post_asset_cleanup_fields
20260326204500_add_post_assets
20260326213500_add_post_links_and_preview_cache
20260326222500_add_newsletter_campaigns_and_deliveries
20260326233000_add_analytics_dimensions
20260326235959_add_link_preview_metadata
20260327001000_add_post_likes
20260327002500_add_comments_and_guestbook
20260327010000_add_pageload_metrics
20260327011500_add_pageload_analytics_event
```

Production is current only when all of the above migrations are applied.
