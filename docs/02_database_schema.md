# 02. Database Schema

The app uses PostgreSQL through Prisma. Schema changes are forward-only.

Required validation commands:

- `pnpm db:validate`
- `pnpm db:generate`
- `pnpm db:migrate:status`

Production is only current when every migration in `prisma/migrations/` has been applied.

## Enums

- `PostType`
  - `NOTE`
  - `PROJECT`
- `PostStatus`
  - `DRAFT`
  - `PUBLISHED`
  - `ARCHIVED`
- `PostAssetKind`
  - `IMAGE`
  - `FILE`
- `PostLinkType`
  - `GITHUB`
  - `WEBSITE`
  - `YOUTUBE`
  - `DOCS`
  - `OTHER`
- `ProfileLinkKind`
  - `GITHUB`
  - `LINKEDIN`
  - `EMAIL`
  - `WEBSITE`
  - `OTHER`
- `PreviewFetchStatus`
  - `PENDING`
  - `READY`
  - `FAILED`
- `NewsletterCampaignStatus`
  - `DRAFT`
  - `SENDING`
  - `COMPLETED`
  - `FAILED`
- `NewsletterDeliveryStatus`
  - `PENDING`
  - `SENT`
  - `FAILED`
- `NewsletterRecipientMode`
  - `TOPICS`
  - `SELECTED_SUBSCRIBERS`
- `NewsletterAssetKind`
  - `IMAGE`
  - `FILE`
- `SubscriberRole`
  - `DEVELOPER`
  - `STUDENT`
  - `DESIGNER`
  - `OTHER`
- `ContactStatus`
- `AnalyticsEventType`
- `WebhookStatus`

## Models by domain

### Auth / operators

- `User`
  - admin credential record
  - email + bcrypt password
- `AuditLog`
  - persisted admin mutation history

### Publishing

- `Post`
  - root content model for notes and projects
  - key fields:
    - `type`
    - `status`
    - `title`
    - `slug`
    - `excerpt`
    - `coverImageUrl`
    - `content`
    - `markdownSource`
    - `htmlContent`
    - `views`
    - `publishedAt`
- `PostRevision`
  - historical snapshot before important mutations
- `Tag`
  - normalized free-form tag catalog
- `PostAsset`
  - uploaded images/files attached to a post
  - cleanup tracking:
    - `pendingDeleteAt`
    - `deleteAttempts`
    - `lastDeleteError`
- `PostLink`
  - normalized external links
- `LinkPreviewCache`
  - normalized preview metadata cache
- `PostLike`
  - session-based engagement row
- `PostComment`
  - anonymous comment row
  - PIN hash + soft-delete support

### Guestbook / contact

- `GuestbookEntry`
  - public guestbook log row
  - soft-delete capable
- `ContactMessage`
  - persisted contact submission
- `WebhookDelivery`
  - queued operational webhook dispatch row

### Profile / resume

- `Profile`
  - primary profile root record
- `ProfileEducation`
- `ProfileExperience`
- `ProfileAward`
- `ProfileLink`

Active runtime/editor contract notes:

- public rendering uses `ProfileExperience.label` + `period`
- `ProfileExperience.title`, `detail`, and `year` remain in schema only for compatibility
- direct resume upload override is storage-backed and does not have a dedicated Prisma model

### Newsletter

- `Subscriber`
  - confirmation and unsubscribe lifecycle state
- `NewsletterTopic`
  - normalized visible topic catalog
- `NewsletterCampaign`
  - queue-backed campaign envelope
  - H6 load-bearing fields:
    - `recipientMode`
    - `targetSubscriberIds`
    - `skipPreviouslySent`
    - `queueOrder`
- `NewsletterDelivery`
  - per-recipient delivery record
- `NewsletterAsset`
  - campaign-owned image/file asset
  - `sendAsAttachment` controls attachment vs inline behavior

### Analytics

- `Analytics`
  - raw event stream for pageview/product signals

## Current lifecycle notes

### Posts

- drafts, published content, and archived content stay on the same `Post` row
- permanent delete is explicit and separate from archive
- cover image is a field on `Post`; uploaded media/files stay in `PostAsset`
- `Post.excerpt` is the canonical short description for projects

### Community

- comments and guestbook entries remain immediately visible unless soft-deleted
- guestbook remains latest-first in the public runtime
- moderation stays soft-delete based

### Newsletter

- the visible topic taxonomy is:
  - `All`
  - `Project & Info`
  - `Log`
- old aliases are normalized in code for compatibility
- campaigns are draft-backed and can target:
  - topic audiences
  - selected subscribers
- failed deliveries can be retried on the same row

### Resume override

- uploaded resume override is stored in Supabase under a fixed storage path
- DB schema does not track the override path separately
- public reads fail open to the generated PDF route when storage lookup fails

## Transaction boundaries

Transactions are used where cross-table consistency is load-bearing:

- `createDraftPost()`
- `savePost()`
- `archivePost()`
- `deletePostPermanently()`
- `requestSubscription()`
- `upsertCampaign()`
- `startCampaign()` campaign reopening/count adjustments
- `rerunCampaign()`
- `retryDelivery()`
- `savePrimaryProfile()`
- `submitContactMessage()`

Read-only queries stay in `lib/data/*`.

## Compatibility and legacy rules

- legacy project link fields still exist on `Post`:
  - `githubUrl`
  - `demoUrl`
  - `docsUrl`
- active write paths use `PostLink`
- `ProfileExperience` legacy columns remain for compatibility, but the active editor/runtime contract ignores them
- newsletter topic aliases remain accepted in code, but the canonical visible set is now only:
  - `all`
  - `project-info`
  - `log`

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
20260404190000_add_newsletter_h6_hardening
```

## Operational note

The last external production-environment verification found that `20260404190000_add_newsletter_h6_hardening` was still pending on the provided live database. Treat that as an operational blocker until `pnpm db:migrate:deploy` is run successfully in the target environment.
