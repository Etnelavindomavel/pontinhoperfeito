import { designSystem } from './src/styles/designSystem.js'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors - Paleta oficial Ponto Perfeito
        'primary-main': '#0430ba',
        'primary-light': '#2558d8',
        'primary-dark': '#02258d',
        'secondary-main': '#fad036',
        'secondary-yellow': '#fbf409',
        'accent-main': '#3549fc',
        'neutral-offWhite': '#f9f9f9',
        'neutral-lighter': '#fcfcfc',
        'neutral-light': '#e5e5e5',
        'neutral-medium': '#4d4d4d',
        'neutral-dark': '#303030',
        'neutral-darker': '#1a1a1a',
        // Brand colors (legado)
        'brand-blue': designSystem.colors.primary.blue,
        'brand-blue-light': designSystem.colors.primary.light,
        'brand-blue-dark': designSystem.colors.primary.dark,
        'brand-cyan': designSystem.colors.primary.cyan,
        'brand-mustard': designSystem.colors.accent.mustard,
        'brand-yellow': designSystem.colors.accent.yellow,
        
        // Aliases para compatibilidade
        'brand-primary-dark': designSystem.colors.primary.dark,
        'brand-primary': designSystem.colors.primary.main,
        'brand-primary-light': designSystem.colors.primary.light,
        'brand-orange': designSystem.colors.accent.mustard,
        
        // Text / Background
        'text-primary': designSystem.colors.neutral.text.primary,
        'text-secondary': designSystem.colors.neutral.text.secondary,
        'text-tertiary': designSystem.colors.neutral.text.tertiary,
        'bg-primary': designSystem.colors.neutral.bg.primary,
        'bg-secondary': designSystem.colors.neutral.bg.secondary,
        'bg-tertiary': designSystem.colors.neutral.bg.tertiary,
        
        // Primary shades
        primary: {
          50: '#EFF3FF',
          100: '#DBE4FE',
          200: '#BFD1FE',
          300: '#93B2FD',
          400: designSystem.colors.primary.cyan,
          500: designSystem.colors.primary.blue,
          600: designSystem.colors.primary.blueDark,
          700: designSystem.colors.primary.blueDeep,
          800: '#010D3B',
          900: '#00071F',
        },
        secondary: {
          600: '#14B8A6',
          700: '#0D9488',
        },
        accent: {
          mustard: designSystem.colors.accent.mustard,
          yellow: designSystem.colors.accent.yellow,
        },
        success: { 500: '#10B981', 600: '#059669' },
        warning: { 500: '#F59E0B', 600: '#D97706' },
      },
      
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: designSystem.typography.scale,
      
      spacing: designSystem.spacing,
      
      borderRadius: {
        'brand-sm': designSystem.radius.sm,
        'brand': designSystem.radius.base,
        'brand-base': designSystem.radius.md,
        'brand-md': designSystem.radius.md,
        'brand-lg': designSystem.radius.lg,
        'brand-xl': designSystem.radius.xl,
      },
      
      boxShadow: {
        'colored-blue': designSystem.colors.shadows.blue,
        'colored-mustard': designSystem.colors.shadows.mustard,
        'colored-cyan': designSystem.colors.shadows.cyan,
        'colored-mixed': designSystem.colors.shadows.mixed,
        'brand-sm': designSystem.colors.shadows.sm,
        'brand': designSystem.colors.shadows.base,
        'brand-md': designSystem.colors.shadows.md,
        'brand-lg': designSystem.colors.shadows.lg,
        'brand-xl': designSystem.colors.shadows.xl,
        'brand-2xl': designSystem.colors.shadows['2xl'],
        'brand-colored': designSystem.colors.shadows.blue,
        'brand-mustard': designSystem.colors.shadows.mustard,
        'brand-mixed': designSystem.colors.shadows.mixed,
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      animation: {
        'fadeInUp': 'fadeInUp 0.6s ease-out forwards',
        'fadeInLeft': 'fadeInLeft 0.6s ease-out forwards',
        'fadeInRight': 'fadeInRight 0.6s ease-out forwards',
        'scaleIn': 'scaleIn 0.5s ease-out forwards',
        'pulse-subtle': 'pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      
      transitionDuration: designSystem.animations.duration,
      
      transitionTimingFunction: {
        'smooth': designSystem.animations.easing.smooth,
        'bounce': designSystem.animations.easing.bounce,
        'elastic': designSystem.animations.easing.elastic,
      },
    },
  },
  plugins: [],
}
