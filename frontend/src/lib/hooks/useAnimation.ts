'use client';

import { useRef } from 'react';

interface UseAnimationReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  variants: {
    hidden: { opacity: number; scale: number };
    visible: { opacity: number; scale: number; transition: { duration: number } };
    correct: { scale: number[]; transition: { duration: number } };
    wrong: { x: number[]; transition: { duration: number } };
  };
}

export function useAnimation(): UseAnimationReturn {
  const ref = useRef<HTMLDivElement>(null);

  const variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    correct: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.3 }
    },
    wrong: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    },
  };

  return {
    ref,
    variants,
  };
}

// Simple animation helpers for inline use
export const animationPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  bounce: {
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 0.3 }
  },
  shake: {
    animate: { x: [0, -10, 10, -10, 10, 0] },
    transition: { duration: 0.4 }
  },
};