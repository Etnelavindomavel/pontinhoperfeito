import React from 'react'

export default function BrandLoader({
  size = 'md',
  text = null,
  fullScreen = false,
}) {
  const sizes = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  }

  const Spinner = () => (
    <div className="relative" role="status" aria-label={text || 'Carregando'}>
      {/* Outer ring */}
      <div className={`${sizes[size]} rounded-full border-gray-200 dark:border-[#404040]`} aria-hidden />

      {/* Animated gradient ring */}
      <div
        className={`
          ${sizes[size]}
          absolute top-0 left-0
          rounded-full
          border-transparent border-t-[#0430BA] border-r-[#3549FC]
          animate-spin
        `}
        style={{
          borderTopColor: '#0430BA',
          borderRightColor: '#3549FC',
          animationDuration: '0.8s',
        }}
        aria-hidden
      />

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className="w-2 h-2 gradient-energy rounded-full animate-pulse-subtle" />
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-sm"
        aria-live="polite"
      >
        <Spinner />
        {text && (
          <p className="mt-6 text-sm font-heading font-semibold text-primary animate-pulse-subtle">
            {text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12" aria-live="polite">
      <Spinner />
      {text && (
        <p className="mt-4 text-sm font-body text-secondary dark:text-tertiary">
          {text}
        </p>
      )}
    </div>
  )
}
