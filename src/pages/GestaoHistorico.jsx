import React, { useState, useEffect } from 'react'
import {
  Database,
  Lock,
  Trash2,
  Download,
  Upload,
  HardDrive,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import BrandButton from '../components/brand/BrandButton'
import BrandCard from '../components/brand/BrandCard'
import SectionHeader from '../components/brand/SectionHeader'
import DashboardNavigation from '../components/layout/DashboardNavigation'
import { useData } from '../contexts/DataContext'
import {
  fecharMes,
  listarMesesFechados,
  deletarMesFechado,
  limparMesesAntigos,
  obterEstatisticas,
  exportarBackup,
  importarBackup,
  mesEstaFechado,
} from '../utils/historicoDatabase'
import { calcularMetricasConsolidadas } from '../utils/financialCalculations'
import { calcularBaseClientes } from '../utils/clientCalculations'
import { extrairData } from '../utils/dataHelpers'

export default function GestaoHistorico() {
  const { rawData, mappedColumns } = useData()
  const faturamentoData = Array.isArray(rawData) ? rawData : []

  const [mesesFechados, setMesesFechados] = useState([])
  const [estatisticas, setEstatisticas] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    const meses = await listarMesesFechados()
    setMesesFechados(meses)

    const stats = await obterEstatisticas()
    setEstatisticas(stats)
  }

  const handleFecharMesAtual = async () => {
    setProcessando(true)
    setMensagem(null)

    try {
      const hoje = new Date()
      const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const mesAno = `${mesPassado.getFullYear()}-${String(mesPassado.getMonth() + 1).padStart(2, '0')}`

      const jaFechado = await mesEstaFechado(mesAno)
      if (jaFechado) {
        setMensagem({ tipo: 'warning', texto: `Mês ${mesAno} já está fechado!` })
        setProcessando(false)
        return
      }

      const inicioMes = new Date(mesPassado.getFullYear(), mesPassado.getMonth(), 1)
      const fimMes = new Date(mesPassado.getFullYear(), mesPassado.getMonth() + 1, 0, 23, 59, 59)

      const dadosMes = faturamentoData.filter((row) => {
        const data = extrairData(row, mappedColumns)
        if (!data) return false
        return data >= inicioMes && data <= fimMes
      })

      if (dadosMes.length === 0) {
        setMensagem({ tipo: 'warning', texto: 'Nenhum dado encontrado para o mês passado!' })
        setProcessando(false)
        return
      }

      const metricas = calcularMetricasConsolidadas(dadosMes, mappedColumns)
      const baseClientes = calcularBaseClientes(dadosMes, mappedColumns, fimMes, false)

      const resumo = {
        totalVendas: dadosMes.length,
        ROB: metricas.ROB,
        LOB: metricas.LOB,
        MB: metricas.MB,
        MC: metricas.MC,
        clientesAtivos: baseClientes.ativos,
      }

      const sucesso = await fecharMes(mesAno, dadosMes, resumo)

      if (sucesso) {
        setMensagem({
          tipo: 'success',
          texto: `Mês ${mesAno} fechado com sucesso! ${dadosMes.length} vendas armazenadas.`,
        })
        await carregar()
      } else {
        setMensagem({ tipo: 'error', texto: 'Erro ao fechar mês!' })
      }
    } catch (err) {
      console.error(err)
      setMensagem({ tipo: 'error', texto: err.message || 'Erro ao fechar mês' })
    }

    setProcessando(false)
  }

  const handleDeletar = async (mesAno) => {
    if (!confirm(`Confirma exclusão do mês ${mesAno}?`)) return

    setProcessando(true)
    const sucesso = await deletarMesFechado(mesAno)

    if (sucesso) {
      setMensagem({ tipo: 'success', texto: `Mês ${mesAno} deletado!` })
      await carregar()
    }

    setProcessando(false)
  }

  const handleLimpar = async () => {
    if (!confirm('Confirma limpeza automática? (manter últimos 24 meses)')) return

    setProcessando(true)
    const resultado = await limparMesesAntigos(24)

    setMensagem({
      tipo: 'success',
      texto: `Limpeza concluída! ${resultado.removidos} meses removidos, ${resultado.mantidos} mantidos.`,
    })

    await carregar()
    setProcessando(false)
  }

  const handleExportar = async () => {
    setProcessando(true)
    await exportarBackup()
    setMensagem({ tipo: 'success', texto: 'Backup exportado com sucesso!' })
    setProcessando(false)
  }

  const handleImportar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setProcessando(true)

    importarBackup(file)
      .then(() => {
        setMensagem({ tipo: 'success', texto: 'Backup importado com sucesso!' })
        carregar()
      })
      .catch((err) => {
        setMensagem({ tipo: 'error', texto: 'Erro ao importar: ' + (err?.message || err) })
      })
      .finally(() => setProcessando(false))

    event.target.value = ''
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0A0A0A] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardNavigation />
        <SectionHeader
          title="Gestão de Histórico"
          subtitle="Feche meses, gerencie dados históricos e faça backups"
        />

        {mensagem && (
          <div
            className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
              mensagem.tipo === 'success'
                ? 'bg-green-50 border-green-500 dark:bg-green-950/20 dark:border-green-700'
                : mensagem.tipo === 'warning'
                  ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-950/20 dark:border-yellow-700'
                  : 'bg-red-50 border-red-500 dark:bg-red-950/20 dark:border-red-700'
            }`}
          >
            {mensagem.tipo === 'success' ? (
              <CheckCircle className="text-green-600 dark:text-green-400 shrink-0" size={20} />
            ) : (
              <AlertCircle
                className={
                  mensagem.tipo === 'warning'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }
                size={20}
                aria-hidden
              />
            )}
            <p className="text-sm font-body text-primary">{mensagem.texto}</p>
          </div>
        )}

        {estatisticas && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <BrandCard variant="gradient" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <Database className="text-[#3549FC]" size={24} />
                <p className="text-xs text-secondary dark:text-tertiary font-body">Meses Fechados</p>
              </div>
              <p className="text-3xl font-display font-black text-primary">
                {estatisticas.totalMeses}
              </p>
            </BrandCard>

            <BrandCard variant="gradient" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className="text-[#FAD036]" size={24} />
                <p className="text-xs text-secondary dark:text-tertiary font-body">
                  Vendas Armazenadas
                </p>
              </div>
              <p className="text-3xl font-display font-black text-primary">
                {estatisticas.totalVendas.toLocaleString('pt-BR')}
              </p>
            </BrandCard>

            <BrandCard variant="gradient" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className="text-[#0430BA]" size={24} />
                <p className="text-xs text-secondary dark:text-tertiary font-body">Tamanho Total</p>
              </div>
              <p className="text-3xl font-display font-black text-primary">
                {estatisticas.tamanhoMB} MB
              </p>
            </BrandCard>

            <BrandCard variant="gradient" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-[#3549FC]" size={24} />
                <p className="text-xs text-secondary dark:text-tertiary font-body">Dados Atuais</p>
              </div>
              <p className="text-3xl font-display font-black text-primary">
                {faturamentoData.length.toLocaleString('pt-BR')}
              </p>
            </BrandCard>
          </div>
        )}

        <BrandCard variant="elevated" padding="lg" className="mb-8">
          <h3 className="text-xl font-heading font-bold text-primary mb-6">Ações Rápidas</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <BrandButton
              variant="primary"
              icon={<Lock size={18} />}
              onClick={handleFecharMesAtual}
              disabled={processando}
              className="w-full"
            >
              Fechar Mês Anterior
            </BrandButton>

            <BrandButton
              variant="outline"
              icon={<Trash2 size={18} />}
              onClick={handleLimpar}
              disabled={processando}
              className="w-full"
            >
              Limpeza Automática (24m)
            </BrandButton>

            <BrandButton
              variant="outline"
              icon={<Download size={18} />}
              onClick={handleExportar}
              disabled={processando}
              className="w-full"
            >
              Exportar Backup
            </BrandButton>

            <label className="w-full cursor-pointer block">
              <input
                type="file"
                accept=".json"
                onChange={handleImportar}
                className="hidden"
                disabled={processando}
              />
              <span
                className={`
                  group inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-base
                  font-heading font-bold rounded-xl transition-all duration-300
                  border-2 border-[#0430BA] dark:border-[#3549FC]
                  text-[#0430BA] dark:text-[#3549FC]
                  hover:bg-[#0430BA] hover:text-white dark:hover:bg-[#3549FC]
                  ${processando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Upload size={18} />
                Importar Backup
              </span>
            </label>
          </div>
        </BrandCard>

        <BrandCard variant="elevated" padding="lg">
          <h3 className="text-xl font-heading font-bold text-primary mb-6">
            Meses Fechados ({mesesFechados.length})
          </h3>

          <div className="space-y-4">
            {mesesFechados.map((mes) => (
              <div
                key={mes.mesAno}
                className="p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-xl border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="text-[#3549FC]" size={20} />
                      <h4 className="text-lg font-heading font-bold text-primary">{mes.mesAno}</h4>
                    </div>

                    <div className="grid md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-secondary dark:text-tertiary font-body">Vendas</p>
                        <p className="font-display font-bold text-primary">
                          {mes.resumo?.totalVendas ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary dark:text-tertiary font-body">ROB</p>
                        <p className="font-display font-bold text-primary">
                          R${' '}
                          {(mes.resumo?.ROB ?? 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary dark:text-tertiary font-body">LOB</p>
                        <p className="font-display font-bold text-primary">
                          R${' '}
                          {(mes.resumo?.LOB ?? 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary dark:text-tertiary font-body">MB%</p>
                        <p className="font-display font-bold text-primary">
                          {(mes.resumo?.MB ?? 0).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary dark:text-tertiary font-body">
                          Tamanho
                        </p>
                        <p className="font-display font-bold text-primary">
                          {((mes.tamanhoOriginal ?? 0) / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  </div>

                  <BrandButton
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDeletar(mes.mesAno)}
                    disabled={processando}
                  >
                    Deletar
                  </BrandButton>
                </div>
              </div>
            ))}

            {mesesFechados.length === 0 && (
              <div className="text-center py-12">
                <Database size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-secondary dark:text-tertiary font-body">
                  Nenhum mês fechado ainda
                </p>
              </div>
            )}
          </div>
        </BrandCard>
      </div>
    </div>
  )
}
