import { existsSync } from 'node:fs';
import { HttpException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

if (existsSync('.env')) process.loadEnvFile('.env');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0,

  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error instanceof HttpException && error.getStatus() < 500) return null;
    return event;
  },
});
