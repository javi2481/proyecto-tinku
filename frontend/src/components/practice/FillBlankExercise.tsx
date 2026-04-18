'use client';

import { cn } from '@/lib/utils/cn';

interface FillBlankExerciseProps {
  prompt: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function FillBlankExercise({ prompt, value, onChange, disabled }: FillBlankExerciseProps) {
  // Separamos el texto usando {blank} como comodín. 
  // Ej: "El ciclo del agua empieza con la {blank} de los océanos."
  const parts = prompt.split('{blank}');

  return (
    <div className="text-3xl md:text-4xl leading-relaxed text-slate-800 font-medium my-6 px-4">
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        return (
          <span key={index}>
            {part}
            {!isLast && (
              <input
                type="text"
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck="false"
                className={cn(
                  "mx-2 inline-block w-48 text-center border-b-4 border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all px-2 py-1 rounded-t-md",
                  disabled && "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                )}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}