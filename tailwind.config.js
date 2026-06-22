/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f7f0',
          100: '#c3ecdb',
          400: '#1db87a',
          500: '#0b8c5c',
          600: '#07643f',
          900: '#0d2b1f',
        },
        sidebar: {
          DEFAULT: '#0d2b1f',
          foreground: '#a7c4b3',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        lg: '14px',
        md: '8px',
      },
    },
  },
  plugins: [],
};
