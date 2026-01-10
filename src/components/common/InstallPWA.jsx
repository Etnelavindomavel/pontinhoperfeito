import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

/**
 * Componente para promover instalação do PWA
 * Aparece quando o navegador detecta que o app pode ser instalado
 */
export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  
  useEffect(() => {
    // Verificar se já está instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    if (isInstalled) {
      return
    }
    
    // Verificar se já foi rejeitado (localStorage)
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      return
    }
    
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    
    window.addEventListener('beforeinstallprompt', handler)
    
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  
  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`User response: ${outcome}`)
      setDeferredPrompt(null)
      setShowInstall(false)
      
      if (outcome === 'accepted') {
        localStorage.removeItem('pwa-install-dismissed')
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
    }
  }
  
  const handleDismiss = () => {
    setShowInstall(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }
  
  if (!showInstall) return null
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-secondary-600 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
              <Download className="text-secondary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Instalar App</h3>
              <p className="text-xs text-gray-600">Acesso rápido e offline</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Adicione o Ponto Perfeito à tela inicial para acesso rápido
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 font-medium transition-colors"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
