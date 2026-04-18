'use client';

import { useState, useTransition } from 'react';
import { acknowledgeStrugglingAction } from '@/lib/review/struggling';

interface Props {
  studentId: string;
  conceptId: string;
  conceptName: string;
}

export function AcknowledgeStrugglingButton({ studentId, conceptId, conceptName }: Props) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span
        data-testid={`struggling-cleared-${conceptId}`}
        className="text-xs text-tinku-ink/60 italic"
      >
        Listo. Le avisamos al motor que ya lo ayudaste con {conceptName} 💛
      </span>
    );
  }

  return (
    <button
      type="button"
      data-testid={`struggling-ack-${conceptId}`}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await acknowledgeStrugglingAction(studentId, conceptId);
          setDone(true);
        });
      }}
      className="inline-flex h-10 px-3 items-center rounded-xl bg-white text-tinku-ink text-xs font-medium border-2 border-tinku-warn/40 hover:bg-tinku-warn/10 disabled:opacity-60 exercise-target"
    >
      {pending ? 'Guardando…' : 'Ya lo ayudé'}
    </button>
  );
}
