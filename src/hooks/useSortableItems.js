import { useState, useEffect } from 'react'

/**
 * Hook para gerenciar ordenação de itens com persistência no localStorage
 * @param {Array} itemIds - Array de IDs dos itens na ordem padrão
 * @param {string} storageKey - Chave para armazenar no localStorage
 * @param {string} userId - ID do usuário para personalização
 * @returns {Object} { itemOrder, saveOrder, resetOrder }
 */
export function useSortableItems(itemIds, storageKey, userId) {
  const defaultOrder = itemIds
  
  const [itemOrder, setItemOrder] = useState(() => {
    try {
      if (!userId) return defaultOrder
      
      const key = `${storageKey}_${userId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Garantir que todos os IDs existem
        const validOrder = parsed.filter(id => itemIds.includes(id))
        const missingIds = itemIds.filter(id => !validOrder.includes(id))
        return [...validOrder, ...missingIds]
      }
      return defaultOrder
    } catch {
      return defaultOrder
    }
  })
  
  const saveOrder = (newOrder) => {
    try {
      if (!userId) return false
      
      const key = `${storageKey}_${userId}`
      localStorage.setItem(key, JSON.stringify(newOrder))
      setItemOrder(newOrder)
      return true
    } catch {
      return false
    }
  }
  
  const resetOrder = () => {
    try {
      if (!userId) return false
      
      const key = `${storageKey}_${userId}`
      localStorage.removeItem(key)
      setItemOrder(defaultOrder)
      return true
    } catch {
      return false
    }
  }
  
  return { itemOrder, saveOrder, resetOrder }
}
