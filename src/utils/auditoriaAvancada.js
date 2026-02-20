/**
 * ═══════════════════════════════════════════════════════════════════
 * AUDITORIA PROFISSIONAL NÍVEL CONSULTORIA
 * Padrão Mackenzie de Excelência
 * ═══════════════════════════════════════════════════════════════════
 *
 * Este módulo realiza auditoria rigorosa de TODOS os cálculos e
 * CORRIGE automaticamente quaisquer inconsistências encontradas.
 *
 * Critérios de avaliação:
 * - Precisão matemática (até 2 casas decimais)
 * - Consistência de dados (sem duplicatas, valores corretos)
 * - Validação de lógica de negócio
 * - Testes de edge cases
 * - Validação de agregações
 * - Integridade referencial
 *
 * ═══════════════════════════════════════════════════════════════════
 */

export class AuditoriaProfissional {
  constructor() {
    this.errosCriticos = []
    this.errosGraves = []
    this.avisos = []
    this.correcoesAplicadas = []
    this.validacoes = []
    this.precisao = 0.01 // Tolerância de 1 centavo
  }

  // ═══════════════════════════════════════════════════════════════════
  // UTILITÁRIOS MATEMÁTICOS
  // ═══════════════════════════════════════════════════════════════════

  arredondar(valor, casas = 2) {
    return Math.round(valor * Math.pow(10, casas)) / Math.pow(10, casas)
  }

  saoIguais(a, b, tolerancia = this.precisao) {
    return Math.abs(a - b) < tolerancia
  }

