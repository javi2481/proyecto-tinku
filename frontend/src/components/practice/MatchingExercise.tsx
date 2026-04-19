'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface MatchingExerciseProps {
  content: {
    leftItems: string[]; // ej: ["2 × 3", "5 × 4", "7 × 2"]
    rightItems: string[]; // ej: ["6", "20", "14"]
  };
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const MatchingExercise = ({ content, value, onChange, disabled }: MatchingExerciseProps) => {
  const leftItems = content.leftItems || [];
  const rightItems = content.rightItems || [];

  // El value se guarda como JSON string: { "2 × 3": "6", "5 × 4": "20" }
  let matching: Record<string, string> = {};
  try {
    matching = value ? JSON.parse(value) : {};
  } catch {
    matching = {};
  }

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  // Items de la derecha que ya fueron usados
  const usedRightItems = Object.values(matching);

  const handleLeftClick = (item: string) => {
    if (disabled) return;
    setSelectedLeft(item === selectedLeft ? null : item);
  };

  const handleRightClick = (rightItem: string) => {
    if (disabled) return;
    if (!selectedLeft) return;

    // Si el rightItem ya está usado, primero lo liberamos
    const existingLeft = Object.entries(matching).find(([, val]) => val === rightItem)?.[0];
    const newMatching = { ...matching };

    if (existingLeft) {
      delete newMatching[existingLeft];
    }

    // Si el item izquierdo ya tenía pareja, la removemos
    if (matching[selectedLeft]) {
      delete newMatching[selectedLeft];
    }

    // Nuevo emparejamiento
    newMatching[selectedLeft] = rightItem;

    onChange(JSON.stringify(newMatching));
    setSelectedLeft(null);
  };

  const handleUnmatch = (leftItem: string) => {
    if (disabled) return;
    const newMatching = { ...matching };
    delete newMatching[leftItem];
    onChange(JSON.stringify(newMatching));
  };

  // Verificar si todo está emparejado
  const isComplete = Object.keys(matching).length === leftItems.length;

  return (
    <div className="w-full space-y-6 mt-4">
      <p className="text-sm font-bold text-tinku-ink/60 text-center uppercase tracking-wider">
        {isComplete ? "¡Listo! Evaluá tu respuesta" : "Elegí un item de cada lado para emparejar"}
      </p>

      {/* Columnas */}
      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        {/* Columna izquierda */}
        <div className="space-y-3">
          <h4 className="text-center text-sm font-semibold text-tinku-ink/50 uppercase tracking-wide">
            Columna A
          </h4>
          {leftItems.map((item) => {
            const isMatched = matching[item] !== undefined;
            const isSelected = item === selectedLeft;
            const rightMatch = matching[item];

            return (
              <button
                key={item}
                type="button"
                onClick={() => isMatched ? handleUnmatch(item) : handleLeftClick(item)}
                disabled={disabled}
                className={cn(
                  "w-full min-h-[3.5rem] px-4 py-2 rounded-2xl text-lg font-semibold border-2 transition-all",
                  isMatched
                    ? "border-tinku-leaf bg-tinku-leaf/10 text-tinku-ink"
                    : isSelected
                      ? "border-tinku-sea bg-tinku-sea/20 text-tinku-ink"
                      : "border-tinku-ink/10 bg-tinku-mist/30 text-tinku-ink hover:border-tinku-sea/50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {isMatched ? `${item} → ${rightMatch}` : item}
              </button>
            );
          })}
        </div>

        {/* Columna derecha */}
        <div className="space-y-3">
          <h4 className="text-center text-sm font-semibold text-tinku-ink/50 uppercase tracking-wide">
            Columna B
          </h4>
          {rightItems.map((item) => {
            const isUsed = usedRightItems.includes(item);

            return (
              <button
                key={item}
                type="button"
                onClick={() => handleRightClick(item)}
                disabled={disabled || isUsed}
                className={cn(
                  "w-full min-h-[3.5rem] px-4 py-2 rounded-2xl text-lg font-semibold border-2 transition-all",
                  isUsed
                    ? "border-tinku-ink/5 bg-tinku-mist/10 text-tinku-ink/30 cursor-not-allowed"
                    : selectedLeft
                      ? "border-tinku-sea/50 bg-tinku-sea/10 text-tinku-ink hover:border-tinku-sea cursor-pointer"
                      : "border-tinku-ink/10 bg-tinku-mist/30 text-tinku-ink hover:border-tinku-sea/50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instrucciones */}
      {selectedLeft && (
        <p className="text-center text-tinku-sea font-medium animate-pulse">
          Ahora hacé click en la Columna B para emparejar "{selectedLeft}"
        </p>
      )}
    </div>
  );
}