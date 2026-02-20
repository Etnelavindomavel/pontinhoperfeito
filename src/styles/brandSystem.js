/**
 * DESIGN SYSTEM - PONTO PERFEITO
 * Baseado nas cores oficiais da marca
 * Desenvolvendo o varejo. Ponto a ponto.
 */

export const brandSystem = {
  // ==================== PALETA OFICIAL ====================

  colors: {
    primary: {
      50: '#e6eaff',
      100: '#c2ccff',
      200: '#9dadff',
      300: '#778eff',
      400: '#516fff',
      500: '#0430ba',
      600: '#0328a3',
      700: '#02258d',
      800: '#0a3293',
      900: '#0030ba',

      main: '#0430ba',
      light: '#2558d8',
      lighter: '#2d67e8',
      dark: '#02258d',
      darker: '#0030ba',
    },

    secondary: {
      50: '#fdffa1',
      100: '#fdf0a8',
      200: '#fce855',
      300: '#fbf409',
      400: '#f0d026',
      500: '#fad036',
      600: '#e1bb1f',
      700: '#c8a608',
      800: '#af9100',
      900: '#967c00',

      main: '#fad036',
      yellow: '#fbf409',
      light: '#fdf0a8',
      lighter: '#fdffa1',
      dark: '#f0d026',
    },

    accent: {
      main: '#3549fc',
      light: '#5c6fff',
      lighter: '#8395ff',
      dark: '#1e3de8',
      darker: '#1231d4',
    },

    neutral: {
      white: '#ffffff',
      offWhite: '#f9f9f9',
      lighter: '#fcfcfc',
      light: '#e5e5e5',
      medium: '#4d4d4d',
      dark: '#303030',
      darker: '#1a1a1a',
      black: '#000000',
    },

    semantic: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0430ba',
    },
  },

  // ==================== TIPOGRAFIA ====================

  typography: {
    hero: {
      fontSize: '5rem',
      lineHeight: '1',
      fontWeight: '900',
      letterSpacing: '-0.03em',
      fontFamily: '"Inter", system-ui, sans-serif',
    },
    metric: {
      fontSize: '3.5rem',
      lineHeight: '1',
      fontWeight: '900',
      letterSpacing: '-0.02em',
    },
    value: {
      fontSize: '2rem',
      lineHeight: '1',
      fontWeight: '700',
      letterSpacing: '-0.015em',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.01em',
      textTransform: 'uppercase',
    },
    label: {
      fontSize: '0.6875rem',
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    body: {
      fontSize: '0.875rem',
      lineHeight: '1.5',
      fontWeight: '400',
    },
    small: {
      fontSize: '0.75rem',
      lineHeight: '1.4',
      fontWeight: '400',
    },
    tiny: {
      fontSize: '0.625rem',
      lineHeight: '1.3',
      fontWeight: '500',
    },
  },

  // ==================== ESPAÇAMENTO ====================

  spacing: {
    section: '3rem',
    cardLarge: '2rem',
    card: '1.5rem',
    cardSmall: '1rem',
    grid: '1rem',
    tight: '0.5rem',
    loose: '2.5rem',
  },

  // ==================== LAYOUT ====================

  layout: {
    maxWidth: '1440px',
    containerPadding: {
      mobile: '1rem',
      tablet: '2rem',
      desktop: '3rem',
    },
  },

  // ==================== GRID ====================

  grid: {
    kpis: {
      desktop: 'repeat(5, 1fr)',
      tablet: 'repeat(3, 1fr)',
      mobile: 'repeat(2, 1fr)',
      gap: '1rem',
    },
  },

  // ==================== BORDAS ====================

  radius: {
    card: '0.75rem',
    button: '0.5rem',
    small: '0.375rem',
  },

  borders: {
    width: '2px',
    color: {
      light: '#e5e5e5',
      medium: '#4d4d4d',
      dark: '#303030',
    },
  },

  // ==================== SOMBRAS ====================

  shadows: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    brand: '0 10px 30px -5px rgba(4, 48, 186, 0.15)',
  },

  // ==================== TRANSIÇÕES ====================

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export default brandSystem
