'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker al montar el layout raíz.
 * Silenciamos errores porque SW es progresivo — si falla, la app funciona igual.
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // En dev, Next.js puede tener conflictos con SW. Solo registramos en prod
    // o cuando explícitamente queremos probarlo (NEXT_PUBLIC_ENABLE_SW=1).
    const enabled =
      process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === '1';
    if (!enabled) return;
    const reg = () => navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    if (document.readyState === 'complete') reg();
    else window.addEventListener('load', reg, { once: true });
  }, []);
  return null;
}
