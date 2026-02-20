import React from 'react'

/**
 * KPI com design impactante que "levita"
 * Sombras coloridas, animações sutis, hover profundo
 */
export default function ImpactKPI({
  title,
  value,
  icon: Icon,
  trend = null,
  color = 'blue',
  delay = 0,
  subtitle = null,
}) {
  const themes = {
    blue: {
      bg: 'from-blue-50 via-white to-blue-50 dark:from-blue-950/20 dark:via-[#171717] dark:to-blue-950/20',
      border: 'border-[#0430BA]/20 dark:border-[#3549FC]/30',
      text: 'text-[#0430BA] dark:text-[#3549FC]',
      valueText: 'text-[#0430BA] dark:text-white',
      iconBg: 'from-[#0430BA] to-[#3549FC]',
      glow: 'bg-[#3549FC]/10 dark:bg-[#3549FC]/5',
      shadow: 'shadow-colored-blue',
    },
    mustard: {
      bg: 'from-yellow-50 via-white to-yellow-50 dark:from-yellow-950/20 dark:via-[#171717] dark:to-yellow-950/20',
      border: 'border-[#FAD036]/30 dark:border-[#FAD036]/40',
      text: 'text-yellow-900 dark:text-[#FAD036]',
      valueText: 'text-yellow-900 dark:text-white',
      iconBg: 'from-yellow-600 to-[#FAD036]',
      glow: 'bg-[#FAD036]/10 dark:bg-[#FAD036]/5',
      shadow: 'shadow-colored-mustard',
    },
    cyan: {
      bg: 'from-blue-100 via-white to-blue-100 dark:from-blue-900/20 dark:via-[#171717] dark:to-blue-900/20',
      border: 'border-[#3549FC]/30 dark:border-[#3549FC]/40',
      text: 'text-blue-800 dark:text-blue-300',
      valueText: 'text-blue-900 dark:text-white',
      iconBg: 'from-blue-600 to-[#3549FC]',
      glow: 'bg-[#3549FC]/10 dark:bg-[#3549FC]/5',
      shadow: 'shadow-colored-blue',
    },
    mixed: {
      bg: 'from-blue-50 via-yellow-50 to-blue-50 dark:from-[#171717] dark:via-[#171717] dark:to-[#171717]',
      border: 'border-[#0430BA]/20 dark:border-[#FAD036]/30',
      text: 'text-[#0430BA] dark:text-[#FAD036]',
      valueText: 'text-[#0430BA] dark:text-white',
      iconBg: 'from-[#0430BA] via-[#3549FC] to-[#FAD036]',
      glow: 'bg-gradient-to-br from-[#3549FC]/10 to-[#FAD036]/10 dark:from-[#3549FC]/5 dark:to-[#FAD036]/5',
      shadow: 'shadow-colored-mixed',
    },
  }

  const theme = themes[color] || themes.blue

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${theme.bg}
        rounded-2xl p-6
        border-2 ${theme.border}
        ${theme.shadow}
        transition-all duration-500 ease-out
        hover:scale-[1.03] hover:-translate-y-2
        group cursor-default
        animate-fadeInUp opacity-0
      `}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Glow effect */}
      <div className={`
        absolute -top-24 -right-24 w-48 h-48
        ${theme.glow}
        rounded-full blur-3xl
        group-hover:scale-150 transition-transform duration-700
      `} />

      {/* Geometric decoration */}
      <div className={`
        absolute bottom-0 left-0 w-32 h-32
        ${theme.glow}
        rounded-tr-full blur-2xl opacity-50
      `} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className={`
              text-xs font-heading font-bold uppercase tracking-widest
              ${theme.text}
              mb-2
            `}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-secondary dark:text-tertiary font-body">
                {subtitle}
              </p>
            )}
          </div>

          {/* Icon */}
          <div className={`
            p-3 rounded-xl
            bg-gradient-to-br ${theme.iconBg}
            ${theme.shadow}
            group-hover:scale-110 group-hover:rotate-6
            transition-all duration-300
          `}>
            <Icon className="text-white" size={24} />
          </div>
        </div>

        {/* Value */}
        <div className={`
          text-3xl sm:text-4xl font-display font-black tracking-tight
          ${theme.valueText}
          mb-3
          group-hover:scale-105 transition-transform duration-300 origin-left
        `}>
          {value}
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-2">
            {trend}
          </div>
        )}

        {/* Animated line */}
        <div className={`
          mt-4 h-1 rounded-full
          bg-gradient-to-r ${theme.iconBg}
          w-0 group-hover:w-full
          transition-all duration-500 ease-out
        `} />
      </div>

      {/* Shine effect on hover */}
      <div className="
        absolute inset-0
        bg-gradient-to-tr from-transparent via-white/10 to-transparent
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        pointer-events-none
      " />
    </div>
  )
}
