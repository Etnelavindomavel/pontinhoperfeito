/**
 * PONTO PERFEITO - DESIGN SYSTEM OFICIAL
 * "PRECISÃO ENERGÉTICA"
 */

export const designSystem = {
  colors: {
    // Primárias
    primary: {
      blue: '#0430BA',
      cyan: '#3549FC',
      blueDark: '#02217A',
      blueDeep: '#011556',
      blueLight: '#5B6EFD',
      // Aliases para compatibilidade com tailwind
      main: '#0430BA',
      light: '#3549FC',
      dark: '#02217A',
      darker: '#011556',
      lighter: '#5B6EFD',
    },

    // Acentos
    accent: {
      mustard: '#FAD036',
      yellow: '#FBF409',
      mustardDark: '#C7A31E',
      yellowLight: '#FEF08A',
    },

    // Neutros com contraste garantido
    neutral: {
      // Light mode
      bg: '#F9F9F9',
      bgWhite: '#FFFFFF',
      textPrimary: '#0A0A0A',
      textSecondary: '#404040',
      textTertiary: '#737373',
      border: '#E5E5E5',

      // Dark mode
      bgDark: '#0A0A0A',
      bgDarkSurface: '#171717',
      textDarkPrimary: '#FAFAFA',
      textDarkSecondary: '#E5E5E5',
      textDarkTertiary: '#A3A3A3',
      borderDark: '#404040',

      // Estrutura aninhada para compatibilidade
      bg: {
        primary: '#FFFFFF',
        secondary: '#F9F9F9',
        tertiary: '#F3F4F6',
        card: '#FFFFFF',
      },
      text: {
        primary: '#0A0A0A',
        secondary: '#404040',
        tertiary: '#737373',
        disabled: '#A3A3A3',
      },
      border: {
        light: '#E5E5E5',
        medium: '#D4D4D4',
        dark: '#A3A3A3',
      },
      dark: {
        bg: {
          primary: '#0A0A0A',
          secondary: '#171717',
          tertiary: '#262626',
          card: '#1F1F1F',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#E5E5E5',
          tertiary: '#A3A3A3',
          disabled: '#737373',
        },
        border: {
          light: '#404040',
          medium: '#525252',
          dark: '#737373',
        },
      },
    },

    // Gradientes únicos
    gradients: {
      energy: 'linear-gradient(135deg, #0430BA 0%, #3549FC 100%)',
      insight: 'linear-gradient(135deg, #FAD036 0%, #FBF409 100%)',
      contrast: 'linear-gradient(135deg, #0430BA 0%, #FAD036 100%)',
      depth: 'linear-gradient(180deg, #0430BA 0%, rgba(4,48,186,0) 100%)',
      radialBlue: 'radial-gradient(circle at top right, #3549FC 0%, #0430BA 100%)',
      radialYellow: 'radial-gradient(circle at top left, #FBF409 0%, #FAD036 100%)',
    },

    // Sombras COLORIDAS (marca registrada)
    shadows: {
      blue: '0 10px 40px -10px rgba(4, 48, 186, 0.4)',
      blueStrong: '0 20px 60px -10px rgba(4, 48, 186, 0.5)',
      cyan: '0 10px 40px -10px rgba(53, 73, 252, 0.4)',
      mustard: '0 10px 40px -10px rgba(250, 208, 54, 0.5)',
      mixed: '0 20px 60px -10px rgba(4, 48, 186, 0.3), 0 15px 40px -10px rgba(250, 208, 54, 0.3)',
      elevation: '0 4px 20px rgba(10, 10, 10, 0.1)',
      // Aliases para compatibilidade
      sm: '0 1px 2px 0 rgba(4, 48, 186, 0.05)',
      base: '0 1px 3px 0 rgba(4, 48, 186, 0.1), 0 1px 2px 0 rgba(4, 48, 186, 0.06)',
      md: '0 4px 6px -1px rgba(4, 48, 186, 0.1), 0 2px 4px -1px rgba(4, 48, 186, 0.06)',
      lg: '0 10px 40px -10px rgba(4, 48, 186, 0.4)',
      xl: '0 20px 25px -5px rgba(4, 48, 186, 0.1), 0 10px 10px -5px rgba(4, 48, 186, 0.04)',
      '2xl': '0 25px 50px -12px rgba(4, 48, 186, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(4, 48, 186, 0.06)',
    },

    // Status (contraste WCAG)
    status: {
      success: {
        text: '#065F46',
        bg: '#D1FAE5',
        border: '#6EE7B7',
        textDark: '#6EE7B7',
        bgDark: '#064E3B',
        borderDark: '#047857',
      },
      error: {
        text: '#991B1B',
        bg: '#FEE2E2',
        border: '#FCA5A5',
        textDark: '#FCA5A5',
        bgDark: '#7F1D1D',
        borderDark: '#DC2626',
      },
      warning: {
        text: '#92400E',
        bg: '#FEF3C7',
        border: '#FCD34D',
        textDark: '#FCD34D',
        bgDark: '#78350F',
        borderDark: '#F59E0B',
      },
      info: {
        text: '#02217A',
        bg: '#DBEAFE',
        border: '#3549FC',
        textDark: '#93C5FD',
        bgDark: '#1E3A8A',
        borderDark: '#3B82F6',
      },
    },
  },

  typography: {
    families: {
      display: '"Space Grotesk", sans-serif',
      heading: '"Outfit", sans-serif',
      body: '"DM Sans", sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    fonts: {
      display: '"Space Grotesk", sans-serif',
      heading: '"Outfit", sans-serif',
      body: '"DM Sans", sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
      regular: 400,
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
  },

  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    base: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },

  radius: {
    sm: '0.375rem',
    base: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },
  borderRadius: {
    sm: '0.375rem',
    base: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  animations: {
    stagger: [0, 100, 200, 300, 400, 500, 600],
    duration: {
      instant: '100ms',
      fast: '200ms',
      base: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    },
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    hover: {
      scale: 1.02,
      lift: 'translateY(-2px)',
    },
  },
}

export default designSystem
