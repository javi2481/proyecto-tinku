'use client';

import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface IslandPageWrapperProps {
  children: ReactNode;
  bgGradient: string;
}

export function IslandPageWrapper({ children, bgGradient }: IslandPageWrapperProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`min-h-screen ${bgGradient}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Animación para los concept cards
export const conceptCardVariants = {
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};