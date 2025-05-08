/* eslint-disable linebreak-style */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        background: 'var(--color-background)',
        'card-bg': 'var(--color-card-background)',
        'text-default': 'var(--color-text-default)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
      },
      fontFamily: {
        sans: 'var(--font-family)',
      },
    },
  },
  plugins: [],
};

/* eslint-disable linebreak-style */
