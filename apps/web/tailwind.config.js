/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F6E56',
          dark: '#5DCAA5',
        },
        carb: '#BA7517',
        protein: '#378ADD',
        fat: '#D85A30',
      },
      maxWidth: {
        content: '1280px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        lift: '0 4px 16px -6px rgba(15, 23, 42, 0.10), 0 10px 28px -14px rgba(15, 110, 86, 0.25)',
        glow: '0 6px 20px -6px rgba(15, 110, 86, 0.45)',
      },
    },
  },
  plugins: [],
}
