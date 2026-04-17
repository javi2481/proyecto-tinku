import type { Config } from 'tailwindcss';

/**
 * Tinkú — Design tokens
 * UX infantil (6-12 años) + Dashboard del padre.
 * Andika sólo se aplica dentro del grupo `.student-scope` (ver globals.css).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        student: ['var(--font-andika)', 'system-ui', 'sans-serif'],
        parent: ['var(--font-parent)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Mínimos UX infantil
        'child-base': ['18px', { lineHeight: '1.6' }],
        'child-question': ['24px', { lineHeight: '1.5' }],
      },
      colors: {
        // Paleta Tinkú (placeholder inicial — refinamos con design agent en iteración visual)
        tinku: {
          sea: '#2AB6C7',       // islas
          sand: '#F5E6C8',      // regiones
          leaf: '#57B894',      // éxito / correcto
          warn: '#FF8C42',      // feedback suave (NO rojo puro)
          coral: '#F05E5E',     // reservado para alerts adultos (nunca mostrar a chicos)
          ink: '#1E2A3A',       // texto principal
          mist: '#EEF4F7',      // fondos claros
        },
      },
      spacing: {
        // Tap targets infantiles
        'tap-min': '48px',
        'tap-exercise': '56px',
      },
      transitionTimingFunction: {
        'tinku-pop': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'celebrate': 'celebrate 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        celebrate: {
          '0%':   { transform: 'scale(0.8)',  opacity: '0' },
          '40%':  { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
