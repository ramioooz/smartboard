import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // All colors reference CSS variables — no hardcoded colors.
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        primary: 'var(--primary)',
        primaryFg: 'var(--primaryFg)',
        accent: 'var(--accent)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      transitionDuration: {
        DEFAULT: 'var(--transition)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
