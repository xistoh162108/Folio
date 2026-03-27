export interface CreateCampaignInput {
  subject: string
  html: string
  text?: string
  topics: string[]
}

export interface StartCampaignInput {
  campaignId: string
}

export interface TestSendInput {
  email: string
  subject: string
  html: string
  text?: string
}

export interface CampaignSummaryDTO {
  id: string
  subject: string
  status: "DRAFT" | "SENDING" | "COMPLETED" | "FAILED"
  topics: string[]
  deliveryCount: number
  sentCount: number
  failedCount: number
  createdAt: string
}

export interface DeliveryRowDTO {
  id: string
  campaignId: string
  email: string
  status: "PENDING" | "SENT" | "FAILED"
  errorMessage?: string | null
  createdAt: string
  sentAt?: string | null
}

export interface NewsletterSubscriberRowDTO {
  id: string
  email: string
  topics: string[]
  subscribedAt: string
}
