import { useState, useEffect, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { listarMesesFechados } from '../utils/historicoDatabase'

/**
 * Gerar chave única para uma venda
 */
function gerarChaveVenda(venda) {
  const data = venda.data ?? venda.DATA
  const codigo = venda.codigo ?? venda.CODIGO ?? venda.produto ?? venda.PRODUTO ?? ''
  const cliente = venda.cnpj ?? venda.CNPJ ?? venda.cliente ?? venda.CLIENTE ?? ''
  const valor = venda.preco_venda ?? venda.PRECO_VENDA ?? venda.valor ?? venda.VALOR
  const qtd = venda.quantidade ?? venda.QUANTIDADE ?? ''

  const dataStr = data instanceof Date ? data.getTime() : (data ?? '')
  return `${dataStr}|${codigo}|${cliente}|${valor}|${qtd}`
}

/**
 * Hook que combina dados atuais + dados históricos
 */
export function useDadosComHistorico() {
  const { rawData, mappedColumns } = useData()
  const dadosAtuais = Array.isArray(rawData) ? rawData : []
  const [mesesFechados, setMesesFechados] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const meses = await listarMesesFechados()
      setMesesFechados(meses)
      setCarregando(false)

      console.log('📚 Dados históricos carregados:', meses.length, 'meses')
    }

    carregar()
  }, [])

  const dadosCombinados = useMemo(() => {
    if (carregando) return dadosAtuais

    const dadosHistoricos = []
    mesesFechados.forEach((mes) => {
      if (mes.dados && Array.isArray(mes.dados)) {
        dadosHistoricos.push(...mes.dados)
      }
    })

    console.log('🔄 Merge de dados:')
    console.log('   - Histórico:', dadosHistoricos.length, 'vendas')
    console.log('   - Atual:', dadosAtuais.length, 'vendas')

    const mapaVendas = new Map()

    dadosHistoricos.forEach((venda) => {
      const chave = gerarChaveVenda(venda)
      if (!mapaVendas.has(chave)) {
        mapaVendas.set(chave, { ...venda, _origem: 'historico' })
      }
    })

    dadosAtuais.forEach((venda) => {
      const chave = gerarChaveVenda(venda)
      mapaVendas.set(chave, { ...venda, _origem: 'atual' })
    })

    const resultado = Array.from(mapaVendas.values())

    console.log('   - Combinado:', resultado.length, 'vendas únicas')

    return resultado
  }, [dadosAtuais, mesesFechados, carregando])

  const estatisticas = useMemo(() => {
    const dadosHistoricos = dadosCombinados.filter((v) => v._origem === 'historico')
    const dadosAtuaisFiltrados = dadosCombinados.filter((v) => v._origem === 'atual')

    return {
      total: dadosCombinados.length,
      historico: dadosHistoricos.length,
      atual: dadosAtuaisFiltrados.length,
      mesesFechados: mesesFechados.length,
    }
  }, [dadosCombinados, mesesFechados])

  return {
    dados: dadosCombinados,
    mesesFechados,
    carregando,
    estatisticas,
    mappedColumns,
    recarregar: async () => {
      const meses = await listarMesesFechados()
      setMesesFechados(meses)
    },
  }
}
