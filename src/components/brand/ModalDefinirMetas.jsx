import React, { useState, useEffect } from 'react'
import { X, Target, Save, Users, ChevronDown, ChevronRight, UserPlus } from 'lucide-react'
import BrandButton from './BrandButton'
import {
  salvarMeta,
  buscarMeta,
  listarMetasVendedor,
  salvarMetaVendedor,
} from '../../utils/metasStorage'

const CAMPOS_META = ['ROB', 'LOB', 'MB', 'MC', 'clientesAtivos']

const formatoInicial = () => ({
  ROB: '',
  LOB: '',
  MB: '',
  MC: '',
  clientesAtivos: '',
})

function BlocoMeta({ metas, metasAtuais, onChange, compacto = false }) {
  const inputClass =
    'w-full px-4 py-3 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary font-display font-bold text-lg focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all'
  const inputClassCompact = compacto
    ? 'w-full px-3 py-2 border border-gray-200 dark:border-[#404040] rounded-lg text-sm'
    : inputClass

  return (
    <div className="space-y-4">
      {!compacto && (
        <div>
          <label className="block text-sm font-heading font-semibold text-primary mb-2">
            ROB (Receita Bruta sem ST) - R$
          </label>
          <input
            type="number"
            value={metas.ROB}
            onChange={(e) => onChange('ROB', e.target.value)}
            placeholder="Ex: 500000"
            min="0"
            step="1000"
            className={inputClassCompact}
          />
          {metasAtuais?.ROB != null && (
            <p className="text-xs text-secondary dark:text-tertiary mt-1 font-body">
              Realizado: R$ {metasAtuais.ROB.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          )}
        </div>
      )}
      {compacto && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CAMPOS_META.map((campo) => (
            <div key={campo}>
              <label className="block text-xs font-heading font-semibold text-primary mb-1">{campo}</label>
              <input
                type="number"
                value={metas[campo]}
                onChange={(e) => onChange(campo, e.target.value)}
                placeholder={['ROB', 'LOB'].includes(campo) ? '0' : ''}
                min="0"
                step={['MB', 'MC'].includes(campo) ? '0.1' : '1'}
                className={inputClassCompact}
              />
              {metasAtuais?.[campo] != null && (
                <p className="text-[10px] text-secondary dark:text-tertiary truncate">
                  Real:{' '}
                  {metasAtuais[campo] != null
                    ? typeof metasAtuais[campo] === 'number' && !Number.isInteger(metasAtuais[campo])
                      ? metasAtuais[campo].toFixed(1)
                      : metasAtuais[campo]
                    : '-'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {!compacto && (
        <>
          <div>
            <label className="block text-sm font-heading font-semibold text-primary mb-2">
              LOB (Lucro Bruto) - R$
            </label>
            <input
              type="number"
              value={metas.LOB}
              onChange={(e) => onChange('LOB', e.target.value)}
              placeholder="Ex: 150000"
              min="0"
              step="1000"
              className={inputClassCompact}
            />
            {metasAtuais?.LOB != null && (
              <p className="text-xs text-secondary dark:text-tertiary mt-1 font-body">
                Realizado: R$ {metasAtuais.LOB.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-heading font-semibold text-primary mb-2">MB% - %</label>
              <input
                type="number"
                value={metas.MB}
                onChange={(e) => onChange('MB', e.target.value)}
                placeholder="Ex: 30"
                min="0"
                max="100"
                step="0.1"
                className={inputClassCompact}
              />
              {metasAtuais?.MB != null && (
                <p className="text-xs text-secondary dark:text-tertiary mt-1">Realizado: {metasAtuais.MB.toFixed(1)}%</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-heading font-semibold text-primary mb-2">MC% - %</label>
              <input
                type="number"
                value={metas.MC}
                onChange={(e) => onChange('MC', e.target.value)}
                placeholder="Ex: 25"
                min="0"
                max="100"
                step="0.1"
                className={inputClassCompact}
              />
              {metasAtuais?.MC != null && (
                <p className="text-xs text-secondary dark:text-tertiary mt-1">Realizado: {metasAtuais.MC.toFixed(1)}%</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold text-primary mb-2">Clientes Ativos</label>
            <input
              type="number"
              value={metas.clientesAtivos}
              onChange={(e) => onChange('clientesAtivos', e.target.value)}
              placeholder="Ex: 100"
              min="0"
              step="1"
              className={inputClassCompact}
            />
            {metasAtuais?.clientesAtivos != null && (
              <p className="text-xs text-secondary dark:text-tertiary mt-1">Realizado: {metasAtuais.clientesAtivos}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Modal para definir/editar metas (global e por vendedor)
 */
export default function ModalDefinirMetas({
  isOpen,
  onClose,
  periodo,
  tipo,
  metasAtuais,
  vendedoresDisponiveis = [],
}) {
  const [abaAtiva, setAbaAtiva] = useState('global')
  const [metas, setMetas] = useState(formatoInicial())
  const [metasPorVendedor, setMetasPorVendedor] = useState({})
  const [vendedoresExpandidos, setVendedoresExpandidos] = useState({})
  const [vendedorExtra, setVendedorExtra] = useState('')

  const metasAtuaisGlobal = metasAtuais && (metasAtuais.global || (!metasAtuais.porVendedor && metasAtuais))
  const metasAtuaisPorVendedor = metasAtuais?.porVendedor || {}

  useEffect(() => {
    if (isOpen && periodo) {
      const metasExistentes = buscarMeta(periodo)
      const metasVendedor = listarMetasVendedor(periodo)

      if (metasExistentes) {
        setMetas({
          ROB: metasExistentes.ROB ?? '',
          LOB: metasExistentes.LOB ?? '',
          MB: metasExistentes.MB ?? '',
          MC: metasExistentes.MC ?? '',
          clientesAtivos: metasExistentes.clientesAtivos ?? '',
        })
      } else if (metasAtuaisGlobal) {
        setMetas({
          ROB: metasAtuaisGlobal.ROB ? Math.round(metasAtuaisGlobal.ROB * 1.1) : '',
          LOB: metasAtuaisGlobal.LOB ? Math.round(metasAtuaisGlobal.LOB * 1.1) : '',
          MB: metasAtuaisGlobal.MB ? (metasAtuaisGlobal.MB * 1.05).toFixed(1) : '',
          MC: metasAtuaisGlobal.MC ? (metasAtuaisGlobal.MC * 1.05).toFixed(1) : '',
          clientesAtivos: metasAtuaisGlobal.clientesAtivos ? Math.round(metasAtuaisGlobal.clientesAtivos * 1.1) : '',
        })
      }

      const porVendedor = {}
      const todosVendedores = [...new Set([...vendedoresDisponiveis, ...Object.keys(metasVendedor)])]
      todosVendedores.forEach((v) => {
        const salva = metasVendedor[v]
        if (salva) {
          porVendedor[v] = {
            ROB: salva.ROB ?? '',
            LOB: salva.LOB ?? '',
            MB: salva.MB ?? '',
            MC: salva.MC ?? '',
            clientesAtivos: salva.clientesAtivos ?? '',
          }
        } else if (metasAtuaisPorVendedor[v]) {
          const r = metasAtuaisPorVendedor[v]
          porVendedor[v] = {
            ROB: r.ROB ? Math.round(r.ROB * 1.1) : '',
            LOB: r.LOB ? Math.round(r.LOB * 1.1) : '',
            MB: r.MB ? (r.MB * 1.05).toFixed(1) : '',
            MC: r.MC ? (r.MC * 1.05).toFixed(1) : '',
            clientesAtivos: r.clientesAtivos ? Math.round(r.clientesAtivos * 1.1) : '',
          }
        } else {
          porVendedor[v] = formatoInicial()
        }
      })
      setMetasPorVendedor(porVendedor)
    }
  }, [isOpen, periodo, metasAtuaisGlobal, metasAtuaisPorVendedor, vendedoresDisponiveis])

  const handleChange = (campo, valor) => {
    setMetas((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleChangeVendedor = (vendedor, campo, valor) => {
    setMetasPorVendedor((prev) => ({
      ...prev,
      [vendedor]: { ...(prev[vendedor] || formatoInicial()), [campo]: valor },
    }))
  }

  const toggleExpandido = (v) => {
    setVendedoresExpandidos((prev) => ({ ...prev, [v]: !prev[v] }))
  }

  const adicionarVendedor = () => {
    const nome = (vendedorExtra || '').trim()
    if (!nome) return
    if (metasPorVendedor[nome]) return
    setMetasPorVendedor((prev) => ({ ...prev, [nome]: formatoInicial() }))
    setVendedorExtra('')
    setVendedoresExpandidos((prev) => ({ ...prev, [nome]: true }))
  }

  const handleSalvar = () => {
    const metasNumeros = {
      ROB: parseFloat(metas.ROB) || 0,
      LOB: parseFloat(metas.LOB) || 0,
      MB: parseFloat(metas.MB) || 0,
      MC: parseFloat(metas.MC) || 0,
      clientesAtivos: parseInt(metas.clientesAtivos, 10) || 0,
    }
    salvarMeta(periodo, tipo, metasNumeros)

    Object.entries(metasPorVendedor).forEach(([vendedor, m]) => {
      const temAlgo = CAMPOS_META.some((c) => m[c] !== '' && m[c] != null)
      if (temAlgo) {
        salvarMetaVendedor(periodo, vendedor, {
          ROB: parseFloat(m.ROB) || 0,
          LOB: parseFloat(m.LOB) || 0,
          MB: parseFloat(m.MB) || 0,
          MC: parseFloat(m.MC) || 0,
          clientesAtivos: parseInt(m.clientesAtivos, 10) || 0,
        })
      }
    })

    onClose(true)
  }

  if (!isOpen) return null

  const listaVendedores = Object.keys(metasPorVendedor)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
        <div className="bg-gradient-to-br from-[#0430BA] to-[#3549FC] text-white p-6 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Target size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold">Definir Metas</h2>
              <p className="text-sm opacity-90 font-body">
                {periodo} - {tipo === 'mensal' ? 'Mensal' : 'Anual'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b-2 border-gray-200 dark:border-[#404040]">
          <button
            onClick={() => setAbaAtiva('global')}
            className={`flex-1 py-3 px-4 font-heading font-bold text-sm transition-colors ${
              abaAtiva === 'global'
                ? 'text-[#3549FC] dark:text-[#4F62FF] border-b-2 border-[#3549FC] dark:border-[#4F62FF] -mb-[2px]'
                : 'text-secondary dark:text-tertiary hover:text-primary'
            }`}
          >
            Meta Global
          </button>
          <button
            onClick={() => setAbaAtiva('vendedor')}
            className={`flex-1 py-3 px-4 font-heading font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
              abaAtiva === 'vendedor'
                ? 'text-[#3549FC] dark:text-[#4F62FF] border-b-2 border-[#3549FC] dark:border-[#4F62FF] -mb-[2px]'
                : 'text-secondary dark:text-tertiary hover:text-primary'
            }`}
          >
            <Users size={18} />
            Metas por Vendedor
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {abaAtiva === 'global' && (
            <>
              <BlocoMeta metas={metas} metasAtuais={metasAtuaisGlobal} onChange={handleChange} />
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-secondary dark:text-tertiary font-body">
                  Metas são preenchidas automaticamente com +10% sobre o realizado. Ajuste conforme sua estratégia.
                </p>
              </div>
            </>
          )}

          {abaAtiva === 'vendedor' && (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vendedorExtra}
                  onChange={(e) => setVendedorExtra(e.target.value)}
                  placeholder="Nome do vendedor..."
                  className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary"
                  onKeyDown={(e) => e.key === 'Enter' && adicionarVendedor()}
                />
                <BrandButton variant="outline" icon={<UserPlus size={18} />} onClick={adicionarVendedor}>
                  Adicionar
                </BrandButton>
              </div>

              {listaVendedores.length === 0 ? (
                <p className="text-sm text-secondary dark:text-tertiary font-body">
                  Nenhum vendedor. Adicione acima ou carregue dados com vendas para ver vendedores.
                </p>
              ) : (
                <div className="space-y-2">
                  {listaVendedores.map((v) => (
                    <div
                      key={v}
                      className="border-2 border-gray-200 dark:border-[#404040] rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpandido(v)}
                        className="w-full flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#0A0A0A] hover:bg-gray-100 dark:hover:bg-[#171717] font-heading font-semibold text-primary"
                      >
                        {vendedoresExpandidos[v] ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                        {v}
                      </button>
                      {vendedoresExpandidos[v] === true && (
                        <div className="p-4 bg-white dark:bg-[#171717] border-t border-gray-200 dark:border-[#404040]">
                          <BlocoMeta
                            metas={metasPorVendedor[v] || formatoInicial()}
                            metasAtuais={metasAtuaisPorVendedor[v]}
                            onChange={(campo, valor) => handleChangeVendedor(v, campo, valor)}
                            compacto
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-[#0A0A0A] p-6 rounded-b-2xl border-t-2 border-gray-200 dark:border-[#404040] flex justify-end gap-3 flex-shrink-0">
          <BrandButton variant="outline" onClick={() => onClose(false)}>
            Cancelar
          </BrandButton>
          <BrandButton variant="primary" icon={<Save size={18} />} onClick={handleSalvar}>
            Salvar Metas
          </BrandButton>
        </div>
      </div>
    </div>
  )
}
