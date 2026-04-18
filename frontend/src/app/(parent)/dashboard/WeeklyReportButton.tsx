'use client';

import { useState, useTransition } from 'react';
import { getWeeklyReportAction } from '@/lib/review/weekly-report';

interface Props {
  studentId: string;
  studentName: string;
}

/**
 * Botón "Reporte semanal" en el dashboard del padre.
 * Pide al server el texto armado (lee sessions+attempts+mastery+struggling),
 * abre un modal liviano con el texto en un <pre>, y ofrece copiar / compartir.
 */
export function WeeklyReportButton({ studentId, studentName }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    setCopied(false);
    startTransition(async () => {
      const { message: m } = await getWeeklyReportAction(studentId);
      setMessage(m);
      setOpen(true);
    });
  };

  const handleCopyOrShare = async () => {
    if (!message) return;
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          await (navigator as Navigator & { share: (d: { text: string; title?: string }) => Promise<void> }).share({
            title: `Resumen semanal de ${studentName}`,
            text: message,
          });
          setCopied(true);
          return;
        } catch {
          // usuario canceló o no soportado → clipboard
        }
      }
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      // silencioso
    } finally {
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        data-testid={`weekly-report-btn-${studentId}`}
        className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white text-tinku-ink text-xs font-medium border-2 border-tinku-sea/30 hover:bg-tinku-sea/5 disabled:opacity-60"
      >
        <span aria-hidden>📊</span>
        <span>{pending ? 'Armando resumen…' : 'Reporte semanal'}</span>
      </button>

      {open && message && (
        <div
          data-testid={`weekly-report-modal-${studentId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-tinku-ink">Resumen semanal de {studentName}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-full hover:bg-tinku-ink/5 text-tinku-ink/60 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <pre
              data-testid={`weekly-report-text-${studentId}`}
              className="whitespace-pre-wrap text-sm text-tinku-ink bg-tinku-mist/40 rounded-2xl p-4 font-sans leading-relaxed max-h-[50vh] overflow-y-auto border border-tinku-ink/10"
            >
              {message}
            </pre>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 px-4 rounded-xl bg-white text-tinku-ink/70 text-sm font-medium border-2 border-tinku-ink/10 hover:bg-tinku-ink/5"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleCopyOrShare}
                data-testid={`weekly-report-copy-${studentId}`}
                className="h-10 px-4 rounded-xl bg-tinku-sea text-white text-sm font-semibold hover:bg-tinku-sea/90"
              >
                {copied ? '¡Listo!' : 'Copiar / Compartir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
