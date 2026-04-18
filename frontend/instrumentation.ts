import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  
  // Enabled for all runtimes
  enabled: !!process.env.SENTRY_DSN,
  
  // Performance monitoring
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  
  // Sampling rates
  tracesSampleRate: 1.0,
  
  // Filter out if no DSN
  beforeSend(event) {
    if (!process.env.SENTRY_DSN) {
      return null;
    }
    return event;
  },
  
  // Debug in development
  debug: process.env.NODE_ENV === 'development',
});

// Register server-side handlers for server and edge
export function register() {
  // Server initialization happens automatically when this file is imported
  // The nextjs instrumentation hook handles the rest
}

// Note: This file replaces sentry.client.config.ts, sentry.server.config.ts, and sentry.edge.config.ts
// Next.js 14 expects this in the project root as instrumentation.ts