import React from 'react'

export default function BrandCard({
  children,
  variant = 'default',
  padding = 'lg',
  hover = true,
  className = '',
  onClick = null,
}) {
  const variants = {
    default: `
      bg-white dark:bg-[#171717]
      border border-gray-200 dark:border-[#404040]
      shadow-sm
    `,
    elevated: `
      bg-white dark:bg-[#171717]
      border border-gray-200 dark:border-[#404040]
      shadow-colored-blue
    `,
    gradient: `
      bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/30
      dark:from-[#171717] dark:via-blue-950/10 dark:to-yellow-950/10
      border border-[#0430BA]/20 dark:border-[#3549FC]/20
      shadow-sm
    `,
    flat: `
      bg-gray-50 dark:bg-[#0A0A0A]
      border border-gray-200 dark:border-[#404040]
    `,
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const hoverClass = hover ? `
    hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1
    cursor-pointer
  ` : ''

  const clickableClass = onClick ? 'cursor-pointer' : ''

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`
        ${variants[variant] || variants.default}
        ${paddings[padding] || paddings.lg}
        ${hoverClass}
        ${clickableClass}
        rounded-2xl
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  )
}
