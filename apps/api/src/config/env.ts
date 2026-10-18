import { z } from 'zod';

const csv = z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  CORS_ORIGINS: csv,
  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  /** WhatsApp Cloud API sender (Meta Business > WhatsApp > API setup). */
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  /** smtp:// URL. Local: Mailpit (docker compose). Production: the AWS SES SMTP endpoint in ap-south-1. */
  SMTP_URL: z.string().default('smtp://localhost:1025'),
  MAIL_FROM: z.string().default('Valley Ride <no-reply@valleyride.in>'),
  /** Staff inbox for fleet and money alerts (document expiry, late repayments). */
  OPS_EMAIL: z.string().email().optional(),
  /** Phase 4 safeguard: recording investments and investor onboarding stay off until legal and CA sign-off. */
  CAPITAL_PORTAL_ENABLED: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  AWS_REGION: z.string().default('ap-south-1'),
  S3_BUCKET_PRIVATE: z.string(),
  /** `local` keeps uploads in apps/api/.uploads for development; production always uses S3. */
  STORAGE_DRIVER: z.enum(['s3', 'local']).optional(),
  SENTRY_DSN: z.string().optional(),
  TZ_DISPLAY: z.string().default('Asia/Kolkata'),
  /** e.g. .valleyride.in, so cookies set by api.valleyride.in reach the Next.js middleware on valleyride.in. */
  COOKIE_DOMAIN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  STORAGE_DRIVER: parsed.data.STORAGE_DRIVER ?? (parsed.data.NODE_ENV === 'production' ? 's3' : 'local'),
};
if (env.NODE_ENV === 'production' && env.STORAGE_DRIVER !== 's3') {
  console.error('STORAGE_DRIVER must be s3 in production');
  process.exit(1);
}
export type Env = typeof env;
