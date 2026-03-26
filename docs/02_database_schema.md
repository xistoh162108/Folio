# 02. Database Schema

The database runs on PostgreSQL through Prisma. The schema is forward-only in production: deploy new migrations with `pnpm prisma migrate deploy`, then run seed and backfill steps as needed.

## Content models

- `User`: admin credentials for NextAuth credentials login
- `Post`: note or project root record with `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `PostRevision`: point-in-time snapshot created before update and archive flows
- `Tag`: normalized tag catalog
- `PostAsset`: uploaded image or file metadata for Supabase Storage objects
- `PostLink`: normalized external links attached to a post
- `LinkPreviewCache`: cached preview metadata keyed by normalized URL

Legacy project links still exist on `Post.githubUrl`, `Post.demoUrl`, and `Post.docsUrl`. New write paths use `PostLink`; legacy fields remain only as read fallback until backfill is complete.

## Audience and messaging models

- `Subscriber`: newsletter recipient state, confirm token hash, unsubscribe token
- `NewsletterTopic`: normalized topic catalog
- `NewsletterCampaign`: campaign envelope and aggregate counters
- `NewsletterDelivery`: per-recipient delivery row with `PENDING`, `SENT`, `FAILED`
- `ContactMessage`: inbound contact submission
- `WebhookDelivery`: queued webhook dispatch row with retry metadata

## Audit and analytics models

- `AuditLog`: admin mutation history
- `Analytics`: raw event stream for pageviews, heartbeat, contact submit, and subscribe request

The analytics table stores optional `postId`, `referrerHost`, `countryCode`, `browser`, `deviceType`, and `isBot` dimensions. The admin dashboard aggregates from raw rows instead of storing a second summary table.

## Transaction notes

Transactions are used for operations that need cross-table consistency:

- `createDraftPost()`
- post update plus revision snapshot plus audit log
- post archive plus audit log
- subscriber topic upsert plus subscriber upsert
- contact message insert plus webhook queue insert
- campaign create plus delivery fan-out
- delivery retry reset plus campaign reopen

Single-row updates such as confirmation, unsubscribe, analytics writes, and most worker status updates are not globally wrapped in a transaction unless the operation needs it.

## Current migration set

```text
20260326075821_init_architecture
20260326204500_add_post_assets
20260326213500_add_post_links_and_preview_cache
20260326222500_add_newsletter_campaigns_and_deliveries
20260326233000_add_analytics_dimensions
```

Production is considered current only when all five migrations are applied.
