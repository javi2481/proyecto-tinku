'use client';

import { useState, useTransition } from 'react';

interface BadgeInfo {
  name_es: string;
  earned_at: string;
}

interface Props {
  studentName: string;
  totalXp: number;
  earnedBadges: BadgeInfo[];
}

/**
 * Botón para compartir medallas por WhatsApp/familia.
 * Arma un mensaje rioplatense con XP + medallas + fecha + emoji
 * y lo copia al portapapeles. El chico/padre lo pega donde quiera.
 *
 * Se mantiene texto (no PNG) a propósito: cero canvas, cero fricción,
 * funciona en cualquier dispositivo, cualquier app.
 */
export function ShareAchievementsButton({ studentName, totalXp, earnedBadges }: Props) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const buildMessage = () => {
    const fmt = (iso: string) =>
      new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' }).format(new Date(iso));
    const header = `🌟 ¡Mirá las medallas de ${studentName} en Tinkú! 🌟\n\n`;
    const stats = `⭐ ${totalXp} XP acumulados\n🏅 ${earnedBadges.length} medalla${earnedBadges.length === 1 ? '' : 's'} ganada${earnedBadges.length === 1 ? '' : 's'}\n\n`;
    const list = earnedBadges.length
      ? earnedBadges.map((b) => `🏅 ${b.name_es} — ${fmt(b.earned_at)}`).join('\n') + '\n\n'
      : 'Recién empieza el camino 🌱\n\n';
    const footer = `Está aprendiendo en tinku.app 💛`;
    return header + stats + list + footer;
  };

  const handleClick = () => {
    const msg = buildMessage();
    startTransition(async () => {
      try {
        // Web Share API primero (mobile → abre WhatsApp nativo)
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
          try {
            await (navigator as Navigator & { share: (d: { text: string; title?: string }) => Promise<void> }).share({
              title: `Medallas de ${studentName} en Tinkú`,
              text: msg,
            });
            setStatus('copied');
            return;
          } catch {
            // Usuario canceló o no soportado → seguimos a clipboard
          }
        }
        await navigator.clipboard.writeText(msg);
        setStatus('copied');
      } catch {
        setStatus('error');
      } finally {
        window.setTimeout(() => setStatus('idle'), 3000);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || earnedBadges.length === 0}
      data-testid="share-achievements-btn"
      className="inline-flex items-center gap-2 h-12 px-5 rounded-2xl bg-tinku-sea text-white font-semibold hover:bg-tinku-sea/90 disabled:opacity-50 disabled:cursor-not-allowed exercise-target shadow-sm"
    >
      <span aria-hidden>💬</span>
      <span>
        {status === 'copied' ? '¡Listo! Copiado/Compartido' : status === 'error' ? 'Uy, no funcionó' : 'Compartir mis medallas'}
      </span>
    </button>
  );
}
