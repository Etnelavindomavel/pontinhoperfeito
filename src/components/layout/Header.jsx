import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { Menu, X, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/ClerkAuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function Header() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0A0A0A]/80 border-b border-gray-200 dark:border-[#404040] shadow-colored-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo - IMPACTANTE */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            {/* Ícone com gradiente animado */}
            <div className="relative">
              <div className="absolute inset-0 gradient-energy rounded-xl blur opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-12 h-12 gradient-energy rounded-xl flex items-center justify-center shadow-colored-blue group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-display font-black text-xl">
                  PP
                </span>
              </div>
            </div>

            {/* Texto */}
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-gradient-energy">
                Ponto Perfeito
              </span>
              <span className="text-xs text-secondary font-body tracking-wider">
                GESTÃO INTELIGENTE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-heading font-semibold text-primary hover:text-[#3549FC] transition-colors relative group"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-energy group-hover:w-full transition-all duration-300"></span>
                </Link>

                <Link
                  to="/analysis/faturamento"
                  className="text-sm font-heading font-semibold text-primary hover:text-[#3549FC] transition-colors relative group"
                >
                  Faturamento
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-energy group-hover:w-full transition-all duration-300"></span>
                </Link>

                <Link
                  to="/analysis/estoque"
                  className="text-sm font-heading font-semibold text-primary hover:text-[#3549FC] transition-colors relative group"
                >
                  Estoque
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-energy group-hover:w-full transition-all duration-300"></span>
                </Link>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle - ÚNICO */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#171717] hover:scale-110 transition-transform duration-200 shadow-sm"
              aria-label="Alternar tema"
            >
              {isDark ? (
                <span className="text-2xl">☀️</span>
              ) : (
                <span className="text-2xl">🌙</span>
              )}
            </button>

            {/* User Button ou Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-energy rounded-xl shadow-colored-blue">
                  <Sparkles size={16} className="text-white" />
                  <span className="text-sm font-heading font-semibold text-white">
                    Pro
                  </span>
                </div>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-[#3549FC] ring-offset-2"
                    }
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 gradient-energy text-white font-heading font-bold rounded-xl shadow-colored-blue hover:scale-105 hover:shadow-colored-mixed transition-all duration-300"
              >
                Entrar
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-primary"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-[#404040] bg-white dark:bg-[#0A0A0A] animate-fadeInUp">
          <div className="px-4 py-6 space-y-4">
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-primary font-heading font-semibold hover:bg-gray-50 dark:hover:bg-[#171717] rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/analysis/faturamento"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-primary font-heading font-semibold hover:bg-gray-50 dark:hover:bg-[#171717] rounded-lg transition-colors"
                >
                  Faturamento
                </Link>
                <Link
                  to="/analysis/estoque"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-primary font-heading font-semibold hover:bg-gray-50 dark:hover:bg-[#171717] rounded-lg transition-colors"
                >
                  Estoque
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
