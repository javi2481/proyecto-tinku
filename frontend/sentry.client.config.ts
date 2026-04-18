import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  
  // Performance monitoring
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  
  // Sampling rates
  tracesSampleRate: 1.0,
  
  // Filter out common non-errors
  beforeSend(event) {
    // Skip if no DSN configured
    if (!process.env.SENTRY_DSN) {
      return null;
    }
    return event;
  },
  
  // Debug in development
  debug: process.env.NODE_ENV === 'development',
});