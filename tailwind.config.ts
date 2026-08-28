import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: '#FFFFFF',
        cream: '#FCF1EC',
        ink: '#413B3B',
        muted: '#8C8171',
        line: '#EEEEEE',
        header: {
          DEFAULT: '#C2023F',
          dark: '#9E0233',
        },
        pink: {
          DEFAULT: '#FFDCEC',
        },
        yellow: {
          DEFAULT: '#F4F26F',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        logo: ['var(--font-logo)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.2rem' }],
        base: ['0.875rem', { lineHeight: '1.35rem' }],
        md: ['0.9375rem', { lineHeight: '1.4rem' }],
        lg: ['1.05rem', { lineHeight: '1.4rem' }],
        xl: ['1.25rem', { lineHeight: '1.5rem' }],
        '2xl': ['1.6rem', { lineHeight: '1.9rem' }],
        '3xl': ['2rem', { lineHeight: '2.2rem' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(65,59,59,0.03), 0 8px 18px -12px rgba(65,59,59,0.18)',
        pop: '0 2px 6px rgba(194,2,63,0.18)',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.6s ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;

