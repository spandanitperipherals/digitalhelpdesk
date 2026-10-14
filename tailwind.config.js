const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#0b0f19',
        navy: '#0f172a',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'var(--font-gujarati)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      backgroundImage: {
        'specular-spot':
          'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), transparent 60%)',
        'specular-sheen':
          'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.09) 50%, transparent 62%)',
        'specular-amber':
          'radial-gradient(circle at 30% 20%, rgba(251,191,36,0.28), transparent 55%)',
        'specular-rim':
          'linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 40%, rgba(245,158,11,0.18))',
        'ambient-saffron':
          'radial-gradient(60% 50% at 0% 0%, rgba(245,158,11,0.16), transparent 70%)',
        'ambient-ice':
          'radial-gradient(55% 45% at 100% 100%, rgba(16,185,129,0.12), transparent 70%)',
      },
      boxShadow: {
        glass:
          '0 24px 60px -20px rgba(2,6,23,0.8), inset 0 1px 0 0 rgba(255,255,255,0.08)',
        depth:
          '0 30px 60px -24px rgba(2,6,23,0.85), 0 12px 24px -12px rgba(2,6,23,0.6)',
        'glow-amber': '0 0 24px -4px rgba(245,158,11,0.45)',
        'glow-emerald': '0 0 20px -4px rgba(16,185,129,0.5)',
      },
      keyframes: {
        'status-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
      },
      animation: {
        'status-ring': 'status-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities, matchUtilities }) {
      matchUtilities(
        { perspective: (value) => ({ perspective: value }) },
        {
          values: {
            none: 'none',
            500: '500px',
            1000: '1000px',
            1500: '1500px',
            2000: '2000px',
          },
        }
      );

      matchUtilities(
        { 'perspective-origin': (value) => ({ perspectiveOrigin: value }) },
        {
          values: {
            center: 'center',
            top: 'top',
            bottom: 'bottom',
            left: 'left',
            right: 'right',
          },
        }
      );

      addUtilities({
        '.preserve-3d': { transformStyle: 'preserve-3d' },
        '.preserve-flat': { transformStyle: 'flat' },
        '.backface-hidden': {
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        },
        '.backface-visible': {
          backfaceVisibility: 'visible',
          WebkitBackfaceVisibility: 'visible',
        },
        '.pt-safe': { paddingTop: 'env(safe-area-inset-top, 0px)' },
        '.pb-safe': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.pl-safe': { paddingLeft: 'env(safe-area-inset-left, 0px)' },
        '.pr-safe': { paddingRight: 'env(safe-area-inset-right, 0px)' },
      });
    }),
  ],
};