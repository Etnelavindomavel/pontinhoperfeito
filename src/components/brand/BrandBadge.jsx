import React from 'react'

export default function BrandBadge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) {
  const baseClasses = `
    inline-flex items-center justify-center
    font-sans font-semibold rounded-full
    transition-all duration-200
  `

  const variants = {
    primary: 'bg-brand-primary text-white',
    orange: 'bg-brand-orange text-white',
    yellow: 'bg-brand-yellow text-gray-800',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    error: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
    neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span
      className={`
        ${baseClasses}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
