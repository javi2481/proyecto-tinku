import 'server-only';
import { createServiceSupabase } from '@/lib/supabase/service';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogArgs {
  level: LogLevel;
  source: string;
  message: string;
  context?: Record<string, unknown>;
  userAuthUid?: string | null;
}

/**
 * Logger estructurado → escribe a public.app_logs (service_role).
 * Ola 1: reemplaza Sentry/PostHog. TTL 30 días vía cron (agregar Ola 2).
 *
 * No hace throw si falla: logging nunca debe romper el flujo principal.
 */
export async function log({ level, source, message, context, userAuthUid }: LogArgs): Promise<void> {
  // Siempre consola para que aparezca en supervisor logs
  const consoleArgs = [`[${level}][${source}] ${message}`, context ?? ''];
  if (level === 'error' || level === 'fatal') console.error(...consoleArgs);
  else if (level === 'warn') console.warn(...consoleArgs);
  else console.log(...consoleArgs);

  try {
    const supabase = createServiceSupabase();
    await supabase.from('app_logs').insert({
      level,
      source,
      message,
      context: context ?? null,
      user_auth_uid: userAuthUid ?? null,
    });
  } catch (e) {
    console.error('[logger] Failed to persist log:', e);
  }
}

export const logger = {
  debug: (source: string, message: string, context?: Record<string, unknown>) =>
    log({ level: 'debug', source, message, context }),
  info: (source: string, message: string, context?: Record<string, unknown>) =>
    log({ level: 'info', source, message, context }),
  warn: (source: string, message: string, context?: Record<string, unknown>) =>
    log({ level: 'warn', source, message, context }),
  error: (source: string, message: string, context?: Record<string, unknown>) =>
    log({ level: 'error', source, message, context }),
  fatal: (source: string, message: string, context?: Record<string, unknown>) =>
    log({ level: 'fatal', source, message, context }),
};
