import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F4C8A',
          50: '#E8F0FB',
          100: '#C5D5F2',
          200: '#9DB7E8',
          300: '#7599DE',
          400: '#4D7BD4',
          500: '#255DCA',
          600: '#1A4EA1',
          700: '#0F4C8A',
          800: '#0A3566',
          900: '#051C44',
        },
        sand: {
          DEFAULT: '#F5E6C8',
          light: '#FDFAF3',
          dark: '#EDD09A',
        },
        teal: {
          hostn: 'rgb(10, 186, 181)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brand: '0 4px 14px 0 rgba(15, 76, 138, 0.25)',
        'brand-lg': '0 20px 40px -12px rgba(15, 76, 138, 0.25)',
        'card-hover': '0 25px 50px -12px rgba(15, 76, 138, 0.2), 0 8px 24px -6px rgba(0,0,0,0.06)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        glow: '0 0 24px rgba(15, 76, 138, 0.3)',
        'inner-white': 'inset 0 1px 0 rgba(255,255,255,0.15)',
        tab: '0 -4px 30px rgba(0,0,0,0.07)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'scaleY(0.92) translateY(-6px)' },
          '100%': { opacity: '1', transform: 'scaleY(1) translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(15, 76, 138, 0.4)' },
          '50%': { boxShadow: '0 0 24px 6px rgba(15, 76, 138, 0.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.22s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

