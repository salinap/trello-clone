import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  url: process.env.APP_URL,
  emailVerificationExpiresHours: parseInt(
    process.env.APP_EMAIL_VERIFICATION_EXPIRES_HOURS ?? '24',
    10,
  ),
}));
