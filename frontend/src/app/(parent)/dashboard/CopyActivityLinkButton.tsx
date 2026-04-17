'use client';

import { useState } from 'react';

interface Props {
  studentName: string;
  loginCode: string;
}

/**
 * Botón cliente que copia un mensaje armado para WhatsApp:
 *  "¡Hola! Es hora del repaso de Tinkú.
 *   Tu código: 7ZBCVT
 *   Entrá acá: https://.../entrar"
 */
export function CopyButton({ studentName, loginCode }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/entrar` : '';
    const msg = `¡Hola ${studentName}! Es hora del repaso de Tinkú 🏝️\n\nTu código: ${loginCode}\nEntrá: ${url}`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback: textarea
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); } catch { /* no-op */ }
      document.body.removeChild(ta);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="copy-share-link"
      className="h-9 px-3 rounded-xl bg-white border border-tinku-ink/10 hover:bg-tinku-mist/60 text-xs font-medium text-tinku-ink inline-flex items-center gap-1.5"
    >
      <span aria-hidden>{copied ? '✓' : '📋'}</span>
      {copied ? '¡Copiado!' : 'Copiar link para enviar por WhatsApp'}
    </button>
  );
}
