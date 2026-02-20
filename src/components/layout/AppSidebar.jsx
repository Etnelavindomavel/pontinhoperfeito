import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Store,
  Megaphone,
  Calculator,
  Database,
  Crown,
  FileText,
  Edit2,
  X,
  ChevronRight,
  Upload,
} from 'lucide-react'
import { useAuth } from '../../contexts/ClerkAuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { getReportHistory } from '../../utils/reportHistory'
import SubscriptionBadge from '../SubscriptionBadge'

const navSections = [
  {
    title: 'Diagnósticos',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/analysis/executiva', label: 'Visão Executiva', icon: BarChart3 },
      { path: '/analysis/faturamento', label: 'Faturamento', icon: TrendingUp },
      { path: '/analysis/estoque', label: 'Estoque', icon: Package },
      { path: '/analysis/equipe', label: 'Equipe', icon: Users },
      { path: '/analysis/layout', label: 'Layout', icon: Store },
      { path: '/analysis/marketing', label: 'Marketing', icon: Megaphone },
      { path: '/simulador-acoes', label: 'Simulador de Ações', icon: Calculator },
      { path: '/historico', label: 'Gestão de Histórico', icon: Database },
    ],
  },
  {
    title: 'Conta',
    items: [
      { path: '/plans', label: 'Planos', icon: Crown },
      { path: '/dashboard', label: 'Histórico de PDFs', icon: FileText, hash: 'report-history' },
    ],
  },
]

export default function AppSidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const { subscription, loading } = useSubscription()
  const navigate = useNavigate()
  const reportCount = getReportHistory().length

  const handleRelatoriosClick = (e) => {
    if (window.location.pathname === '/dashboard') {
      e.preventDefault()
      const el = document.getElementById('report-history')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      onClose?.()
    } else {
      navigate('/dashboard')
      setTimeout(() => {
        const el = document.getElementById('report-history')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      onClose?.()
    }
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-72 min-h-screen
          bg-white dark:bg-[#171717]
          border-r border-gray-200 dark:border-[#404040]
          flex flex-col
          transition-transform duration-300 ease-out lg:transition-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header mobile - botão fechar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#404040] lg:hidden">
          <span className="font-heading font-bold text-neutral-900 dark:text-white">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0A0A0A] transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} className="text-neutral-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-neutral-500 dark:text-gray-500 mb-2 px-3">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isRelatorios = item.hash === 'report-history'

                  return (
                    <li key={item.path + (item.hash || '')}>
                      {isRelatorios ? (
                        <button
                          onClick={handleRelatoriosClick}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-semibold text-sm text-neutral-700 dark:text-gray-300 hover:bg-[#0430BA]/10 dark:hover:bg-[#3549FC]/20 transition-colors"
                        >
                          <Icon size={18} className="text-neutral-500 dark:text-gray-500 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {reportCount > 0 && (
                            <span className="px-2 py-0.5 bg-[#0430BA] text-white text-xs rounded-full font-bold">
                              {reportCount}
                            </span>
                          )}
                        </button>
                      ) : (
                        <NavLink
                          to={item.path}
                          end={item.path === '/dashboard' || item.path.startsWith('/analysis/')}
                          onClick={onClose}
                          className={({ isActive: active }) =>
                            `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-semibold text-sm transition-colors ${
                              active
                                ? 'bg-[#0430BA]/10 dark:bg-[#3549FC]/20 text-[#0430BA] dark:text-[#3549FC] border-l-2 border-[#0430BA] dark:border-[#3549FC]'
                                : 'text-neutral-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0A0A0A]'
                            }`
                          }
                        >
                          <Icon size={18} className="flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight size={16} className="text-neutral-400 dark:text-gray-500" />
                        </NavLink>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {/* Admin */}
          {user?.isAdmin && (
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-neutral-500 dark:text-gray-500 mb-2 px-3">
                Admin
              </p>
              <ul className="space-y-0.5">
                <li>
                  <NavLink
                    to="/admin/landing-editor"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-semibold text-sm transition-colors ${
                        isActive
                          ? 'bg-[#0430BA]/10 dark:bg-[#3549FC]/20 text-[#0430BA] dark:text-[#3549FC]'
                          : 'text-neutral-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0A0A0A]'
                      }`
                    }
                  >
                    <Edit2 size={18} className="flex-shrink-0" />
                    <span>Editor da Home</span>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/projecao-config"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-heading font-semibold text-sm transition-colors ${
                        isActive
                          ? 'bg-[#0430BA]/10 dark:bg-[#3549FC]/20 text-[#0430BA] dark:text-[#3549FC]'
                          : 'text-neutral-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0A0A0A]'
                      }`
                    }
                  >
                    <BarChart3 size={18} className="flex-shrink-0" />
                    <span>Projeção (dias úteis)</span>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* Card Seu Plano */}
        <div className="p-4 border-t border-gray-200 dark:border-[#404040]">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#404040]">
            <p className="text-xs font-heading font-bold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-3">
              Seu Plano
            </p>
            {loading ? (
              <p className="text-sm text-neutral-500 dark:text-gray-500">Carregando...</p>
            ) : subscription?.plan ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <SubscriptionBadge plan={subscription.plan} size="sm" />
                </div>
                <p className="text-xs text-neutral-600 dark:text-gray-400 font-body mb-3">
                  {subscription.plan.uploads_per_month === -1
                    ? 'Uploads ilimitados'
                    : `${subscription.uploadsThisMonth || 0} / ${subscription.plan.uploads_per_month} uploads este mês`}
                </p>
                <NavLink
                  to="/plans"
                  onClick={onClose}
                  className="block w-full text-center py-2 rounded-lg bg-gradient-to-r from-[#0430BA] to-[#3549FC] text-white text-sm font-heading font-bold hover:opacity-90 transition-opacity"
                >
                  Fazer upgrade
                </NavLink>
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-600 dark:text-gray-400 mb-3">Plano Free</p>
                <NavLink
                  to="/plans"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-gradient-to-r from-[#0430BA] to-[#3549FC] text-white text-sm font-heading font-bold hover:opacity-90 transition-opacity"
                >
                  <Upload size={14} />
                  Fazer upgrade
                </NavLink>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
