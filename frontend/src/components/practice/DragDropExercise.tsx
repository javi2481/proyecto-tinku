'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface DragDropExerciseProps {
  content: {
    items: string[]; // ej: ["León", "Vaca", "Cocodrilo"]
    zones: string[]; // ej: ["Carnívoro", "Herbívoro"]
  };
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function DragDropExercise({ content, value, onChange, disabled }: DragDropExerciseProps) {
  const items = content.items || [];
  const zones = content.zones || [];
  // El value se almacena como JSON string: { "Carnívoro": "León" }
  const mapping: Record<string, string> = value ? JSON.parse(value) : {};

  const [activeItem, setActiveItem] = useState<string | null>(null);

  const handleZoneClick = (zone: string) => {
    if (disabled) return;
    if (activeItem) {
      // Ubica la ficha seleccionada en la zona y limpia la selección
      onChange(JSON.stringify({ ...mapping, [zone]: activeItem }));
      setActiveItem(null);
    } else if (mapping[zone]) {
      // Si tocás una zona ocupada y no tenés nada seleccionado, devuelve la ficha
      const newMap = { ...mapping };
      delete newMap[zone];
      onChange(JSON.stringify(newMap));
    }
  };

  const handleItemClick = (item: string) => {
    if (disabled) return;
    setActiveItem(item === activeItem ? null : item);
  };

  // Solo mostramos abajo las fichas que todavía no fueron ubicadas
  const availableItems = items.filter(i => !Object.values(mapping).includes(i));

  return (
    <div className="w-full space-y-8 mt-4">
      {/* Cajas objetivo (Zonas) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {zones.map(zone => {
          const mappedItem = mapping[zone];
          return (
            <div key={zone} className="flex flex-col gap-2">
              <span className="text-lg font-medium text-tinku-ink/80 px-2 text-center">{zone}</span>
              <button
                type="button"
                onClick={() => handleZoneClick(zone)}
                disabled={disabled}
                className={cn(
                  "min-h-[4.5rem] rounded-2xl border-[3px] border-dashed flex items-center justify-center p-3 transition-all exercise-target",
                  mappedItem 
                    ? "border-tinku-sea bg-tinku-sea/10 text-tinku-ink font-semibold text-2xl" 
                    : activeItem 
                      ? "border-tinku-sea/60 bg-tinku-mist/30 cursor-pointer hover:bg-tinku-sea/10" 
                      : "border-tinku-ink/20 bg-tinku-mist/10",
                  disabled && "cursor-not-allowed opacity-80"
                )}
              >
                {mappedItem ? mappedItem : activeItem ? "Tocar para ubicar acá" : ""}
              </button>
            </div>
          );
        })}
      </div>

      {/* Fichas disponibles */}
      <div className="bg-tinku-mist/30 rounded-3xl p-6 border-2 border-tinku-ink/5">
        <p className="text-sm font-bold text-tinku-ink/60 mb-4 text-center uppercase tracking-wider">
          {availableItems.length > 0 ? "Elegí una ficha para ubicar" : "¡Todo listo!"}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {availableItems.map(item => {
            const isActive = item === activeItem;
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleItemClick(item)}
                disabled={disabled}
                className={cn(
                  "h-14 px-6 rounded-2xl text-xl font-semibold border-2 transition-all transform active:scale-95 exercise-target",
                  isActive 
                    ? "border-tinku-sea bg-tinku-sea text-white shadow-md -translate-y-1" 
                    : "border-tinku-ink/10 bg-white text-tinku-ink hover:border-tinku-sea/50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}