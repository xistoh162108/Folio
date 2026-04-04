import type { PaginatedCollectionStateDTO } from "@/lib/contracts/community"
import type { NewsletterVisibleTopic } from "@/lib/newsletter/topics"

export type NewsletterRecipientMode = "TOPICS" | "SELECTED_SUBSCRIBERS"
export type NewsletterCampaignStatus = "DRAFT" | "SENDING" | "COMPLETED" | "FAILED"
export type NewsletterDeliveryStatus = "PENDING" | "SENT" | "FAILED"
export type NewsletterSubscriberStatus = "ACTIVE" | "PENDING" | "UNSUBSCRIBED"
export type NewsletterAssetKind = "IMAGE" | "FILE"

export interface NewsletterTopicRowDTO {
  normalizedName: NewsletterVisibleTopic
  name: string
}

export interface NewsletterAssetDTO {
  id: string
  campaignId: string
  kind: NewsletterAssetKind
  originalName: string
  mime: string
  size: number
  publicUrl?: string | null
  sendAsAttachment: boolean
  createdAt: string
}

export interface UpsertCampaignInput {
  id?: string
  subject: string
  markdown: string
  topics: NewsletterVisibleTopic[]
  recipientMode: NewsletterRecipientMode
  targetSubscriberIds: string[]
  skipPreviouslySent: boolean
}

export interface StartCampaignInput {
  campaignId: string
}

export interface RerunCampaignInput {
  campaignId: string
}

export interface DeleteCampaignInput {
  campaignId: string
}

export interface ReorderCampaignInput {
  campaignId: string
  direction: "up" | "down"
}

export interface TestSendInput {
  email: string
  subject: string
  markdown: string
  assetIds?: string[]
}

export interface ToggleNewsletterAssetAttachmentInput {
  assetId: string
  sendAsAttachment: boolean
}

export interface RemoveNewsletterAssetInput {
  assetId: string
}

export interface AdminSubscriberActionInput {
  subscriberId: string
}

export interface CampaignSummaryDTO {
  id: string
  subject: string
  markdown: string | null
  status: NewsletterCampaignStatus
  topics: NewsletterVisibleTopic[]
  recipientMode: NewsletterRecipientMode
  targetSubscriberIds: string[]
  deliveryCount: number
  sentCount: number
  failedCount: number
  skipPreviouslySent: boolean
  queueOrder: number
  createdAt: string
  updatedAt: string
}

export interface DeliveryRowDTO {
  id: string
  campaignId: string
  email: string
  status: NewsletterDeliveryStatus
  errorMessage?: string | null
  createdAt: string
  sentAt?: string | null
}

export interface NewsletterSubscriberRowDTO {
  id: string
  email: string
  topics: NewsletterVisibleTopic[]
  topicLabels: string[]
  subscribedAt: string
  status: NewsletterSubscriberStatus
}

export interface NewsletterSubscriberOptionDTO {
  id: string
  email: string
  topics: NewsletterVisibleTopic[]
}

export interface NewsletterCampaignEditorDTO {
  id: string
  subject: string
  markdown: string
  topics: NewsletterVisibleTopic[]
  recipientMode: NewsletterRecipientMode
  targetSubscriberIds: string[]
  skipPreviouslySent: boolean
  status: NewsletterCampaignStatus
  queueOrder: number
  assets: NewsletterAssetDTO[]
}

export interface NewsletterDashboardData {
  topics: NewsletterTopicRowDTO[]
  activeSubscriberCount: number
  subscribers: NewsletterSubscriberRowDTO[]
  subscribersPagination: PaginatedCollectionStateDTO
  subscriberOptions: NewsletterSubscriberOptionDTO[]
  campaigns: CampaignSummaryDTO[]
  campaignsPagination: PaginatedCollectionStateDTO
  deliveries: DeliveryRowDTO[]
  deliveriesPagination: PaginatedCollectionStateDTO
  selectedCampaign: NewsletterCampaignEditorDTO | null
  migrationReady: boolean
}
