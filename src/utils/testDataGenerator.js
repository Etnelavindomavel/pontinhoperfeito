import { format, subDays, addDays } from 'date-fns'

// Dados realistas para material de construção
const MATERIAIS = [
  'Cimento CP-II 50kg', 'Areia Média m³', 'Brita 1 m³', 'Tijolo Cerâmico 9 furos',
  'Telha Cerâmica Colonial', 'Cal Hidratada 20kg', 'Ferro 10mm Barra',
  'Tubo PVC 100mm', 'Tinta Látex 18L Branca', 'Piso Cerâmico 60x60',
  'Argamassa AC-II 20kg', 'Porta de Madeira 80cm', 'Janela Alumínio 1x1',
  'Arame Recozido kg', 'Mangueira 1/2" rolo', 'Registro Pressão 1/2"',
  'Torneira Metal Jardim', 'Caixa D\'água 1000L', 'Esquadria Alumínio',
  'Bloco Concreto 14x19x39', 'Laje Pré-moldada', 'Viga Pré-moldada',
  'Madeira Pinus 3x3', 'Compensado 15mm', 'Lixa Massa nº 100',
  'Rolo Espuma 23cm', 'Pincel 2"', 'Broxa 4"', 'Espátula Aço 10cm',
  'Desempenadeira Aço', 'Nível Bolha 40cm', 'Prumo Pedreiro',
  'Trena 5m', 'Martelo Unha', 'Serrote 22"', 'Colher Pedreiro',
  'Enxada Larga', 'Pá Bico', 'Carrinho Obra', 'Betoneira 150L'
]

const CATEGORIAS = [
  'Cimentos e Argamassas', 'Agregados', 'Alvenaria', 'Telhado',
  'Hidráulica', 'Elétrica', 'Pinturas', 'Pisos e Revestimentos',
  'Esquadrias', 'Ferramentas', 'Estrutura', 'Madeira'
]

const FORNECEDORES = [
  'Votorantim Cimentos', 'LafargeHolcim', 'InterCement', 'Distribuidora Central',
  'Fortaleza Mat. Construção', 'Depósito Santa Rita', 'Cerâmica São João',
  'Telhas Paulista', 'Tigre Tubos', 'Amanco', 'Suvinil Tintas',
  'Coral Tintas', 'Portinari Pisos', 'Eliane Revestimentos',
  'Sasazaki Janelas', 'Alumifort', 'Madeireira São Paulo', 'Eletromadeira'
]

const VENDEDORES = [
  'Roberto Lima', 'Mariana Santos', 'Ana Costa', 'Carlos Souza',
  'Juliana Alves', 'Pedro Oliveira', 'Fernanda Rocha', 'Lucas Martins',
  'Beatriz Silva', 'Rafael Pereira'
]

// Função principal de geração
export function generateTestData(config) {
  const {
    startDate,
    endDate,
    numTransactions = 500,
    includeEstoque = true,
    includeVendedor = true,
    includeCategoria = true,
    includeFornecedor = true,
    scenarios = [] // 'ruptura', 'encalhe', 'vendedor-dominante'
  } = config
  
  const data = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24))
  
  // Criar transações
  for (let i = 0; i < numTransactions; i++) {
    const randomDay = Math.floor(Math.random() * daysDiff)
    const transactionDate = addDays(start, randomDay)
    
    const produto = MATERIAIS[Math.floor(Math.random() * MATERIAIS.length)]
    const categoria = includeCategoria ? CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)] : ''
    const fornecedor = includeFornecedor ? FORNECEDORES[Math.floor(Math.random() * FORNECEDORES.length)] : ''
    
    // Vendedor: se scenario 'vendedor-dominante', 70% vai para Roberto Lima
    let vendedor = ''
    if (includeVendedor) {
      if (scenarios.includes('vendedor-dominante') && Math.random() < 0.7) {
        vendedor = 'Roberto Lima'
      } else {
        vendedor = VENDEDORES[Math.floor(Math.random() * VENDEDORES.length)]
      }
    }
    
    // Valores realistas por categoria
    const basePrice = getBasePrice(produto)
    const quantidade = Math.floor(Math.random() * 20) + 1
    const valor = basePrice * quantidade * (0.9 + Math.random() * 0.2) // variação de 10%
    
    // Estoque
    let estoque = 0
    if (includeEstoque) {
      // Se scenario 'ruptura', 20% dos produtos com estoque < 5
      if (scenarios.includes('ruptura') && Math.random() < 0.2) {
        estoque = Math.floor(Math.random() * 3)
      } 
      // Se scenario 'encalhe', 20% com estoque muito alto
      else if (scenarios.includes('encalhe') && Math.random() < 0.2) {
        estoque = Math.floor(Math.random() * 500) + 200
      }
      else {
        estoque = Math.floor(Math.random() * 100) + 10
      }
    }
    
    data.push({
      Data: format(transactionDate, 'yyyy-MM-dd'),
      Produto: produto,
      Categoria: categoria,
      Fornecedor: fornecedor,
      Vendedor: vendedor,
      Quantidade: quantidade,
      Valor: parseFloat(valor.toFixed(2)),
      Estoque: estoque
    })
  }
  
  return data
}

function getBasePrice(produto) {
  // Preços realistas baseados no produto
  if (produto.includes('Cimento')) return 35
  if (produto.includes('Areia') || produto.includes('Brita')) return 120
  if (produto.includes('Tijolo')) return 0.80
  if (produto.includes('Telha')) return 2.50
  if (produto.includes('Ferro')) return 45
  if (produto.includes('Tubo')) return 25
  if (produto.includes('Tinta')) return 180
  if (produto.includes('Piso')) return 35
  if (produto.includes('Porta')) return 350
  if (produto.includes('Janela')) return 280
  if (produto.includes('Caixa D\'água')) return 450
  if (produto.includes('Betoneira')) return 1800
  return 50 // default
}

// Converter para CSV
export function convertToCSV(data) {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      // Escapar valores com vírgula
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}

// Download do arquivo
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
