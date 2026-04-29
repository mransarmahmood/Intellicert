import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        surface: {
          DEFAULT: '#FAFAF9',
          alt: '#F4F4F5',
          card: '#FFFFFF',
          sunken: '#F1F5F9',
        },
        ink: {
          DEFAULT: '#0F172A',
          body: '#334155',
          dim: '#64748B',
          muted: '#94A3B8',
          line: '#E2E8F0',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(15,23,42,.04), 0 10px 30px -12px rgba(15,23,42,.10)',
        cardHover: '0 1px 0 0 rgba(15,23,42,.06), 0 24px 50px -20px rgba(15,23,42,.18)',
        glow: '0 30px 80px -20px rgba(234,88,12,.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
