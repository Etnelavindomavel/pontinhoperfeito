import React from 'react'

export default function SectionHeader({
  title,
  subtitle = null,
  action = null,
  align = 'left',
}) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${alignClass}`}>
      <div>
        <h2 className="text-3xl sm:text-4xl font-display font-black text-neutral-900 dark:text-white mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-neutral-600 dark:text-gray-400 font-body text-lg">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
