import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Upload,
  FileText,
  Crown,
  LogOut,
} from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import { useAuth } from '../../contexts/ClerkAuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import ThemeToggle from '../common/ThemeToggle'
import Logo from '../common/Logo'
import BrandButton from '../brand/BrandButton'
import SubscriptionBadge from '../SubscriptionBadge'
import { getReportHistory } from '../../utils/reportHistory'
import { clearAppStorage } from '../../utils/secureStorage'
import { useToast } from '../../hooks/useToast'

export default function TopBar({ onMenuClick }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { signOut } = useClerk()
  const { subscription, canUpload } = useSubscription()
  const { toasts, showToast, removeToast } = useToast()
  const reportCount = getReportHistory().length

  const handleUpload = async () => {
    const canDoUpload = await canUpload()
    if (!canDoUpload) {
      navigate('/plans')
      return
    }
    navigate('/dashboard')
    setTimeout(() => {
      const el = document.getElementById('upload-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleLogout = async () => {
    try {
      clearAppStorage()
      signOut(() => {
        navigate('/', { replace: true })
        showToast('Logout realizado com sucesso', 'success')
      })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      showToast('Erro ao fazer logout', 'error')
    }
  }

  const handleRelatoriosClick = () => {
    navigate('/dashboard')
    setTimeout(() => {
      document.getElementById('report-history')?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-[#171717]/95 backdrop-blur-xl border-b border-gray-200 dark:border-[#404040]">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Esquerda: menu mobile + logo */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0A0A0A] transition-colors flex-shrink-0"
              aria-label="Abrir menu"
            >
              <Menu size={24} className="text-neutral-700 dark:text-gray-300" />
            </button>
            <Link to="/dashboard" className="flex-shrink-0">
              <Logo size="sm" />
            </Link>
          </div>

          {/* Centro: ação principal - Upload (desktop) ou botão ícone (mobile) */}
          <div className="flex-1 max-w-xs flex justify-center">
            <BrandButton
              variant="primary"
              size="sm"
              icon={<Upload size={18} />}
              onClick={handleUpload}
              className="hidden sm:flex w-full sm:max-w-[180px]"
            >
              Fazer Upload
            </BrandButton>
            <button
              onClick={handleUpload}
              className="sm:hidden p-2.5 rounded-xl bg-gradient-to-r from-[#0430BA] to-[#3549FC] text-white"
              aria-label="Fazer upload"
            >
              <Upload size={20} />
            </button>
          </div>

          {/* Direita: ações */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <ThemeToggle />

            <button
              onClick={handleRelatoriosClick}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0A0A0A] transition-colors font-heading font-semibold text-sm"
            >
              <FileText size={18} />
              <span>Histórico de PDFs</span>
              {reportCount > 0 && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-[#0430BA] to-[#3549FC] text-white text-xs rounded-full font-bold">
                  {reportCount}
                </span>
              )}
            </button>

            <Link
              to="/plans"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-[#404040] text-neutral-700 dark:text-gray-300 hover:border-[#3549FC] hover:text-[#3549FC] transition-all font-heading font-semibold text-sm"
            >
              <Crown size={18} />
              <span>Planos</span>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-[#404040]">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#0430BA] to-[#3549FC] flex items-center justify-center text-white font-heading font-bold text-sm">
                  {getUserInitials()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-heading font-semibold text-neutral-900 dark:text-white">
                    {user?.name || 'Usuário'}
                  </p>
                  {user?.isAdmin && (
                    <span className="text-xs font-bold text-[#FAD036]">ADMIN</span>
                  )}
                  {subscription?.plan && (
                    <SubscriptionBadge plan={subscription.plan} size="sm" />
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
