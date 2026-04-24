import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ── Notion-BTP Color Palette ── */
      colors: {
        // Notion core
        notion: {
          black: 'rgba(0,0,0,0.95)',
          blue: '#0075de',
          active: '#005bab',
          focus: '#097fe8',
          navy: '#213183',
        },
        // Neutrals
        'warm-white': '#f6f5f4',
        'warm-dark': '#31302e',
        'n-gray': {
          300: '#a39e98',
          500: '#615d59',
        },
        // Semantics
        'sem-teal': '#2a9d99',
        'sem-green': '#1aae39',
        'sem-orange': '#dd5b00',
        'sem-pink': '#ff64c8',
        'sem-purple': '#391c57',
        'sem-brown': '#523410',
        // Interactive
        'badge-bg': '#f2f9ff',
        // Shadcn CSS variable mappings
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      /* ── Typography ── */
      fontFamily: {
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'display': ['64px', { lineHeight: '1.1', fontWeight: '700' }],
        'section': ['48px', { lineHeight: '1.15', fontWeight: '700' }],
        'subheading': ['26px', { lineHeight: '1.3', fontWeight: '700' }],
        'card-title': ['22px', { lineHeight: '1.3', fontWeight: '700' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'btn': ['15px', { lineHeight: '1.4', fontWeight: '600' }],
        'caption': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        'badge-text': ['12px', { lineHeight: '1.4', fontWeight: '600' }],
      },

      /* ── Spacing & Radius ── */
      borderRadius: {
        'notion-btn': '8px',
        'notion-card': '12px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      /* ── Shadows (Removed as per design system) ── */
      boxShadow: {
        none: 'none',
      },

      /* ── Background Images ── */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      /* ── Animations ── */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwindcss-dir')(),
    require('tailwind-scrollbar-hide'),
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.custom-scrollbar': {
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#a39e98',
            borderRadius: '20px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#615d59',
          },
          'scrollbar-width': 'thin',
          'scrollbar-color': '#a39e98 transparent',
        },
      });
    },
  ],
};
export default config;
