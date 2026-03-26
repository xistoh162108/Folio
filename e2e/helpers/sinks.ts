import { TEST_EMAIL_OUTBOX_PATH, TEST_WEBHOOK_SINK_PATH, readJsonLines } from "../../lib/testing/sinks"

export interface TestEmailSinkEntry {
  provider: "test"
  createdAt: string
  to: string
  subject: string
  html: string
  text?: string
}

export interface TestWebhookSinkEntry {
  destination: string
  payload: unknown
  deliveredAt: string
}

export function readTestOutbox() {
  return readJsonLines<TestEmailSinkEntry>(TEST_EMAIL_OUTBOX_PATH)
}

export function readTestWebhookSink() {
  return readJsonLines<TestWebhookSinkEntry>(TEST_WEBHOOK_SINK_PATH)
}
