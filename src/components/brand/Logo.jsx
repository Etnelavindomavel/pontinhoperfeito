import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

const ASSETS = {
  full: 'Logo Ponto Perfeito - Principal Azul.svg',
  fullDark: 'Logo Ponto Perfeito - Principal Branco.svg',
  icon: 'Logo Ponto Perfeito - Símbolo 2 Azul.svg',
  symbol: 'Logo Ponto Perfeito - Símbolo 2 Azul.svg',
  iconWhite: 'Logo Ponto Perfeito - Símbolo 2 branco.svg',
  iconDark: 'Logo Ponto Perfeito - Símbolo 2 preto.svg',
  wordmark: 'Logo Ponto Perfeito - Principal Azul.svg',
}

function assetPath(name) {
  return `/assets/brand/${encodeURIComponent(name)}`
}

/**
 * LOGO PONTO PERFEITO
 * Componente reutilizável para uso em toda aplicação.
 * Usa SVGs oficiais do kit da marca.
 */
export default function Logo({
  variant = 'full',
  size = 'md',
  customHeight,
  className = '',
  alt = 'Ponto Perfeito - Desenvolvendo o varejo. Ponto a ponto.',
  invert = false,
  /** Força logo branco em fundos escuros (ex: painel login) */
  darkMode = false,
}) {
  const [imgError, setImgError] = useState(false)
  const { isDark } = useTheme()

  const useDarkLogo =
    (variant === 'full' || variant === 'icon' || variant === 'symbol') &&
    !invert &&
    (darkMode || isDark)

  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
    custom: '',
  }

  const currentSize = size === 'custom' ? '' : (sizes[size] || sizes.md)

  const asset = React.useMemo(() => {
    if (variant === 'icon' || variant === 'symbol') {
      return useDarkLogo ? ASSETS.iconWhite : ASSETS.icon
    }
    if (variant === 'wordmark') return ASSETS.full
    return useDarkLogo ? ASSETS.fullDark : ASSETS.full
  }, [variant, useDarkLogo])

  if (imgError || !asset) {
    return (
      <div
        className={`
          ${currentSize} aspect-square min-w-[1.5rem]
          bg-gradient-to-br from-[#0430BA] to-[#3549FC]
          rounded-xl flex items-center justify-center
          shadow-md
          ${className}
        `}
        aria-label="Ponto Perfeito"
      >
        <span className="text-white font-display font-extrabold text-sm">PP</span>
      </div>
    )
  }

  return (
    <img
      src={assetPath(asset)}
      alt={alt}
      className={`${currentSize} w-auto object-contain ${invert ? 'brightness-0 invert' : ''} ${className}`}
      style={customHeight ? { height: customHeight } : undefined}
      onError={() => setImgError(true)}
    />
  )
}

/**
 * TAGLINE - Slogan da marca
 */
export function Tagline({ className = '' }) {
  return (
    <p className={`text-sm font-body text-neutral-medium dark:text-neutral-dark ${className}`}>
      Desenvolvendo o varejo. Ponto a ponto.
    </p>
  )
}
