import { useState, useEffect } from 'react'
import { Save, Calendar, BarChart3 } from 'lucide-react'
import BrandCard from '../../components/brand/BrandCard'
import BrandButton from '../../components/brand/BrandButton'
import {
  buscarConfigProjecao,
  salvarConfigProjecao,
  listarConfigsProjecao,
} from '../../utils/projecaoConfigStorage'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function ProjecaoConfig() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [diasUteis, setDiasUteis] = useState('')
  const [pesoQuinzena1, setPesoQuinzena1] = useState('0.5')
  const [pesoQuinzena2, setPesoQuinzena2] = useState('0.5')
  const [saved, setSaved] = useState(false)
  const [configs, setConfigs] = useState({})

  useEffect(() => {
    loadConfig()
    setConfigs(listarConfigsProjecao())
  }, [ano, mes])

  function loadConfig() {
    const cfg = buscarConfigProjecao(ano, mes)
    if (cfg) {
      setDiasUteis(String(cfg.diasUteis ?? ''))
      setPesoQuinzena1(String(cfg.pesoQuinzena1 ?? 0.5))
      setPesoQuinzena2(String(cfg.pesoQuinzena2 ?? 0.5))
    } else {
      setDiasUteis('')
      setPesoQuinzena1('0.5')
      setPesoQuinzena2('0.5')
    }
  }

  function handleSave() {
    const d = parseInt(diasUteis, 10)
    const p1 = parseFloat(pesoQuinzena1) || 0
    const p2 = parseFloat(pesoQuinzena2) || 0

    if (d <= 0 || d > 31) {
      alert('Dias úteis deve ser entre 1 e 31.')
      return
    }
    if (Math.abs(p1 + p2 - 1) > 0.01) {
      alert('A soma dos pesos das quinzenas deve ser 1,0.')
      return
    }

    const ok = salvarConfigProjecao(ano, mes, {
      diasUteis: d,
      pesoQuinzena1: p1,
      pesoQuinzena2: p2,
    })
    if (ok) {
      setSaved(true)
      setConfigs(listarConfigsProjecao())
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-black text-neutral-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#0430BA]/10 dark:bg-[#3549FC]/20">
            <BarChart3 size={24} className="text-[#0430BA] dark:text-[#3549FC]" />
          </div>
          Configuração de Projeção
        </h1>
        <p className="text-sm text-neutral-600 dark:text-gray-400 mt-2">
          Dias úteis do mês e pesos das quinzenas para melhorar a projeção de fechamento. A soma dos pesos deve ser 1,0.
        </p>
      </div>

      <BrandCard variant="elevated" padding="lg">
        <h2 className="text-lg font-heading font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Mês a configurar
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-1">
              Ano
            </label>
            <select
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-[#404040] bg-white dark:bg-[#171717] text-neutral-900 dark:text-white font-body"
            >
              {[hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-1">
              Mês
            </label>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-[#404040] bg-white dark:bg-[#171717] text-neutral-900 dark:text-white font-body"
            >
              {MESES.map((nome, idx) => (
                <option key={idx} value={idx}>{nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-1">
              Dias úteis do mês
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={diasUteis}
              onChange={(e) => setDiasUteis(e.target.value)}
              placeholder="Ex: 22"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-[#404040] bg-white dark:bg-[#171717] text-neutral-900 dark:text-white font-body"
            />
            <p className="text-xs text-neutral-500 dark:text-gray-500 mt-1">
              Override do cálculo automático (sáb/dom excluídos). Deixe vazio para usar o padrão.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-1">
                Peso Quinzena 1 (dias 1-15)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={pesoQuinzena1}
                onChange={(e) => setPesoQuinzena1(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-[#404040] bg-white dark:bg-[#171717] text-neutral-900 dark:text-white font-body"
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-1">
                Peso Quinzena 2 (dias 16-fim)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={pesoQuinzena2}
                onChange={(e) => setPesoQuinzena2(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-[#404040] bg-white dark:bg-[#171717] text-neutral-900 dark:text-white font-body"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-gray-500">
            Pesos ajustam a projeção quando a proporção de faturamento entre quinzenas varia. Soma deve ser 1,0.
          </p>
        </div>

        <BrandButton
          variant="primary"
          size="md"
          icon={<Save size={18} />}
          onClick={handleSave}
        >
          {saved ? 'Salvo!' : 'Salvar configuração'}
        </BrandButton>
      </BrandCard>

      {Object.keys(configs).length > 0 && (
        <BrandCard variant="elevated" padding="lg" className="mt-6">
          <h2 className="text-lg font-heading font-bold text-neutral-900 dark:text-white mb-4">
            Configurações salvas
          </h2>
          <div className="space-y-2">
            {Object.entries(configs)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([chave, cfg]) => (
                <div
                  key={chave}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-[#0A0A0A]"
                >
                  <span className="font-heading font-semibold text-neutral-900 dark:text-white">
                    {chave}
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-gray-400">
                    {cfg.diasUteis != null && `${cfg.diasUteis} dias úteis`}
                    {cfg.diasUteis != null && (cfg.pesoQuinzena1 != null || cfg.pesoQuinzena2 != null) && ' · '}
                    {(cfg.pesoQuinzena1 != null || cfg.pesoQuinzena2 != null) &&
                      `Q1: ${(cfg.pesoQuinzena1 ?? 0.5).toFixed(2)} / Q2: ${(cfg.pesoQuinzena2 ?? 0.5).toFixed(2)}`}
                  </span>
                </div>
              ))}
          </div>
        </BrandCard>
      )}
    </div>
  )
}
