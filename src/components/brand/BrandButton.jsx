import React from 'react'

export default function BrandButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const variants = {
    primary: `
      gradient-energy text-white
      shadow-colored-blue hover:shadow-colored-mixed
      hover:scale-105 active:scale-95
    `,
    secondary: `
      gradient-insight text-white
      shadow-colored-mustard hover:shadow-colored-mixed
      hover:scale-105 active:scale-95
    `,
    outline: `
      border-2 border-[#0430BA] dark:border-[#3549FC]
      text-[#0430BA] dark:text-[#3549FC]
      hover:bg-[#0430BA] hover:text-white
      dark:hover:bg-[#3549FC]
      hover:scale-105 active:scale-95
    `,
    ghost: `
      text-[#0430BA] dark:text-[#3549FC]
      hover:bg-blue-50 dark:hover:bg-blue-950/20
      active:scale-95
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700 hover:scale-105
      active:scale-95 shadow-sm
    `,
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        group inline-flex items-center justify-center gap-2
        font-heading font-bold rounded-xl
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${widthClass}
        ${className}
      `}
      {...rest}
    >
      {icon && iconPosition === 'left' && (
        <span className="transition-transform group-hover:scale-110 inline-flex">
          {icon}
        </span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="transition-transform group-hover:translate-x-1 inline-flex">
          {icon}
        </span>
      )}
    </button>
  )
}
