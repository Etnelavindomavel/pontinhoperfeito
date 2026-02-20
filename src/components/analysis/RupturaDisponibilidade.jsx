import React from 'react'
import BrandCard from '../brand/BrandCard'
import { AlertTriangle } from 'lucide-react'

export default function RupturaDisponibilidade() {
  // PLACEHOLDER - dados viriam de integração com estoque
  const temDados = false

  if (!temDados) {
    return (
      <BrandCard variant="elevated" padding="lg">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-[#171717] rounded-full flex items-center justify-center">
            <AlertTriangle className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-heading font-bold text-primary mb-2">
            Ruptura e Disponibilidade
          </h3>
          <p className="text-sm text-secondary dark:text-tertiary font-body max-w-md mx-auto">
            Esta análise requer integração com sistema de estoque.
            Em desenvolvimento.
          </p>
        </div>
      </BrandCard>
    )
  }

  return null
}
