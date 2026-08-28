import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF8FF',
        surface: '#FFFFFF',
        ink: '#1F1B2E',
        muted: '#6B647F',
        line: '#ECE7F7',
        ribbon: {
          DEFAULT: '#FF5D8F',
          soft: '#FFE3EC',
          dark: '#D93E70',
        },
        bow: {
          DEFAULT: '#16A399',
          soft: '#DDF5F2',
          dark: '#0E7A72',
        },
        amber: {
          DEFAULT: '#FFB020',
          soft: '#FFF1D6',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
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
        card: '0 1px 2px rgba(31,27,46,0.04), 0 6px 16px -8px rgba(31,27,46,0.12)',
        pop: '0 2px 6px rgba(255,93,143,0.25)',
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
