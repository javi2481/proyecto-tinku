'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'tinku-onboarding-dismissed-v1';

interface Props {
  hasStudents: boolean;
}

/**
 * Tour de 3 pasos para el padre la primera vez que entra al dashboard.
 * Se persiste en localStorage (no en DB): es solo una ayudita visual,
 * si entra desde otro device y lo vuelve a ver, no pasa nada grave.
 *
 * Se oculta automáticamente si:
 *  - ya lo dismisseó antes (localStorage), o
 *  - ya tiene al menos 1 hijo creado (significa que ya entendió el flujo).
 */
export function OnboardingTour({ hasStudents }: Props) {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasStudents) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch { /* no-op */ }
    setStep(0);
  }, [hasStudents]);

  const dismiss = (completed: boolean) => {
    try {
      if (completed) window.localStorage.setItem(STORAGE_KEY, '1');
    } catch { /* no-op */ }
    setStep(null);
  };

  if (step === null) return null;

  const STEPS = [
    {
      emoji: '👋',
      title: '¡Bienvenido/a a Tinkú!',
      body: 'Antes de entrar al panel, te muestro cómo funciona. Son 3 pasos cortitos.',
      cta: 'Dale →',
    },
    {
      emoji: '👧',
      title: '1 · Creá a tu hijo o hija',
      body: 'Con un toque de "Agregar hijo/a" podés crear su perfil. Solo pedimos primer nombre, año de nacimiento, grado y un avatar.',
      cta: 'Seguir →',
    },
    {
      emoji: '🔑',
      title: '2 · Compartile el código',
      body: 'Cada chico tiene un código de 6 letras (ej: 7ZBCVT). Se lo decís a viva voz o copias un link para mandar por WhatsApp. Nunca necesita email ni contraseña.',
      cta: 'Seguir →',
    },
    {
      emoji: '📊',
      title: '3 · Mirás su progreso',
      body: 'Acá en tu panel vas a ver qué conceptos domina, cuáles flojean y si hizo el repaso del día. Cuanto más juegue, más información vas a tener.',
      cta: '¡Arrancar!',
    },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      data-testid="onboarding-overlay"
      className="fixed inset-0 z-[90] bg-tinku-ink/60 backdrop-blur-sm flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-8 text-center space-y-5 shadow-2xl">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => dismiss(true)}
            data-testid="onboarding-skip"
            className="text-sm text-tinku-ink/50 hover:text-tinku-ink"
          >
            Saltar
          </button>
        </div>

        <div className="text-6xl leading-none" aria-hidden>{current.emoji}</div>
        <h2 id="onboarding-title" data-testid={`onboarding-step-${step}`} className="text-2xl font-bold text-tinku-ink">
          {current.title}
        </h2>
        <p className="text-tinku-ink/75 leading-relaxed">{current.body}</p>

        <div className="pt-2">
          <div className="h-1.5 rounded-full bg-tinku-ink/10 overflow-hidden">
            <div className="h-full bg-tinku-sea transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-tinku-ink/50 mt-2">
            Paso {step + 1} de {STEPS.length}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              data-testid="onboarding-back"
              className="flex-1 h-12 rounded-2xl bg-white border-2 border-tinku-ink/10 text-tinku-ink font-semibold hover:bg-tinku-mist/50"
            >
              ← Atrás
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isLast) dismiss(true);
              else setStep(step + 1);
            }}
            data-testid="onboarding-next"
            className="flex-1 h-12 rounded-2xl bg-tinku-sea text-white font-semibold hover:bg-tinku-sea/90"
          >
            {current.cta}
          </button>
        </div>

        {isLast && (
          <Link
            href="/students/new"
            onClick={() => dismiss(true)}
            data-testid="onboarding-to-create-student"
            className="block text-sm text-tinku-sea font-medium hover:underline pt-1"
          >
            Ir directo a crear mi primer hijo/a
          </Link>
        )}
      </div>
    </div>
  );
}
