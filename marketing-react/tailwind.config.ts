import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // toggleable via .dark on <html>
  theme: {
    // Fluid type scale — clamp() so headings scale with viewport without breakpoints.
    fontSize: {
      '2xs': ['0.6875rem', { lineHeight: '1.5' }],          // 11px
      xs:    ['0.75rem',   { lineHeight: '1.5' }],          // 12
      sm:    ['0.875rem',  { lineHeight: '1.55' }],         // 14
      base:  ['1rem',      { lineHeight: '1.6' }],          // 16
      lg:    ['1.125rem',  { lineHeight: '1.6' }],          // 18
      xl:    ['1.25rem',   { lineHeight: '1.4' }],          // 20
      '2xl': ['1.5rem',    { lineHeight: '1.3' }],          // 24
      '3xl': ['clamp(1.75rem, 2.4vw, 2rem)',     { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      '4xl': ['clamp(2.25rem, 3.4vw, 2.75rem)',  { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      '5xl': ['clamp(2.75rem, 4.5vw, 3.75rem)',  { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      '6xl': ['clamp(3.5rem, 6.5vw, 5rem)',      { lineHeight: '1.0', letterSpacing: '-0.03em' }],
      // Hero display — fluid 44 → 88px
      hero:  ['clamp(2.75rem, 7vw, 5.5rem)',     { lineHeight: '0.95', letterSpacing: '-0.035em' }],
    },
    extend: {
      colors: {
        brand: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        navy: {
          950: '#070B16',
          900: '#0B1120',
          800: '#0F172A',
          700: '#131B2E',
          600: '#1A3557',
          500: '#23487A',
        },
        surface: {
          DEFAULT: '#FAFAF9',
          alt:     '#F4F4F5',
          card:    '#FFFFFF',
          sunken:  '#F1F5F9',
        },
        ink: {
          DEFAULT: '#0B0F1A', // warmer than slate
          body:    '#374151',
          dim:     '#6B7280',
          muted:   '#94A3B8',
          line:    '#E5E7EB',
        },
        // Neural Amber accent (per brief; used sparingly for stats/badges)
        amber: {
          400: '#FFB547',
          500: '#F59E0B',
          600: '#D97706',
        },
        success: {
          500: '#10B981',
        },
      },
      fontFamily: {
        // Fraunces serif italic for hero emphasis (per brief)
        serif:   ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        // Plus Jakarta Sans for headlines (existing brand font)
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        // JetBrains Mono for stats/exam codes (per brief)
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: {
        wrap: '1200px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        pill:  '999px',
      },
      boxShadow: {
        glow:      '0 30px 80px -20px rgba(234,88,12,.35)',
        glowSoft:  '0 20px 60px -25px rgba(234,88,12,.22)',
        card:      '0 1px 0 0 rgba(15,23,42,.04), 0 10px 30px -12px rgba(15,23,42,.10)',
        cardHover: '0 1px 0 0 rgba(15,23,42,.06), 0 24px 50px -20px rgba(15,23,42,.18)',
        ring:      '0 0 0 1px rgba(15,23,42,.06)',
        inset:     'inset 0 1px 0 0 rgba(255,255,255,.5)',
      },
      backgroundImage: {
        'mesh-light':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(251,146,60,.20), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 20%, rgba(59,130,246,.14), transparent 60%), radial-gradient(ellipse 70% 60% at 0% 70%, rgba(234,88,12,.10), transparent 60%)',
        'mesh-dark':
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(234,88,12,.18), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 30%, rgba(26,53,87,.5), transparent 60%), radial-gradient(ellipse 60% 60% at 0% 100%, rgba(11,17,32,.8), transparent 60%)',
        'grad-hero':
          'linear-gradient(135deg, #070B16 0%, #0B1120 40%, #131B2E 70%, #1A3557 100%)',
        'grad-glow':
          'radial-gradient(800px circle at 50% 0%, rgba(234,88,12,.18), transparent 60%)',
        'grad-card':
          'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.5))',
        'grad-card-dark':
          'linear-gradient(180deg, rgba(19,27,46,0.85), rgba(11,17,32,0.5))',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0) translateX(0)' },
          '50%':     { transform: 'translateY(-12px) translateX(6px)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '.6' },
        },
      },
      animation: {
        float:          'float 6s ease-in-out infinite',
        'float-slow':   'float-slow 12s ease-in-out infinite',
        marquee:        'marquee 38s linear infinite',
        'marquee-slow': 'marquee 60s linear infinite',
        shimmer:        'shimmer 2.5s linear infinite',
        'pulse-soft':   'pulse-soft 3s ease-in-out infinite',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.025em',
      },
      transitionTimingFunction: {
        'ease-standard': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-snappy':   'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-hero':     'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
