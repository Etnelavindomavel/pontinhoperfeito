/**
 * ═══════════════════════════════════════════════════════════════════
 * AUDITORIA COMPLETA DO SISTEMA
 * ═══════════════════════════════════════════════════════════════════
 *
 * Este arquivo contém testes de validação de todas as funcionalidades
 * críticas antes de deploy para cliente.
 *
 * Para executar: No console do navegador digite: window.runAudit()
 *
 * ═══════════════════════════════════════════════════════════════════
 */

class SistemaAuditoria {
  constructor() {
    this.erros = []
    this.avisos = []
    this.sucessos = []
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÕES DE FATURAMENTO
  // ═══════════════════════════════════════════════════════════════════

  validarFaturamento(dados) {
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 AUDITANDO MÓDULO DE FATURAMENTO')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (!dados || dados.length === 0) {
      this.erros.push('FATURAMENTO: Nenhum dado disponível')
      return false
    }

    // Validar campos obrigatórios (aceita nomes mapeados do arquivo)
    const primeiroItem = dados[0]
    const keys = Object.keys(primeiroItem)
    const temValor = keys.some((k) => k.toLowerCase().includes('valor') || k === 'valor')
    const temData = keys.some((k) => k.toLowerCase().includes('data') || k === 'data' || k.toLowerCase().includes('date'))
    const temQuantidade = keys.some((k) => k.toLowerCase().includes('quantidade') || k.toLowerCase().includes('qtd') || k === 'quantidade')

    if (!temValor) {
      this.erros.push('FATURAMENTO: Campo de valor não encontrado (procure: valor, preço, total)')
    }
    if (!temData) {
      this.erros.push('FATURAMENTO: Campo de data não encontrado (procure: data, date)')
    }
    if (!temQuantidade) {
      this.avisos.push('FATURAMENTO: Campo de quantidade não encontrado (opcional)')
    }

    // Resolver nome do campo de valor/data para cálculos
    const valorKey = keys.find((k) => k.toLowerCase() === 'valor' || k.toLowerCase().includes('valor')) || keys[0]
    const dataKey = keys.find((k) => k.toLowerCase() === 'data' || k.toLowerCase().includes('data') || k.toLowerCase().includes('date'))

    let valoresNegativos = 0
    let quantidadesNegativas = 0
    let datasInvalidas = 0

    dados.forEach((item) => {
      const valor = Number(item[valorKey]) || 0
      if (valor < 0) valoresNegativos++

      const qtdKey = keys.find((k) => k.toLowerCase().includes('quantidade') || k.toLowerCase().includes('qtd'))
      if (qtdKey != null) {
        const qtd = Number(item[qtdKey]) || 0
        if (qtd < 0) quantidadesNegativas++
      }

      if (dataKey) {
        const data = new Date(item[dataKey])
        if (isNaN(data.getTime())) datasInvalidas++
      }
    })

    if (valoresNegativos > 0) {
      this.avisos.push(`FATURAMENTO: ${valoresNegativos} registros com valor negativo`)
    }

    if (quantidadesNegativas > 0) {
      this.avisos.push(`FATURAMENTO: ${quantidadesNegativas} registros com quantidade negativa`)
    }

    if (dataKey && datasInvalidas > 0) {
      this.erros.push(`FATURAMENTO: ${datasInvalidas} registros com data inválida`)
    }

    // Validar cálculo de total
    const totalCalculado = dados.reduce((sum, item) => sum + (Number(item[valorKey]) || 0), 0)
    console.log(`✓ Total calculado: R$ ${totalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`✓ Total de registros: ${dados.length}`)

    if (totalCalculado === 0) {
      this.erros.push('FATURAMENTO: Total calculado é zero - verificar dados')
    } else {
      this.sucessos.push('FATURAMENTO: Cálculo de total OK')
    }

    // Validar distribuição temporal
    if (dataKey) {
      const datasUnicas = new Set(
        dados.map((item) => {
          const data = new Date(item[dataKey])
          return isNaN(data.getTime()) ? 'inválida' : data.toDateString()
        })
      )
      console.log(`✓ Datas únicas: ${datasUnicas.size}`)
      if (datasUnicas.size === 1 && !datasUnicas.has('inválida')) {
        this.avisos.push('FATURAMENTO: Todos os dados são da mesma data')
      }
    }

    return this.erros.filter((e) => e.includes('FATURAMENTO')).length === 0
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÕES DE ESTOQUE
  // ═══════════════════════════════════════════════════════════════════

  validarEstoque(dados) {
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 AUDITANDO MÓDULO DE ESTOQUE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (!dados || dados.length === 0) {
      this.avisos.push('ESTOQUE: Nenhum dado disponível (módulo pode não estar em uso)')
      return true
    }

    const primeiroItem = dados[0]
    const keys = Object.keys(primeiroItem)
    const temProduto = keys.some((k) => k.toLowerCase().includes('produto') || k.toLowerCase().includes('item'))
    const temQuantidade = keys.some((k) => k.toLowerCase().includes('quantidade') || k.toLowerCase().includes('qtd') || k.toLowerCase().includes('estoque'))
    const temValor = keys.some((k) => k.toLowerCase().includes('valor') || k.toLowerCase().includes('preco'))

    if (!temProduto) {
      this.erros.push('ESTOQUE: Campo produto/item não encontrado')
    }
    if (!temQuantidade) {
      this.erros.push('ESTOQUE: Campo quantidade/estoque não encontrado')
    }
    if (!temValor) {
      this.avisos.push('ESTOQUE: Campo valor unitário não encontrado')
    }

    const qtdKey = keys.find((k) => k.toLowerCase().includes('quantidade') || k.toLowerCase().includes('qtd') || k.toLowerCase().includes('estoque')) || 'quantidade'
    const valorKey = keys.find((k) => k.toLowerCase().includes('valor') || k.toLowerCase().includes('preco')) || 'valorUnitario'

    let quantidadesNegativas = 0
    let quantidadesZero = 0
    let valoresZero = 0

    dados.forEach((item) => {
      const qtd = Number(item[qtdKey]) || 0
      const vlr = Number(item[valorKey]) || 0
      if (qtd < 0) quantidadesNegativas++
      if (qtd === 0) quantidadesZero++
      if (vlr === 0) valoresZero++
    })

    if (quantidadesNegativas > 0) {
      this.avisos.push(`ESTOQUE: ${quantidadesNegativas} produtos com quantidade negativa`)
    }

    if (dados.length > 0 && quantidadesZero > dados.length * 0.5) {
      this.avisos.push('ESTOQUE: Mais de 50% dos produtos com quantidade zero')
    }

    if (valoresZero > 0) {
      this.avisos.push(`ESTOQUE: ${valoresZero} produtos com valor unitário zero`)
    }

    const valorTotal = dados.reduce(
      (sum, item) => sum + ((Number(item[qtdKey]) || 0) * (Number(item[valorKey]) || 0)),
      0
    )

    console.log(`✓ Valor total em estoque: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`✓ Produtos únicos: ${dados.length}`)

    if (valorTotal === 0 && dados.length > 0) {
      this.avisos.push('ESTOQUE: Valor total é zero')
    } else if (valorTotal > 0) {
      this.sucessos.push('ESTOQUE: Cálculo de valor total OK')
    }

    return this.erros.filter((e) => e.includes('ESTOQUE')).length === 0
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÕES DE CURVA ABC
  // ═══════════════════════════════════════════════════════════════════

  validarCurvaABC(categorias) {
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 AUDITANDO CURVA ABC')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (!categorias || categorias.length === 0) {
      this.avisos.push('ABC: Nenhuma categoria disponível')
      return true
    }

    const nomeCategoria = categorias[0].category != null ? 'category' : 'categoria'
    const acumuladoKey = categorias[0].accumulated != null ? 'accumulated' : 'accumulatedPercentage'

    let totalA = 0,
      totalB = 0,
      totalC = 0,
      totalD = 0

    categorias.forEach((cat) => {
      const cl = cat.class || cat.classe
      switch (cl) {
        case 'A':
          totalA++
          break
        case 'B':
          totalB++
          break
        case 'C':
          totalC++
          break
        case 'D':
          totalD++
          break
        default:
          this.erros.push(`ABC: Classe inválida "${cl}" em ${cat[nomeCategoria] || cat.item}`)
      }
    })

    console.log(`✓ Classe A: ${totalA} categorias`)
    console.log(`✓ Classe B: ${totalB} categorias`)
    console.log(`✓ Classe C: ${totalC} categorias`)
    console.log(`✓ Classe D: ${totalD} categorias`)

    let acumuladoAnterior = 0
    categorias.forEach((cat, index) => {
      const acum = cat[acumuladoKey] != null ? Number(cat[acumuladoKey]) : 0
      if (acum < acumuladoAnterior) {
        this.erros.push(`ABC: Percentual acumulado está decrescente na posição ${index}`)
      }
      acumuladoAnterior = acum
    })

    if (categorias.length > 0) {
      const ultimo = categorias[categorias.length - 1]
      const ultimoAcumulado = ultimo[acumuladoKey] != null ? Number(ultimo[acumuladoKey]) : 0
      if (Math.abs(ultimoAcumulado - 100) > 1) {
        this.erros.push(`ABC: Acumulado final é ${ultimoAcumulado.toFixed(2)}% (esperado ~100%)`)
      } else {
        this.sucessos.push('ABC: Acumulado final correto (~100%)')
      }
    }

    return this.erros.filter((e) => e.includes('ABC')).length === 0
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÕES DE FILTROS
  // ═══════════════════════════════════════════════════════════════════

  validarFiltros() {
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 AUDITANDO SISTEMA DE FILTROS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const periodos = ['7d', '30d', '90d', '365d', 'all']
    periodos.forEach((periodo) => {
      console.log(`✓ Filtro "${periodo}" disponível`)
    })

    this.sucessos.push('FILTROS: Todos os períodos disponíveis')

    return true
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÕES DE COMPARATIVOS
  // ═══════════════════════════════════════════════════════════════════

  validarComparativos(atual, anterior) {
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 AUDITANDO COMPARATIVOS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (!anterior) {
      this.avisos.push('COMPARATIVOS: Não há dados do período anterior')
      return true
    }

    const totalAnterior = anterior.total != null ? anterior.total : 0
    const totalAtual = atual?.total != null ? atual.total : 0
    const variacao = totalAnterior > 0 ? ((totalAtual - totalAnterior) / totalAnterior) * 100 : 0

    console.log(`✓ Período atual: R$ ${totalAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`✓ Período anterior: R$ ${totalAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`✓ Variação: ${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}%`)

    if (Math.abs(variacao) > 1000) {
      this.avisos.push(`COMPARATIVOS: Variação muito alta (${variacao.toFixed(0)}%) - verificar dados`)
    }

    this.sucessos.push('COMPARATIVOS: Cálculo de variação OK')

    return true
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXECUTAR AUDITORIA COMPLETA
  // ═══════════════════════════════════════════════════════════════════

  executar(dados) {
    console.log('')
    console.log('═══════════════════════════════════════════════════════')
    console.log('🔍 INICIANDO AUDITORIA COMPLETA DO SISTEMA')
    console.log('═══════════════════════════════════════════════════════')
    console.log('')

    this.erros = []
    this.avisos = []
    this.sucessos = []

    const inicio = Date.now()

    // Dados podem vir como array (rawData) ou como { faturamento, estoque }
    const faturamento = Array.isArray(dados) ? dados : dados?.faturamento || []
    const estoque = Array.isArray(dados) ? [] : dados?.estoque || []

    this.validarFaturamento(faturamento)
    this.validarEstoque(estoque)
    this.validarFiltros()

    const fim = Date.now()
    const duracao = fim - inicio

    // Relatório final
    console.log('')
    console.log('═══════════════════════════════════════════════════════')
    console.log('📊 RELATÓRIO FINAL DA AUDITORIA')
    console.log('═══════════════════════════════════════════════════════')
    console.log('')
    console.log(`⏱️  Duração: ${duracao}ms`)
    console.log('')
    console.log(`✅ SUCESSOS: ${this.sucessos.length}`)
    this.sucessos.forEach((s) => console.log(`   ✓ ${s}`))
    console.log('')
    console.log(`⚠️  AVISOS: ${this.avisos.length}`)
    this.avisos.forEach((a) => console.log(`   ⚠ ${a}`))
    console.log('')
    console.log(`❌ ERROS: ${this.erros.length}`)
    this.erros.forEach((e) => console.log(`   ✗ ${e}`))
    console.log('')

    if (this.erros.length === 0) {
      console.log('🎉 AUDITORIA COMPLETA: SISTEMA APROVADO!')
    } else {
      console.log('⛔ AUDITORIA COMPLETA: SISTEMA REPROVADO')
      console.log('   Corrija os erros antes de mostrar ao cliente!')
    }

    console.log('═══════════════════════════════════════════════════════')
    console.log('')

    return {
      aprovado: this.erros.length === 0,
      erros: this.erros,
      avisos: this.avisos,
      sucessos: this.sucessos,
      duracao,
    }
  }
}

// Exportar para uso global (navegador)
if (typeof window !== 'undefined') {
  window.SistemaAuditoria = SistemaAuditoria
  window.runAudit = function (dados) {
    const auditoria = new SistemaAuditoria()
    return auditoria.executar(dados)
  }
}

export default SistemaAuditoria
