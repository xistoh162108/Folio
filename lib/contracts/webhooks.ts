export type WebhookEventType = "CONTACT_SUBMIT"

export interface ContactSubmitWebhookPayload {
  contactId: string
  email: string
  name: string
  message: string
  text: string
}
