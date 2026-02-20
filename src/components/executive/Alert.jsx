import React from 'react'
import brandSystem from '../../styles/brandSystem'

/**
 * ALERT - MENSAGENS CONTEXTUAIS
 */
export default function Alert({
  type = 'info',
  title,
  message,
  className = '',
}) {
  const types = {
    success: {
      border: brandSystem.colors.semantic.success,
      bg: 'rgba(5, 150, 105, 0.05)',
      titleColor: brandSystem.colors.semantic.success,
    },
    warning: {
      border: brandSystem.colors.semantic.warning,
      bg: 'rgba(217, 119, 6, 0.05)',
      titleColor: brandSystem.colors.semantic.warning,
    },
    error: {
      border: brandSystem.colors.semantic.error,
      bg: 'rgba(220, 38, 38, 0.05)',
      titleColor: brandSystem.colors.semantic.error,
    },
    info: {
      border: brandSystem.colors.primary.main,
      bg: 'rgba(4, 48, 186, 0.05)',
      titleColor: brandSystem.colors.primary.main,
    },
  }

  const config = types[type] || types.info

  return (
    <div
      className={`rounded-r-lg pl-4 pr-4 py-4 ${className}`}
      style={{
        borderLeft: `4px solid ${config.border}`,
        backgroundColor: config.bg,
      }}
    >
      {title && (
        <p
          className="font-semibold mb-1"
          style={{
            ...brandSystem.typography.body,
            color: config.titleColor,
          }}
        >
          {title}
        </p>
      )}
      <p
        style={{
          ...brandSystem.typography.small,
          color: brandSystem.colors.neutral.dark,
        }}
      >
        {message}
      </p>
    </div>
  )
}
