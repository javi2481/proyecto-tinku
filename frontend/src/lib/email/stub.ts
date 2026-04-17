import 'server-only';
import { logger } from '@/lib/observability/logger';

/**
 * Email stub para Ola 1. "Manda" mails logueando a app_logs.
 * Cuando conectemos Resend real, reemplazamos esta función sin tocar llamadores.
 */

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tag?: string;
}

export async function sendEmail({ to, subject, text, tag }: SendEmailArgs): Promise<{ ok: true; provider: 'stub' }> {
  await logger.info('email', `STUB email sent: ${subject}`, {
    to,
    subject,
    textPreview: text.slice(0, 200),
    tag: tag ?? 'unknown',
  });
  // En dev también lo dejamos en stdout completo para que Javier pueda agarrar el link
  console.log(`\n======= 📧 EMAIL STUB =======
TO:      ${to}
SUBJECT: ${subject}
---
${text}
==============================\n`);
  return { ok: true, provider: 'stub' };
}

export function emailVerifyTemplate(verifyUrl: string, fullName: string): { subject: string; text: string } {
  return {
    subject: '¡Bienvenido/a a Tinkú! Confirmá tu email',
    text: `Hola ${fullName},

Gracias por crear tu cuenta en Tinkú. Para activarla, hacé click en el siguiente link:

${verifyUrl}

Este link vence en 48 horas. Si no creaste esta cuenta, podés ignorar este mensaje.

Un abrazo,
El equipo de Tinkú`,
  };
}
