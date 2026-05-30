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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
