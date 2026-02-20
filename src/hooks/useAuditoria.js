import { useCallback } from 'react'
import AuditoriaProfissional from '@/utils/auditoriaAvancada'
import { useData } from '@/contexts/DataContext'

export function useAuditoria() {
  const { rawData } = useData()

  const executarAuditoria = useCallback(() => {
    console.clear()
    console.log('🎓 INICIANDO AUDITORIA PROFISSIONAL NÍVEL MACKENZIE')

    const auditoria = new AuditoriaProfissional()

    // Dados: rawData pode ser array (faturamento) ou { faturamento, estoque }
    const faturamento = Array.isArray(rawData) ? rawData : rawData?.faturamento || []
    const estoque = Array.isArray(rawData) ? [] : rawData?.estoque || []

    if (faturamento.length > 0) {
      const resultado = auditoria.validarDadosBrutos(faturamento, 'faturamento')

      if (resultado.dadosCorrigidos?.length > 0 && resultado.estatisticas?.corrigidos > 0) {
        console.log(`\n✅ ${resultado.estatisticas.corrigidos} registros de faturamento foram corrigidos`)
      }
    }

    if (estoque.length > 0) {
      const resultado = auditoria.validarDadosBrutos(estoque, 'estoque')

      if (resultado.dadosCorrigidos?.length > 0 && resultado.estatisticas?.corrigidos > 0) {
        console.log(`\n✅ ${resultado.estatisticas.corrigidos} registros de estoque foram corrigidos`)
      }
    }

    const relatorio = auditoria.gerarRelatorio()

    return relatorio
  }, [rawData])

  return { executarAuditoria }
}
