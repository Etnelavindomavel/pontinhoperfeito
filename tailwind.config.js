/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        secondary: {
          600: '#14B8A6',
          700: '#0D9488',
        },
        accent: {
          500: '#F97316',
          600: '#EA580C',
        },
        success: {
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          500: '#F59E0B',
          600: '#D97706',
        },
      },
    },
  },
  plugins: [],
}
