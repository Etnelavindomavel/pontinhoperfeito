import React from 'react'
import { useNavigate } from 'react-router-dom'
import Logo, { Tagline } from '../components/brand/Logo'
import brandSystem from '../styles/brandSystem'

/**
 * LANDING PAGE - PONTO PERFEITO
 * Página inicial profissional com identidade da marca
 */
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0A0A0A]">
      {/* Header */}
      <header
        className="border-b-2 py-4 px-6 dark:border-[#404040]"
        style={{ borderColor: brandSystem.colors.neutral.light }}
      >
        <div
          className="mx-auto flex justify-between items-center"
          style={{ maxWidth: brandSystem.layout.maxWidth }}
        >
          <Logo variant="full" size="md" />
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: brandSystem.colors.primary.main,
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandSystem.colors.primary.light
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandSystem.colors.primary.main
            }}
          >
            Acessar Sistema
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="mx-auto text-center max-w-4xl"
          style={{ maxWidth: brandSystem.layout.maxWidth }}
        >
          <div className="mb-8">
            <Logo variant="full" size="xl" className="mx-auto" />
          </div>
          <div className="mb-12">
            <Tagline className="text-lg text-neutral-medium dark:text-neutral-dark" />
          </div>
          <h1
            className="mb-6 tracking-tight dark:text-white"
            style={{
              fontSize: '3.5rem',
              lineHeight: '1.1',
              fontWeight: '900',
              color: brandSystem.colors.neutral.darker,
              letterSpacing: '-0.02em',
            }}
          >
            Business Intelligence para o Varejo
          </h1>
          <p
            className="mb-12 max-w-2xl mx-auto text-neutral-medium dark:text-neutral-dark"
            style={{
              fontSize: '1.25rem',
              lineHeight: '1.6',
              color: brandSystem.colors.neutral.medium,
            }}
          >
            Análise de faturamento, gestão de metas, projeções estratégicas e
            insights acionáveis para impulsionar suas vendas.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg"
              style={{
                backgroundColor: brandSystem.colors.primary.main,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandSystem.colors.primary.light
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandSystem.colors.primary.main
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Acessar Plataforma
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all dark:border-[#404040] dark:text-white"
              style={{
                borderColor: brandSystem.colors.neutral.light,
                color: brandSystem.colors.neutral.darker,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandSystem.colors.primary.main
                e.currentTarget.style.color = brandSystem.colors.primary.main
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = brandSystem.colors.neutral.light
                e.currentTarget.style.color = brandSystem.colors.neutral.darker
              }}
            >
              Saiba Mais
            </button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section
        className="py-16 px-6 dark:bg-[#0D0D0D]"
        style={{ backgroundColor: brandSystem.colors.neutral.offWhite }}
      >
        <div className="mx-auto" style={{ maxWidth: brandSystem.layout.maxWidth }}>
          <h2
            className="text-center mb-12 dark:text-white"
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: brandSystem.colors.neutral.darker,
              textTransform: 'uppercase',
            }}
          >
            Funcionalidades Principais
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div
              className="bg-white dark:bg-[#171717] p-8 rounded-xl"
              style={{
                border: `2px solid ${brandSystem.colors.neutral.light}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: brandSystem.colors.primary.main }}
              >
                1
              </div>
              <h3
                className="mb-3 dark:text-white"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: brandSystem.colors.neutral.darker,
                }}
              >
                Visão Executiva
              </h3>
              <p
                className="dark:text-neutral-dark"
                style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  color: brandSystem.colors.neutral.medium,
                }}
              >
                Acompanhe faturamento, margens, projeções e atingimento de metas em
                tempo real com painéis profissionais.
              </p>
            </div>
            <div
              className="bg-white dark:bg-[#171717] p-8 rounded-xl"
              style={{
                border: `2px solid ${brandSystem.colors.neutral.light}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: brandSystem.colors.accent.main }}
              >
                2
              </div>
              <h3
                className="mb-3 dark:text-white"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: brandSystem.colors.neutral.darker,
                }}
              >
                Simuladores
              </h3>
              <p
                className="dark:text-neutral-dark"
                style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  color: brandSystem.colors.neutral.medium,
                }}
              >
                Simule cenários de preços e ações comerciais para tomar decisões
                estratégicas baseadas em dados.
              </p>
            </div>
            <div
              className="bg-white dark:bg-[#171717] p-8 rounded-xl"
              style={{
                border: `2px solid ${brandSystem.colors.neutral.light}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: brandSystem.colors.secondary.main }}
              >
                3
              </div>
              <h3
                className="mb-3 dark:text-white"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: brandSystem.colors.neutral.darker,
                }}
              >
                Gestão de Metas
              </h3>
              <p
                className="dark:text-neutral-dark"
                style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  color: brandSystem.colors.neutral.medium,
                }}
              >
                Defina metas mensais, acompanhe o atingimento e receba alertas
                contextuais automáticos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t-2 py-8 px-6 dark:border-[#404040]"
        style={{ borderColor: brandSystem.colors.neutral.light }}
      >
        <div
          className="mx-auto flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ maxWidth: brandSystem.layout.maxWidth }}
        >
          <Logo variant="full" size="sm" />
          <Tagline className="text-center md:text-left" />
          <p
            className="dark:text-neutral-dark"
            style={{
              fontSize: '0.875rem',
              color: brandSystem.colors.neutral.medium,
            }}
          >
            © 2025 Ponto Perfeito. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
