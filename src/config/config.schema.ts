import { z } from 'zod';

export const envSchema = z.object({
  // APP
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.url(),
  APP_EMAIL_VERIFICATION_EXPIRES_HOURS: z.coerce
    .number()
    .int()
    .min(1)
    .default(24),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // DATABASE
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SYNCHRONIZE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // SMTP
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().min(1).max(65535),
  MAIL_USER: z.string().email(),
  MAIL_PASS: z.string().min(1),
  MAIL_FROM: z.string().min(1),
});

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  [${i.path.join('.')}] ${i.message}`)
      .join('\n');

    throw new Error(`\n Config validation failed:\n${formatted}\n`);
  }

  return result.data;
}
