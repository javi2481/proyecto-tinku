'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export type CelebrationVariant = 'xp' | 'badge' | 'mastered';

export interface CelebrationPayload {
  variant: CelebrationVariant;
  title: string;
  body?: string;
  xpEarned?: number;
  badgeIcon?: string;
  badgeName?: string;
  /**
   * Llamado al cerrar (click fuera, Enter, o botón Seguir).
   * No se dispara hasta pasar MIN_DURATION_MS desde el open (>=1.5s per UX infantil).
   */
  onClose: () => void;
  ctaLabel?: string;
}

const MIN_DURATION_MS = 1500;
const SOUND_PREF_KEY = 'tinku-sound';

function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SOUND_PREF_KEY) !== 'off';
}

function setSoundEnabled(on: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SOUND_PREF_KEY, on ? 'on' : 'off');
}

/** Chime generado via Web Audio API, sin asset. Corto, amigable, 2 tonos. */
function playChime(variant: CelebrationVariant) {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    const notes =
      variant === 'mastered'
        ? [523.25, 659.25, 783.99] // C5 E5 G5
        : variant === 'badge'
        ? [659.25, 830.61] // E5 G#5
        : [523.25, 659.25]; // C5 E5
    const start = ctx.currentTime + 0.02;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = start + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.start(t);
      osc.stop(t + 0.3);
    });
    // Cerrar context a los 2s para liberar recursos
    window.setTimeout(() => ctx.close().catch(() => void 0), 2000);
  } catch {
    // silent fail
  }
}

function blastConfetti(variant: CelebrationVariant) {
  const colors = ['#F2B84B', '#2F7A8C', '#6BAE75', '#E57C42', '#A259FF'];
  const defaults = { zIndex: 9999, colors, disableForReducedMotion: true };
  if (variant === 'mastered') {
    // Ráfaga + cascada
    confetti({ ...defaults, particleCount: 180, spread: 90, origin: { y: 0.55 }, scalar: 1.1 });
    window.setTimeout(() => confetti({ ...defaults, particleCount: 80, spread: 120, startVelocity: 35, origin: { y: 0.3 } }), 220);
  } else if (variant === 'badge') {
    confetti({ ...defaults, particleCount: 140, spread: 75, origin: { y: 0.6 }, scalar: 1.05 });
  } else {
    confetti({ ...defaults, particleCount: 90, spread: 65, origin: { y: 0.65 } });
  }
}

export function CelebrationModal(props: CelebrationPayload) {
  const { variant, title, body, xpEarned, badgeIcon, badgeName, onClose, ctaLabel = '¡Seguir!' } = props;
  const [soundOn, setSoundOn] = useState<boolean>(() => getSoundEnabled());
  const [canClose, setCanClose] = useState(false);
  const openedAtRef = useRef<number>(Date.now());
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    openedAtRef.current = Date.now();
    blastConfetti(variant);
    if (soundOn) playChime(variant);
    const t = window.setTimeout(() => setCanClose(true), MIN_DURATION_MS);
    return () => window.clearTimeout(t);
    // soundOn/variant estables durante la vida del modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Foco al botón cuando se habilita
    if (canClose) closeBtnRef.current?.focus();
  }, [canClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') && canClose) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canClose, onClose]);

  const icon =
    variant === 'mastered' ? '🌟'
    : variant === 'badge' ? (badgeIcon ?? '🏅')
    : '🎉';

  return (
    <div
      data-testid="celebration-backdrop"
      className="fixed inset-0 z-[100] bg-tinku-ink/60 backdrop-blur-sm flex items-center justify-center p-5 animate-[fadein_180ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      onClick={() => {
        if (canClose) onClose();
      }}
    >
      <div
        data-testid="celebration-modal"
        data-variant={variant}
        className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center space-y-4 shadow-2xl animate-celebrate"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          data-testid="celebration-sound-toggle"
          onClick={() => {
            const nv = !soundOn;
            setSoundOn(nv);
            setSoundEnabled(nv);
            if (nv) playChime(variant);
          }}
          className="absolute top-3 right-3 h-10 w-10 rounded-full bg-tinku-ink/5 hover:bg-tinku-ink/10 flex items-center justify-center text-lg"
          aria-label={soundOn ? 'Silenciar sonido' : 'Activar sonido'}
          title={soundOn ? 'Silenciar sonido' : 'Activar sonido'}
        >
          <span aria-hidden>{soundOn ? '🔊' : '🔈'}</span>
        </button>

        <div className="text-7xl leading-none" aria-hidden>{icon}</div>
        <h2 id="celebration-title" data-testid="celebration-title" className="text-3xl font-bold text-tinku-ink">
          {title}
        </h2>
        {body && (
          <p data-testid="celebration-body" className="text-tinku-ink/75 text-base leading-relaxed">
            {body}
          </p>
        )}
        {typeof xpEarned === 'number' && xpEarned > 0 && (
          <div
            data-testid="celebration-xp"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tinku-sand/60 text-tinku-ink font-semibold"
          >
            <span aria-hidden>⭐</span> +{xpEarned} XP
          </div>
        )}
        {badgeName && variant === 'badge' && (
          <p data-testid="celebration-badge-name" className="text-tinku-ink/80 font-medium">
            Medalla: <strong>{badgeName}</strong>
          </p>
        )}

        <button
          ref={closeBtnRef}
          type="button"
          data-testid="celebration-close"
          onClick={onClose}
          disabled={!canClose}
          className="w-full h-14 rounded-2xl bg-tinku-sea text-white font-semibold text-lg hover:bg-tinku-sea/90 disabled:opacity-50 disabled:cursor-wait exercise-target"
        >
          {canClose ? ctaLabel : 'Uff, qué emoción…'}
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
