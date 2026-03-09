/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FAFAF7',
          100: '#F5F5F0',
          200: '#E8E6DF',
          300: '#D4D1C7',
          400: '#B5B1A4',
          500: '#918C7E',
          600: '#6E6A5E',
          700: '#4A4740',
          800: '#2D2B28',
          900: '#1A1917',
        },
        dusk: {
          100: '#EEECE7',
          200: '#D4D1C7',
          300: '#B5B1A4',
          400: '#8A8578',
          500: '#6E6A5E',
          600: '#4A4740',
          700: '#3D3A35',
          800: '#2B2926',
          900: '#1C1A17',
          950: '#141311',
        },
        sage: {
          DEFAULT: '#7C9070',
          light: '#8FA382',
        },
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '38rem',
        wide: '48rem',
      },
      letterSpacing: {
        display: '-0.02em',
      },
    },
  },
  plugins: [],
};