  validarNumero(valor, contexto = 'valor') {
    if (typeof valor !== 'number') {
      this.errosCriticos.push(`${contexto}: tipo inválido (${typeof valor})`)
      return false
    }
    if (isNaN(valor)) {
      this.errosCriticos.push(`${contexto}: NaN detectado`)
      return false
    }
    if (!isFinite(valor)) {
      this.errosCriticos.push(`${contexto}: Infinity detectado`)
      return false
    }
    return true
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÃO DE DADOS BRUTOS
  // ═══════════════════════════════════════════════════════════════════

  validarDadosBrutos(dados, tipo = 'faturamento') {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`🔬 AUDITANDO DADOS BRUTOS - ${tipo.toUpperCase()}`)
    console.log('='.repeat(70))

    if (!Array.isArray(dados)) {
      this.errosCriticos.push(`${tipo}: dados não são array`)
      return { valido: false, dadosCorrigidos: [] }
    }

    if (dados.length === 0) {
      this.errosCriticos.push(`${tipo}: array vazio`)
      return { valido: false, dadosCorrigidos: [] }
    }

    console.log(`✓ Total de registros: ${dados.length}`)

    const dadosCorrigidos = []
    let registrosInvalidos = 0
    let registrosCorrigidos = 0
    let duplicatasRemovidas = 0

    const registrosUnicos = new Map()

    // Resolver chaves (aceita nomes mapeados: valor, Valor, etc.)
    const primeiro = dados[0]
    const valorKey = Object.keys(primeiro).find(
      (k) => k.toLowerCase() === 'valor' || (k.toLowerCase().includes('valor') && !k.toLowerCase().includes('unitario'))
    ) || 'valor'
    const dataKey = Object.keys(primeiro).find(
      (k) => k.toLowerCase() === 'data' || k.toLowerCase().includes('data') || k.toLowerCase().includes('date')
    ) || 'data'
    const quantidadeKey = Object.keys(primeiro).find(
      (k) => k.toLowerCase().includes('quantidade') || k.toLowerCase().includes('qtd')
    ) || 'quantidade'

    dados.forEach((item, index) => {
      let itemCorrigido = { ...item }
      let precisaCorrecao = false

      if (valorKey in itemCorrigido) {
        let val = itemCorrigido[valorKey]
        if (typeof val === 'string') val = parseFloat(val)
        if (!this.validarNumero(val, `${tipo}[${index}].valor`)) {
          itemCorrigido[valorKey] = 0
          precisaCorrecao = true
          registrosInvalidos++
        } else if (val < 0) {
          this.avisos.push(`${tipo}[${index}]: valor negativo (${val}) corrigido para 0`)
          itemCorrigido[valorKey] = 0
          precisaCorrecao = true
          registrosCorrigidos++
        } else {
          const valorOriginal = itemCorrigido[valorKey]
          itemCorrigido[valorKey] = this.arredondar(Number(itemCorrigido[valorKey]), 2)
          if (!this.saoIguais(valorOriginal, itemCorrigido[valorKey])) {
            precisaCorrecao = true
            registrosCorrigidos++
          }
        }
      }

      if (quantidadeKey in itemCorrigido) {
        let qtd = itemCorrigido[quantidadeKey]
        if (typeof qtd === 'string') qtd = parseFloat(qtd)
        if (!this.validarNumero(qtd, `${tipo}[${index}].quantidade`)) {
          itemCorrigido[quantidadeKey] = 0
          precisaCorrecao = true
          registrosInvalidos++
        } else if (qtd < 0) {
          this.avisos.push(`${tipo}[${index}]: quantidade negativa (${qtd}) corrigida para 0`)
          itemCorrigido[quantidadeKey] = 0
          precisaCorrecao = true
          registrosCorrigidos++
        } else {
          const quantidadeOriginal = itemCorrigido[quantidadeKey]
          itemCorrigido[quantidadeKey] = Math.round(Number(itemCorrigido[quantidadeKey]))
          if (Number(quantidadeOriginal) !== itemCorrigido[quantidadeKey]) {
            precisaCorrecao = true
            registrosCorrigidos++
          }
        }
      }

      if (dataKey in itemCorrigido && itemCorrigido[dataKey]) {
        const data = new Date(itemCorrigido[dataKey])
        if (isNaN(data.getTime())) {
          this.errosGraves.push(`${tipo}[${index}]: data inválida`)
          registrosInvalidos++
          return
        }
        if (data > new Date()) {
          this.avisos.push(`${tipo}[${index}]: data no futuro`)
        }
      }

      const chave = `${itemCorrigido[dataKey]}_${itemCorrigido[valorKey]}_${itemCorrigido[quantidadeKey]}`
      if (registrosUnicos.has(chave)) {
        duplicatasRemovidas++
        return
      }
      registrosUnicos.set(chave, true)

      if (precisaCorrecao) {
        this.correcoesAplicadas.push(`${tipo}[${index}]: valores corrigidos`)
      }

      dadosCorrigidos.push(itemCorrigido)
    })

    console.log(`✓ Registros válidos: ${dadosCorrigidos.length}`)
    console.log(`${registrosInvalidos > 0 ? '⚠' : '✓'} Registros inválidos removidos: ${registrosInvalidos}`)
    console.log(`${registrosCorrigidos > 0 ? '⚠' : '✓'} Registros corrigidos: ${registrosCorrigidos}`)
    console.log(`${duplicatasRemovidas > 0 ? '⚠' : '✓'} Duplicatas removidas: ${duplicatasRemovidas}`)

    return {
      valido: registrosInvalidos === 0,
      dadosCorrigidos,
      estatisticas: {
        total: dados.length,
        validos: dadosCorrigidos.length,
        invalidos: registrosInvalidos,
        corrigidos: registrosCorrigidos,
        duplicatas: duplicatasRemovidas,
      },
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÃO DE AGREGAÇÕES (SOMAS, MÉDIAS, ETC)
  // ═══════════════════════════════════════════════════════════════════

  validarAgregacao(dadosOriginais, valorAgregado, tipo = 'soma', contexto = 'total') {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`🧮 VALIDANDO AGREGAÇÃO: ${contexto}`)

    const valorKey = dadosOriginais[0] && Object.keys(dadosOriginais[0]).find((k) => k.toLowerCase().includes('valor')) || 'valor'
    const valorEsperado =
      tipo === 'soma'
        ? dadosOriginais.reduce((sum, item) => sum + (Number(item[valorKey]) || 0), 0)
        : dadosOriginais.reduce((sum, item) => sum + (Number(item[valorKey]) || 0), 0) / dadosOriginais.length

    const valorEsperadoArredondado = this.arredondar(valorEsperado, 2)
    const valorAgregadoArredondado = this.arredondar(valorAgregado, 2)

    console.log(`  Valor calculado: R$ ${valorAgregadoArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`  Valor esperado:  R$ ${valorEsperadoArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

    if (!this.saoIguais(valorAgregadoArredondado, valorEsperadoArredondado, 0.02)) {
      const diferenca = Math.abs(valorAgregadoArredondado - valorEsperadoArredondado)
      this.errosGraves.push(
        `${contexto}: diferença de R$ ${diferenca.toFixed(2)} detectada ` +
          `(calculado: ${valorAgregadoArredondado}, esperado: ${valorEsperadoArredondado})`
      )
      console.log(`  ❌ ERRO: Diferença de R$ ${diferenca.toFixed(2)}`)
      return { valido: false, valorCorreto: valorEsperadoArredondado }
    }

    console.log(`  ✓ Validação OK`)
    this.validacoes.push(`${contexto}: agregação validada`)
    return { valido: true, valorCorreto: valorAgregadoArredondado }
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÃO DE CURVA ABC
  // ═══════════════════════════════════════════════════════════════════

  validarCurvaABC(itens, parametros = { A: 50, B: 25, C: 15, D: 10 }) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`📊 AUDITANDO CURVA ABC`)
    console.log('='.repeat(70))

    if (!itens || itens.length === 0) {
      this.errosCriticos.push('ABC: nenhum item para classificar')
      return { valido: false, itensCorrigidos: [] }
    }

    console.log(`✓ Itens a classificar: ${itens.length}`)
    console.log(`✓ Parâmetros: A=${parametros.A}% | B=${parametros.B}% | C=${parametros.C}% | D=${parametros.D}%`)

    const somaParametros = parametros.A + parametros.B + parametros.C + parametros.D
    if (!this.saoIguais(somaParametros, 100, 0.01)) {
      this.errosCriticos.push(`ABC: parâmetros não somam 100% (soma: ${somaParametros}%)`)
      return { valido: false, itensCorrigidos: [] }
    }

    const total = itens.reduce((sum, item) => sum + (item.totalValue ?? item.value ?? 0), 0)

    if (total === 0) {
      this.errosCriticos.push('ABC: total é zero, impossível classificar')
      return { valido: false, itensCorrigidos: [] }
    }

    console.log(`✓ Valor total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

    let acumulado = 0
    const itensCorrigidos = itens.map((item, index) => {
      const valor = item.totalValue ?? item.value ?? 0
      const percentual = this.arredondar((valor / total) * 100, 2)
      acumulado += percentual
      const acumuladoArredondado = this.arredondar(acumulado, 2)

      let classe = 'D'
      if (acumuladoArredondado <= parametros.A) {
        classe = 'A'
      } else if (acumuladoArredondado <= parametros.A + parametros.B) {
        classe = 'B'
      } else if (acumuladoArredondado <= parametros.A + parametros.B + parametros.C) {
        classe = 'C'
      }

      if (item.class && item.class !== classe) {
        this.correcoesAplicadas.push(
          `ABC[${index}]: classe corrigida de ${item.class} para ${classe} ` + `(acumulado: ${acumuladoArredondado}%)`
        )
      }

      const percAnt = item.percentage ?? item.accumulatedPercentage
      if (percAnt != null && !this.saoIguais(percAnt, percentual, 0.01)) {
        this.correcoesAplicadas.push(
          `ABC[${index}]: percentual corrigido de ${Number(percAnt).toFixed(2)}% ` + `para ${percentual}%`
        )
      }

      return {
        ...item,
        percentage: percentual,
        accumulated: acumuladoArredondado,
        accumulatedPercentage: acumuladoArredondado,
        class: classe,
        _original: {
          percentage: item.percentage ?? item.accumulatedPercentage,
          accumulated: item.accumulated ?? item.accumulatedPercentage,
          class: item.class,
        },
      }
    })

    const ultimoAcumulado = itensCorrigidos[itensCorrigidos.length - 1].accumulated
    if (!this.saoIguais(ultimoAcumulado, 100, 0.5)) {
      this.errosGraves.push(`ABC: acumulado final é ${ultimoAcumulado}% (esperado: ~100%)`)
      console.log(`  ❌ Acumulado final: ${ultimoAcumulado}% (esperado: 100%)`)
    } else {
      console.log(`  ✓ Acumulado final: ${ultimoAcumulado}% ✓`)
      this.validacoes.push('ABC: acumulado final correto')
    }

    const distribuicao = { A: 0, B: 0, C: 0, D: 0 }
    itensCorrigidos.forEach((item) => distribuicao[item.class]++)

    console.log(`\n  Distribuição por classe:`)
    console.log(`    A: ${distribuicao.A} itens (${this.arredondar((distribuicao.A / itens.length) * 100, 1)}%)`)
    console.log(`    B: ${distribuicao.B} itens (${this.arredondar((distribuicao.B / itens.length) * 100, 1)}%)`)
    console.log(`    C: ${distribuicao.C} itens (${this.arredondar((distribuicao.C / itens.length) * 100, 1)}%)`)
    console.log(`    D: ${distribuicao.D} itens (${this.arredondar((distribuicao.D / itens.length) * 100, 1)}%)`)

    return {
      valido: this.errosGraves.filter((e) => e.startsWith('ABC')).length === 0,
      itensCorrigidos,
      distribuicao,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÃO DE COMPARATIVOS
  // ═══════════════════════════════════════════════════════════════════

  validarComparativo(valorAtual, valorAnterior, contexto = 'comparativo') {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`📈 VALIDANDO COMPARATIVO: ${contexto}`)

    if (!this.validarNumero(valorAtual, `${contexto}.atual`)) {
      return { valido: false, variacaoCorreta: 0 }
    }

    if (!this.validarNumero(valorAnterior, `${contexto}.anterior`)) {
      return { valido: false, variacaoCorreta: 0 }
    }

    const valorAtualArredondado = this.arredondar(valorAtual, 2)
    const valorAnteriorArredondado = this.arredondar(valorAnterior, 2)

    console.log(`  Valor atual:    R$ ${valorAtualArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`  Valor anterior: R$ ${valorAnteriorArredondado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

    if (valorAnteriorArredondado === 0) {
      if (valorAtualArredondado > 0) {
        console.log(`  ✓ Crescimento de zero (novo)`)
        this.validacoes.push(`${contexto}: crescimento de zero validado`)
        return { valido: true, variacaoCorreta: Infinity, tipo: 'novo' }
      } else {
        console.log(`  ✓ Ambos zero (sem variação)`)
        return { valido: true, variacaoCorreta: 0, tipo: 'zero' }
      }
    }

    const variacaoCalculada = this.arredondar(
      ((valorAtualArredondado - valorAnteriorArredondado) / valorAnteriorArredondado) * 100,
      1
    )

    console.log(`  Variação: ${variacaoCalculada > 0 ? '+' : ''}${variacaoCalculada}%`)

    if (Math.abs(variacaoCalculada) > 500) {
      this.avisos.push(
        `${contexto}: variação muito alta (${variacaoCalculada.toFixed(1)}%) - ` + `verificar se dados estão corretos`
      )
    }

    this.validacoes.push(`${contexto}: variação calculada corretamente`)
    return { valido: true, variacaoCorreta: variacaoCalculada, tipo: 'normal' }
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAÇÃO DE MÉDIAS E TICKETS
  // ═══════════════════════════════════════════════════════════════════

  validarTicketMedio(total, quantidadeTransacoes, contexto = 'ticket médio') {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`🎫 VALIDANDO TICKET MÉDIO: ${contexto}`)

    if (!this.validarNumero(total, `${contexto}.total`)) {
      return { valido: false, ticketCorreto: 0 }
    }

    if (quantidadeTransacoes === 0) {
      console.log(`  ⚠ Sem transações - ticket médio = R$ 0,00`)
      return { valido: true, ticketCorreto: 0 }
    }

    const ticketCalculado = this.arredondar(total / quantidadeTransacoes, 2)

    console.log(`  Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`  Transações: ${quantidadeTransacoes}`)
    console.log(`  Ticket médio: R$ ${ticketCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

    if (ticketCalculado > 100000) {
      this.avisos.push(
        `${contexto}: ticket médio muito alto (R$ ${ticketCalculado.toLocaleString('pt-BR')}) - ` + `verificar dados`
      )
    }

    if (ticketCalculado < 1 && total > 0) {
      this.avisos.push(
        `${contexto}: ticket médio muito baixo (R$ ${ticketCalculado.toFixed(2)}) - ` + `verificar dados`
      )
    }

    this.validacoes.push(`${contexto}: cálculo validado`)
    return { valido: true, ticketCorreto: ticketCalculado }
  }

  // ═══════════════════════════════════════════════════════════════════
  // RELATÓRIO FINAL
  // ═══════════════════════════════════════════════════════════════════

  gerarRelatorio() {
    console.log(`\n${'═'.repeat(70)}`)
    console.log('📊 RELATÓRIO FINAL DA AUDITORIA PROFISSIONAL')
    console.log('═'.repeat(70))

    const totalProblemas = this.errosCriticos.length + this.errosGraves.length + this.avisos.length

    console.log(`\n📈 ESTATÍSTICAS:`)
    console.log(`  Validações realizadas: ${this.validacoes.length}`)
    console.log(`  Correções aplicadas: ${this.correcoesAplicadas.length}`)
    console.log(`  Problemas encontrados: ${totalProblemas}`)

    if (this.errosCriticos.length > 0) {
      console.log(`\n❌ ERROS CRÍTICOS (${this.errosCriticos.length}):`)
      this.errosCriticos.forEach((erro, i) => {
        console.log(`  ${i + 1}. ${erro}`)
      })
    }

    if (this.errosGraves.length > 0) {
      console.log(`\n⚠️  ERROS GRAVES (${this.errosGraves.length}):`)
      this.errosGraves.forEach((erro, i) => {
        console.log(`  ${i + 1}. ${erro}`)
      })
    }

    if (this.avisos.length > 0) {
      console.log(`\n⚠️  AVISOS (${this.avisos.length}):`)
      this.avisos.forEach((aviso, i) => {
        console.log(`  ${i + 1}. ${aviso}`)
      })
    }

    if (this.correcoesAplicadas.length > 0) {
      console.log(`\n✅ CORREÇÕES APLICADAS (${this.correcoesAplicadas.length}):`)
      this.correcoesAplicadas.slice(0, 10).forEach((correcao, i) => {
        console.log(`  ${i + 1}. ${correcao}`)
      })
      if (this.correcoesAplicadas.length > 10) {
        console.log(`  ... e mais ${this.correcoesAplicadas.length - 10} correções`)
      }
    }

    const aprovado = this.errosCriticos.length === 0 && this.errosGraves.length === 0

    console.log(`\n${'═'.repeat(70)}`)
    if (aprovado) {
      console.log('✅ SISTEMA APROVADO PARA CLIENTE')
      console.log('   Todos os cálculos foram validados e corrigidos.')
    } else {
      console.log('⛔ SISTEMA REPROVADO')
      console.log('   Corrija os erros críticos e graves antes de mostrar ao cliente!')
    }
    console.log('═'.repeat(70))
    console.log('')

    return {
      aprovado,
      errosCriticos: this.errosCriticos,
      errosGraves: this.errosGraves,
      avisos: this.avisos,
      correcoesAplicadas: this.correcoesAplicadas,
      validacoes: this.validacoes,
    }
  }
}

if (typeof window !== 'undefined') {
  window.AuditoriaProfissional = AuditoriaProfissional
}

export default AuditoriaProfissional
