import 'server-only';
import { Resend } from 'resend';
import { logger } from '@/lib/observability/logger';

/**
 * Email sender. Usa Resend si hay RESEND_API_KEY configurada, si no cae a stub (log a app_logs + stdout).
 * Archivo conserva su nombre legacy ("stub.ts") para no romper llamadores existentes.
 * Si el envío por Resend falla, loguea el error pero NO propaga (los flujos de signup/resend
 * no deben bloquearse por una falla de email — el usuario puede pedir resend).
 */

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tag?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? 'Tinkú <onboarding@resend.dev>';

type SendResult = { ok: true; provider: 'resend' | 'stub'; id?: string };

export async function sendEmail({ to, subject, text, html, tag }: SendEmailArgs): Promise<SendResult> {
  // Si no hay API key, cae directo al stub (logs)
  if (!RESEND_API_KEY) {
    return logStub({ to, subject, text, tag });
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: [to],
      subject,
      text,
      html,
      tags: tag ? [{ name: 'tag', value: tag }] : undefined,
    });
    if (error) {
      await logger.warn('email', `Resend error: ${error.message}`, { to, subject, tag });
      // Fallback a stub para que el flujo continúe y quede la traza del contenido
      return logStub({ to, subject, text, tag });
    }
    await logger.info('email', `Resend sent: ${subject}`, { to, tag: tag ?? 'unknown', id: data?.id });
    return { ok: true, provider: 'resend', id: data?.id };
  } catch (e) {
    await logger.warn('email', `Resend threw: ${e instanceof Error ? e.message : String(e)}`, { to, subject, tag });
    return logStub({ to, subject, text, tag });
  }
}

async function logStub({
  to,
  subject,
  text,
  tag,
}: Pick<SendEmailArgs, 'to' | 'subject' | 'text' | 'tag'>): Promise<SendResult> {
  await logger.info('email', `STUB email sent: ${subject}`, {
    to,
    subject,
    textPreview: text.slice(0, 200),
    tag: tag ?? 'unknown',
  });
  // eslint-disable-next-line no-console
  console.log(`\n======= 📧 EMAIL STUB =======
TO:      ${to}
SUBJECT: ${subject}
---
${text}
==============================\n`);
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

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#F6F3EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1D2B2F;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#FFFFFF;border-radius:24px;padding:32px;">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:28px;">¡Bienvenido/a a Tinkú! 🏝️</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.5;color:#1D2B2F;">Hola ${escapeHtml(fullName)}, gracias por crear tu cuenta. Para activarla, tocá el botón:</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${verifyUrl}" style="display:inline-block;background:#2F7A8C;color:#FFFFFF;text-decoration:none;padding:14px 24px;border-radius:14px;font-weight:600;font-size:16px;">Confirmar mi email</a>
          </p>
          <p style="margin:0 0 12px;font-size:13px;color:#5A6B6F;">Si el botón no funciona, copiá este link:</p>
          <p style="margin:0 0 24px;word-break:break-all;font-size:13px;color:#2F7A8C;">${verifyUrl}</p>
          <p style="margin:0;font-size:12px;color:#8A9396;">Este link vence en 48 horas. Si no creaste esta cuenta, podés ignorar este mensaje.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#8A9396;">Tinkú · Las Islas del Saber</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}
