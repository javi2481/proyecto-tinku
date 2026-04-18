import 'server-only';
import { logger } from '@/lib/observability/logger';

/**
 * Email sender stub. Resend fue removido del proyecto (migramos a Google OAuth).
 * Este stub queda para trazabilidad en `app_logs` + stdout cuando algún flujo
 * legacy quiera mandar un email (ej: test users con password legacy).
 *
 * Si en el futuro se agrega un proveedor real, reemplazar `sendEmail` acá.
 */

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tag?: string;
}

type SendResult = { ok: true; provider: 'stub' };

export async function sendEmail({ to, subject, text, tag }: SendEmailArgs): Promise<SendResult> {
  await logger.info('email', `STUB email (Resend removido): ${subject}`, {
    to,
    subject,
    textPreview: text.slice(0, 200),
    tag: tag ?? 'unknown',
  });
  // eslint-disable-next-line no-console
  console.log(`\n======= 📧 EMAIL STUB (no provider) =======
TO:      ${to}
SUBJECT: ${subject}
---
${text}
==========================================\n`);
  return { ok: true, provider: 'stub' };
}

export function emailVerifyTemplate(verifyUrl: string, fullName: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = '¡Bienvenido/a a Tinkú! Confirmá tu email';
  const text = `Hola ${fullName},

Gracias por crear tu cuenta en Tinkú. Para activarla, hacé click en el siguiente link:

${verifyUrl}

Este link vence en 48 horas. Si no creaste esta cuenta, podés ignorar este mensaje.

Un abrazo,
El equipo de Tinkú`;
  // HTML mínimo por si en el futuro se usa
  const html = `<p>Hola ${fullName},</p><p>Confirmá tu cuenta: <a href="${verifyUrl}">${verifyUrl}</a></p>`;
  return { subject, text, html };
}
