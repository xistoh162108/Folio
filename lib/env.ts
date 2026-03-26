import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),
  APP_URL: z.string().url().optional(),
  OPS_WEBHOOK_URL: z
    .string()
    .refine((value) => value.startsWith("test://") || /^https?:\/\//.test(value), "Invalid webhook URL.")
    .optional(),
  EMAIL_FROM: z.string().email().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_DRIVER: z.enum(["resend", "test"]).optional(),
  EMAIL_TEST_FAIL_RECIPIENTS: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STORAGE_DRIVER: z.enum(["supabase", "test"]).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
})

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  APP_URL: process.env.APP_URL,
  OPS_WEBHOOK_URL: process.env.OPS_WEBHOOK_URL,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_DRIVER: process.env.EMAIL_DRIVER,
  EMAIL_TEST_FAIL_RECIPIENTS: process.env.EMAIL_TEST_FAIL_RECIPIENTS,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
})

if (!parsed.success) {
  const requiredErrors = parsed.error.issues
    .filter((issue) =>
      ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL", "CRON_SECRET"].includes(
        String(issue.path[0]),
      ),
    )
    .map((issue) => issue.path[0])

  if (requiredErrors.length > 0) {
    throw new Error(`Missing or invalid required environment variables: ${requiredErrors.join(", ")}`)
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      DATABASE_URL: process.env.DATABASE_URL!,
      DIRECT_URL: process.env.DIRECT_URL!,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
      CRON_SECRET: process.env.CRON_SECRET!,
      APP_URL: process.env.APP_URL,
      OPS_WEBHOOK_URL: process.env.OPS_WEBHOOK_URL,
      EMAIL_FROM: process.env.EMAIL_FROM,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_DRIVER: process.env.EMAIL_DRIVER as "resend" | "test" | undefined,
      EMAIL_TEST_FAIL_RECIPIENTS: process.env.EMAIL_TEST_FAIL_RECIPIENTS,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      STORAGE_DRIVER: process.env.STORAGE_DRIVER as "supabase" | "test" | undefined,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    }
