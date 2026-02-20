import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import AppSidebar from './AppSidebar'
import ToastContainer from '../common/ToastContainer'
import { useToast } from '../../hooks/useToast'

/**
 * Layout principal para páginas autenticadas (estilo notionvision)
 * Top bar fixa + Sidebar esquerda + Área de conteúdo
 */
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toasts, removeToast } = useToast()

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0A0A0A] flex">
      {/* Sidebar - fixa à esquerda */}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Área principal: TopBar + conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
