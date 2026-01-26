import { useState } from 'react'
import { useAuth } from '@/contexts/ClerkAuthContext'
import { useToast } from './useToast'

export function useRateLimit(rateLimiter, errorMessage) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [isLimited, setIsLimited] = useState(false)

  const checkRateLimit = () => {
    const userId = user?.id || 'anonymous'
    
    if (!rateLimiter.isAllowed(userId)) {
      const timeRemaining = rateLimiter.getTimeUntilReset(userId)
      const remaining = rateLimiter.getRemainingRequests(userId)
      
      showToast(
        `${errorMessage || 'Muitas requisições'}. Aguarde ${timeRemaining}s ou você tem ${remaining} requisições restantes.`,
        'warning',
        5000
      )
      
      setIsLimited(true)
      setTimeout(() => setIsLimited(false), timeRemaining * 1000)
      
      return false
    }
    
    return true
  }

  return { checkRateLimit, isLimited }
}
