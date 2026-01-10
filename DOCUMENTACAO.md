# 📚 Documentação Técnica - Ponto Perfeito

## 1. OVERVIEW DO PROJETO

### Informações Gerais

- **Nome**: Ponto Perfeito
- **Descrição**: Sistema completo de diagnóstico de varejo para materiais de construção. Transforma dados brutos em análises estratégicas através de 5 módulos de análise especializados.
- **Stack Tecnológico**: 
  - React 18.3.1
  - Vite 7.3.1
  - TailwindCSS 3.4.9
  - React Router DOM 6.26.0
- **Deploy**: Vercel
- **URL de Produção**: https://pontoperfeito-rho.vercel.app
- **Versão**: 0.0.1

### Objetivo

Fornecer uma plataforma web completa para análise de dados de varejo, permitindo que lojistas de materiais de construção identifiquem oportunidades de melhoria, otimizem estoques, avaliem equipes e desenvolvam estratégias de marketing digital.

---

## 2. ESTRUTURA DE PASTAS

```
ponto-perfeito/
├── public/
│   ├── manifest.json          # Manifesto PWA
│   ├── service-worker.js       # Service Worker para cache offline
│   ├── icon.svg                # Ícone SVG base
│   └── README-ICONS.md         # Instruções para gerar ícones PNG
│
├── src/
│   ├── App.jsx                 # Componente raiz, rotas e providers
│   ├── main.jsx                # Entry point, registro de Service Worker
│   ├── index.css               # Estilos globais e animações
│   │
│   ├── components/
│   │   ├── analysis/           # Componentes específicos de análise
│   │   │   ├── ChartCard.jsx   # Card wrapper para gráficos Recharts
│   │   │   ├── DataTable.jsx   # Tabela com ordenação e paginação
│   │   │   ├── EmptyState.jsx  # Estado vazio com ícone e mensagem
│   │   │   ├── EquipeAnalysis.jsx    # Análise completa de equipe
│   │   │   ├── EstoqueAnalysis.jsx   # Análise completa de estoque
│   │   │   ├── FaturamentoAnalysis.jsx # Análise completa de faturamento
│   │   │   ├── KPICard.jsx     # Card de métrica principal (KPI)
│   │   │   ├── LayoutAnalysis.jsx    # Análise de layout e categoria
│   │   │   ├── MarketingAnalysis.jsx # Análise de marketing digital
│   │   │   ├── Section.jsx     # Seção com título e conteúdo
│   │   │   ├── StatGrid.jsx    # Grid responsivo para KPIs
│   │   │   └── index.js        # Exportações centralizadas
│   │   │
│   │   ├── common/             # Componentes reutilizáveis
│   │   │   ├── Button.jsx      # Botão com variantes e estados
│   │   │   ├── Card.jsx        # Card container com variantes
│   │   │   ├── ComparisonBadge.jsx # Badge de comparação de períodos
│   │   │   ├── DownloadModelModal.jsx # Modal para download de modelos CSV
│   │   │   ├── ExportPDFModal.jsx     # Modal para exportação de PDF
│   │   │   ├── Input.jsx       # Input com label, ícone e validação
│   │   │   ├── InstallPWA.jsx  # Banner de instalação PWA
│   │   │   ├── Logo.jsx        # Logo do sistema (variantes)
│   │   │   ├── PeriodFilter.jsx # Filtro de período (últimos 7 dias, mês, etc)
│   │   │   ├── ReportHistory.jsx # Histórico de relatórios PDF gerados
│   │   │   └── index.js        # Exportações centralizadas
│   │   │
│   │   └── dashboard/
│   │       ├── FileUpload.jsx  # Upload com drag-and-drop
│   │       └── index.js        # Exportações
│   │
│   ├── config/
│   │   └── admins.js           # Lista de emails de administradores
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx    # Contexto de autenticação e usuários
│   │   └── DataContext.jsx     # Contexto de dados e análises
│   │
│   ├── hooks/
│   │   └── useAdmin.js         # Hook para verificar se usuário é admin
│   │
│   ├── pages/
│   │   ├── Analysis.jsx        # Página base para análises específicas
│   │   ├── Dashboard.jsx       # Dashboard principal
│   │   ├── Login.jsx           # Página de login
│   │   ├── NotFound.jsx        # Página 404
│   │   └── Register.jsx        # Página de cadastro
│   │
│   └── utils/
│       ├── analysisCalculations.js # Funções de cálculo e análise
│       ├── chartCapture.js         # Captura de gráficos para PDF
│       ├── fileParser.js           # Parser de CSV/Excel
│       ├── modelFileGenerator.js   # Geração de arquivos modelo CSV
│       ├── pdfGenerator.js         # Geração de PDFs com pdfmake
│       ├── reportHistory.js        # Gerenciamento de histórico de relatórios
│       └── validators.js           # Validações (email, CNPJ, etc)
│
├── index.html                   # HTML base com meta tags PWA
├── package.json                 # Dependências e scripts
├── vite.config.js              # Configuração do Vite
├── tailwind.config.js          # Configuração do TailwindCSS
├── vercel.json                 # Configuração de deploy Vercel
└── DOCUMENTACAO.md             # Este arquivo
```

---

## 3. FUNCIONALIDADES IMPLEMENTADAS

### 3.1 Autenticação e Usuários

- ✅ **Sistema de Login**
  - Validação de usuários cadastrados
  - Persistência com localStorage
  - Auto-preenchimento de formulário
  - Mensagens de erro claras

- ✅ **Sistema de Cadastro**
  - Formulário completo com validações
  - Campos: nome, email, senha, WhatsApp, CNPJ, loja, cidade, estado
  - Upload de logo da loja (opcional)
  - Validação de email duplicado
  - Validação de CNPJ com checksum

- ✅ **Níveis de Acesso**
  - Sistema de roles (admin/user)
  - Admins configurados: `automatizarse@gmail.com` e `geraldobrazil@gmail.com`
  - Interface diferenciada para admins
  - Painel administrativo (preparado para expansão)

### 3.2 Upload e Processamento de Dados

- ✅ **Upload de Arquivos**
  - Suporte para CSV, XLS, XLSX
  - Drag and drop
  - Validação de tamanho (10MB)
  - Validação de tipo de arquivo
  - Preview do arquivo carregado

- ✅ **Parser Inteligente**
  - Identificação automática de colunas
  - Mapeamento de variações de nomes (ex: "valor", "preço", "total")
  - Suporte a múltiplos formatos de data
  - Normalização de dados

- ✅ **Persistência**
  - Dados salvos em localStorage
  - Recuperação automática ao recarregar
  - Limpeza de dados com confirmação

### 3.3 Análises Implementadas

#### 3.3.1 Faturamento
- Faturamento total e ticket médio
- Curva ABC de produtos
- Top categorias e fornecedores
- Evolução temporal do faturamento
- Comparativo mês atual vs anterior

#### 3.3.2 Estoque
- Identificação de rupturas (stockouts)
- Produtos encalhados (slow-moving)
- Valor total parado em estoque
- Curva ABC de estoque
- Alertas de produtos críticos

#### 3.3.3 Equipe
- Ranking de vendedores
- Performance individual
- Métricas por vendedor (receita, vendas, ticket médio)
- Identificação de top seller
- Análise de dependências

#### 3.3.4 Layout e Categoria
- Distribuição por categoria
- Distribuição por fornecedor
- Matriz categoria x fornecedor
- Treemap de receita
- Top categorias e fornecedores

#### 3.3.5 Marketing Digital
- Checklist interativo (8 itens)
- Score de presença digital
- Recomendações priorizadas
- Templates de posts
- Calendário editorial
- Fluxos de integração

### 3.4 Filtros e Comparações

- ✅ **Filtros de Período Globais**
  - Últimos 7 dias
  - Últimos 30 dias
  - Último mês
  - Últimos 3 meses
  - Últimos 6 meses
  - Último ano
  - Todos os dados
  - Baseado na data máxima dos dados carregados

- ✅ **Comparativo de Períodos**
  - Comparação automática mês atual vs anterior
  - Indicadores de crescimento/queda
  - Badges visuais (verde/vermelho)
  - Percentual de variação
  - Aplicado em: Faturamento, Vendas, Ticket Médio

### 3.5 Exportação e Relatórios

- ✅ **Exportação de PDF**
  - Geração profissional com pdfmake
  - Capa personalizada com logo da loja
  - Sumário executivo com KPIs
  - Seções por análise selecionada
  - Captura de gráficos como imagens
  - Plano de ação dinâmico
  - Opção de incluir dados brutos

- ✅ **Histórico de Relatórios**
  - Armazenamento de relatórios gerados
  - Limite de 50 relatórios
  - Informações: loja, período, análises, métricas
  - Exclusão individual ou em massa
  - Contador no header

- ✅ **Download de Modelos**
  - Modelos CSV para cada tipo de análise
  - Instruções de uso
  - Geração dinâmica de arquivos

### 3.6 Personalização

- ✅ **Upload de Logo**
  - Upload no cadastro (opcional)
  - Gerenciamento no dashboard
  - Validação: PNG, JPG, SVG até 2MB
  - Preview antes de salvar
  - Aparece na capa do PDF

### 3.7 PWA (Progressive Web App)

- ✅ **Manifest.json**
  - Configuração completa
  - Ícones e cores
  - Modo standalone
  - Shortcuts configurados

- ✅ **Service Worker**
  - Cache de recursos
  - Funcionamento offline básico
  - Atualização automática

- ✅ **Instalação**
  - Banner de instalação
  - Suporte mobile e desktop
  - Safe areas para notch

---

## 4. COMPONENTES PRINCIPAIS

### 4.1 Componentes Comuns (`src/components/common/`)

#### Button.jsx
**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: Componente de ícone (lucide-react)
- `isLoading`: boolean
- `disabled`: boolean
- `children`: ReactNode
- `onClick`: function
- `className`: string

**Funcionalidade**: Botão reutilizável com múltiplas variantes, estados de loading e suporte a ícones.

#### Input.jsx
**Props:**
- `label`: string
- `type`: string (text, email, password, etc)
- `name`: string
- `value`: string
- `onChange`: function
- `onBlur`: function (opcional)
- `error`: string (mensagem de erro)
- `icon`: Componente de ícone (opcional)
- `placeholder`: string
- `required`: boolean
- `disabled`: boolean
- `autoComplete`: string

**Funcionalidade**: Input com label, ícone opcional, validação visual e mensagens de erro.

#### Card.jsx
**Props:**
- `variant`: 'default' | 'elevated' | 'outlined'
- `children`: ReactNode
- `className`: string

**Funcionalidade**: Container de card com sombras e bordas variadas.

#### Logo.jsx
**Props:**
- `variant`: 'full' | 'icon'
- `size`: 'sm' | 'md' | 'lg'

**Funcionalidade**: Logo do sistema em diferentes variantes e tamanhos.

#### PeriodFilter.jsx
**Props:**
- `onFilterChange`: function (callback ao mudar filtro)
- `defaultFilter`: string (filtro inicial)
- `dataDateRange`: object ({ minDate, maxDate })

**Funcionalidade**: Filtro de período com opções pré-definidas, baseado no range de datas dos dados.

#### ComparisonBadge.jsx
**Props:**
- `comparison`: object ({ percentChange, isPositive })
- `size`: 'sm' | 'md' | 'lg'

**Funcionalidade**: Badge visual mostrando variação percentual com cores e ícones (↑ verde, ↓ vermelho).

#### DownloadModelModal.jsx
**Props:**
- `isOpen`: boolean
- `onClose`: function

**Funcionalidade**: Modal para download de arquivos modelo CSV para cada tipo de análise.

#### ExportPDFModal.jsx
**Props:**
- `isOpen`: boolean
- `onClose`: function
- `analysisData`: object (dados das análises)

**Funcionalidade**: Modal para configurar e gerar relatório PDF, com seleção de análises e opções.

#### ReportHistory.jsx
**Props:**
- `onHistoryChange`: function (callback quando histórico muda)

**Funcionalidade**: Exibe histórico de relatórios PDF gerados, com opções de exclusão.

#### InstallPWA.jsx
**Props:** Nenhuma

**Funcionalidade**: Banner de instalação do PWA, aparece quando o navegador detecta que o app pode ser instalado.

### 4.2 Componentes de Análise (`src/components/analysis/`)

#### KPICard.jsx
**Props:**
- `title`: string
- `value`: string | number
- `subtitle`: string (opcional)
- `icon`: Componente de ícone
- `color`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
- `trend`: object ({ value, isPositive }) (opcional)
- `badge`: ReactNode (opcional)
- `className`: string

**Funcionalidade**: Card de métrica principal (KPI) com ícone, valor, subtítulo e suporte a badge de comparação.

#### ChartCard.jsx
**Props:**
- `title`: string | ReactNode
- `children`: ReactNode (gráfico Recharts)
- `className`: string

**Funcionalidade**: Wrapper para gráficos com título e estilo consistente.

#### DataTable.jsx
**Props:**
- `columns`: array [{ key, label, render? }]
- `data`: array (dados)
- `sortable`: boolean
- `maxRows`: number (padrão: 10)
- `emptyMessage`: string
- `className`: string

**Funcionalidade**: Tabela com ordenação, paginação e renderização customizada de células.

#### StatGrid.jsx
**Props:**
- `columns`: number (1-4)
- `children`: ReactNode (KPICards)

**Funcionalidade**: Grid responsivo para exibir múltiplos KPIs.

#### Section.jsx
**Props:**
- `title`: string
- `children`: ReactNode
- `className`: string

**Funcionalidade**: Seção com título e conteúdo, usado para agrupar análises relacionadas.

#### EmptyState.jsx
**Props:**
- `icon`: Componente de ícone
- `title`: string
- `message`: string

**Funcionalidade**: Estado vazio com ícone e mensagem, usado quando não há dados.

#### FaturamentoAnalysis.jsx
**Props:**
- `activeTab`: string ('overview' | 'abc' | 'categorias')

**Funcionalidade**: Análise completa de faturamento com 3 tabs, KPIs, gráficos e tabelas.

#### EstoqueAnalysis.jsx
**Props:**
- `activeTab`: string ('overview' | 'ruptura' | 'encalhados')

**Funcionalidade**: Análise completa de estoque com identificação de rupturas e produtos encalhados.

#### EquipeAnalysis.jsx
**Props:**
- `activeTab`: string ('overview' | 'ranking' | 'individual')

**Funcionalidade**: Análise completa de equipe com ranking e performance individual.

#### LayoutAnalysis.jsx
**Props:**
- `activeTab`: string ('overview' | 'distribuicao')

**Funcionalidade**: Análise de layout e categoria com distribuições e treemap.

#### MarketingAnalysis.jsx
**Props:**
- `activeTab`: string ('checklist' | 'integracao')

**Funcionalidade**: Análise de marketing digital com checklist interativo e recomendações.

### 4.3 Componentes de Dashboard (`src/components/dashboard/`)

#### FileUpload.jsx
**Props:** Nenhuma

**Funcionalidade**: Componente de upload com drag-and-drop, validações, preview e estados visuais.

---

## 5. CONTEXTOS E ESTADO

### 5.1 AuthContext (`src/contexts/AuthContext.jsx`)

**Responsabilidades:**
- Gerenciar estado de autenticação
- Persistir usuário no localStorage
- Validar login (apenas usuários cadastrados)
- Gerenciar banco de dados de usuários (localStorage)
- Detectar e atribuir roles (admin/user)

**Estado:**
- `user`: Object | null (dados do usuário)
- `isAuthenticated`: boolean
- `isLoading`: boolean

**Métodos:**
- `login(name, email)`: Faz login (valida se usuário existe)
- `register(userData)`: Registra novo usuário (valida email duplicado)
- `logout()`: Faz logout e limpa dados

**Storage Keys:**
- `pontoPerfeito_user`: Usuário autenticado atual
- `pontoPerfeito_registeredUsers`: Array de todos os usuários cadastrados

### 5.2 DataContext (`src/contexts/DataContext.jsx`)

**Responsabilidades:**
- Gerenciar dados do arquivo carregado
- Mapear colunas automaticamente
- Identificar análises disponíveis
- Filtrar dados por período
- Agrupar dados por período
- Calcular range de datas

**Estado:**
- `rawData`: Array (dados brutos do arquivo)
- `mappedColumns`: Object (mapeamento de colunas)
- `availableAnalysis`: Array (análises disponíveis)
- `fileName`: string
- `periodFilter`: string
- `groupByPeriod`: string ('day' | 'week' | 'month')

**Métodos:**
- `processFile(file)`: Processa arquivo CSV/Excel
- `clearData()`: Limpa todos os dados
- `filterDataByPeriod(data, dateField)`: Filtra dados por período
- `groupDataByPeriod(data, dateField, valueField)`: Agrupa dados por período
- `getAnalysisData(type)`: Retorna dados específicos para uma análise
- `getDataDateRange(data, dateField)`: Calcula min/max de datas

**Storage Key:**
- `pontoPerfeito_data`: Dados processados e mapeamento

---

## 6. BIBLIOTECAS USADAS

### Dependências de Produção

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| `react` | ^18.3.1 | Framework principal |
| `react-dom` | ^18.3.1 | Renderização React |
| `react-router-dom` | ^6.26.0 | Roteamento SPA |
| `date-fns` | ^4.1.0 | Manipulação de datas |
| `lucide-react` | ^0.427.0 | Ícones SVG |
| `recharts` | ^2.12.7 | Gráficos (Line, Bar, Pie, Treemap) |
| `papaparse` | ^5.4.1 | Parser de CSV |
| `xlsx` | ^0.18.5 | Parser de Excel (XLS/XLSX) |
| `pdfmake` | ^0.3.1 | Geração de PDFs |
| `html2canvas` | ^1.4.1 | Captura de gráficos para PDF |
| `react-input-mask` | ^2.0.4 | Máscaras de input (CNPJ, telefone) |

### Dependências de Desenvolvimento

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| `vite` | ^7.3.1 | Build tool e dev server |
| `@vitejs/plugin-react` | ^4.3.1 | Plugin React para Vite |
| `tailwindcss` | ^3.4.9 | Framework CSS utility-first |
| `autoprefixer` | ^10.4.20 | Prefixos CSS automáticos |
| `postcss` | ^8.4.41 | Processador CSS |
| `@types/react` | ^18.3.3 | Types para React |
| `@types/react-dom` | ^18.3.0 | Types para React DOM |

---

## 7. FLUXOS PRINCIPAIS

### 7.1 Fluxo de Cadastro

```
1. Usuário acessa /register
2. Preenche formulário completo
3. Validações em tempo real (email, CNPJ, senha)
4. Upload opcional de logo (validação de tipo e tamanho)
5. Submit → register(userData)
6. AuthContext valida email duplicado
7. Se válido: salva em pontoPerfeito_registeredUsers
8. Detecta se é admin (por email)
9. Autentica automaticamente
10. Redireciona para /dashboard
```

### 7.2 Fluxo de Login

```
1. Usuário acessa /login
2. Preenche nome e email
3. Submit → login(name, email)
4. AuthContext busca em pontoPerfeito_registeredUsers
5. Se não encontrado: erro "Usuário não cadastrado"
6. Se encontrado: autentica com dados completos
7. Detecta role (admin/user)
8. Salva em pontoPerfeito_user
9. Redireciona para /dashboard
```

### 7.3 Fluxo de Upload e Análise

```
1. Usuário faz upload de arquivo (CSV/Excel)
2. FileUpload valida tipo e tamanho
3. fileParser.js processa arquivo
4. DataContext identifica colunas automaticamente
5. DataContext mapeia para campos esperados
6. DataContext identifica análises disponíveis
7. Salva em localStorage (pontoPerfeito_data)
8. Dashboard atualiza cards de análise
9. Usuário clica em "Ver Análise"
10. Navega para /analysis/{tipo}
11. Analysis.jsx renderiza componente específico
12. Componente de análise calcula métricas
13. Exibe KPIs, gráficos e tabelas
```

### 7.4 Fluxo de Geração de PDF

```
1. Usuário clica em "Exportar PDF"
2. ExportPDFModal abre
3. Usuário seleciona análises e configura opções
4. Usuário clica em "Gerar PDF"
5. chartCapture.js prepara gráficos para captura
6. html2canvas captura gráficos como imagens
7. pdfGenerator.js cria estrutura do PDF
8. Adiciona capa (com logo se disponível)
9. Adiciona sumário executivo
10. Adiciona seções por análise selecionada
11. Adiciona gráficos capturados
12. Adiciona plano de ação
13. pdfmake gera e faz download do PDF
14. reportHistory.js salva no histórico
15. Modal fecha com mensagem de sucesso
```

---

## 8. CONFIGURAÇÕES IMPORTANTES

### 8.1 Administradores

**Arquivo**: `src/config/admins.js`

**Emails configurados:**
- `automatizarse@gmail.com`
- `geraldobrazil@gmail.com`

**Como adicionar novos admins:**
1. Editar `src/config/admins.js`
2. Adicionar email no array `ADMIN_EMAILS`
3. O sistema detecta automaticamente no próximo login/cadastro

### 8.2 Limites e Configurações

| Configuração | Valor | Localização |
|--------------|-------|-------------|
| Tamanho máximo de arquivo | 10MB | `src/components/dashboard/FileUpload.jsx` |
| Tamanho máximo de logo | 2MB | `src/pages/Register.jsx`, `src/pages/Dashboard.jsx` |
| Limite de histórico | 50 relatórios | `src/utils/reportHistory.js` |
| Segmento padrão | Material de Construção | `src/pages/Register.jsx` |
| Cache do Service Worker | ponto-perfeito-v1 | `public/service-worker.js` |

### 8.3 Mapeamento de Colunas

**Arquivo**: `src/contexts/DataContext.jsx`

O sistema identifica automaticamente colunas com base em variações comuns:

- **DATA**: data, date, data_venda, dt_venda, etc.
- **VALOR**: valor, preco, preço, total, vlr, price, etc.
- **PRODUTO**: produto, item, descricao, sku, etc.
- **CATEGORIA**: categoria, category, tipo, grupo, etc.
- **FORNECEDOR**: fornecedor, supplier, vendor, marca, etc.
- **VENDEDOR**: vendedor, seller, atendente, consultor, etc.
- **QUANTIDADE**: quantidade, qtd, qty, unidades, etc.
- **ESTOQUE**: estoque, stock, saldo, disponivel, etc.

### 8.4 Cores do Sistema

**Tema Principal:**
- Primary: `#0F172A` (slate-900)
- Secondary: `#14B8A6` (teal-500)
- Success: `#10B981` (green-500)
- Warning: `#F59E0B` (amber-500)
- Danger: `#EF4444` (red-500)

**PWA:**
- Theme Color: `#14B8A6`
- Background Color: `#0F172A`

---

## 9. PENDÊNCIAS E MELHORIAS FUTURAS

### 9.1 PWA Completo

- [ ] Gerar ícones PNG (192x192 e 512x512)
- [ ] Testar instalação em dispositivos reais
- [ ] Melhorar cache do Service Worker
- [ ] Adicionar notificações push
- [ ] Implementar atualizações automáticas do SW

### 9.2 Funcionalidades

- [ ] Envio de PDF por email
- [ ] Compartilhamento de relatórios
- [ ] Exportação para Excel
- [ ] Filtros avançados (por categoria, fornecedor, etc)
- [ ] Comparação customizada de períodos
- [ ] Alertas automáticos (ruptura, meta, etc)

### 9.3 Infraestrutura

- [ ] Substituir localStorage por banco de dados real
- [ ] API backend (Node.js, Python, etc)
- [ ] Autenticação com JWT
- [ ] Upload de arquivos para servidor
- [ ] Armazenamento de arquivos em cloud (S3, etc)

### 9.4 Negócio

- [ ] Sistema de assinaturas (planos)
- [ ] Multi-tenancy (múltiplas lojas por usuário)
- [ ] Limites por plano
- [ ] Dashboard administrativo completo
- [ ] Gerenciamento de usuários
- [ ] Analytics de uso

### 9.5 UX/UI

- [ ] Modo escuro
- [ ] Internacionalização (i18n)
- [ ] Acessibilidade (WCAG)
- [ ] Animações mais suaves
- [ ] Loading states melhorados

---

## 10. COMANDOS ÚTEIS

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### Deploy

O projeto está configurado para deploy automático na Vercel:

1. Push para repositório Git conectado
2. Vercel detecta mudanças
3. Build automático
4. Deploy automático

**Configuração**: `vercel.json`

---

## 11. ESTRUTURA DE DADOS

### Usuário (localStorage: `pontoPerfeito_user`)

```javascript
{
  name: "João Silva",
  email: "joao@email.com",
  password: "...", // Em produção, deve ser hasheado
  whatsapp: "11999999999",
  storeName: "Material de Construção Central",
  cnpj: "12345678000190",
  city: "São Paulo",
  state: "SP",
  segment: "Material de Construção",
  logo: "data:image/png;base64,...", // Base64 ou null
  role: "user" | "admin",
  isAdmin: boolean,
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

### Dados Processados (localStorage: `pontoPerfeito_data`)

```javascript
{
  rawData: [...], // Array de objetos
  mappedColumns: {
    data: "Data",
    valor: "Valor",
    produto: "Produto",
    // ...
  },
  fileName: "vendas.csv",
  availableAnalysis: ["faturamento", "estoque", ...]
}
```

### Histórico de Relatórios (localStorage: `pontoPerfeito_reportHistory`)

```javascript
[
  {
    id: "1705312200000",
    storeName: "Loja",
    dateRange: "02/01/24 - 18/09/24",
    generatedAt: "2024-01-15T10:30:00.000Z",
    analyses: {
      faturamento: true,
      estoque: true,
      // ...
    },
    metrics: {
      totalRevenue: 123456.78,
      totalSales: 1500,
      averageTicket: 82.30
    }
  }
]
```

---

## 12. NOTAS TÉCNICAS

### Performance

- Uso de `useMemo` para cálculos pesados
- Lazy loading de componentes de análise
- Paginação em tabelas grandes
- Limite de 50 relatórios no histórico

### Segurança

- Validação de entrada em todos os formulários
- Sanitização de dados do arquivo
- Validação de tipos de arquivo
- Limites de tamanho

### Compatibilidade

- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Mobile-first design
- PWA suportado
- Responsive em todos os dispositivos

---

## 13. CONTATO E SUPORTE

Para dúvidas técnicas ou sugestões, entre em contato com a equipe de desenvolvimento.

**Versão do Documento**: 1.0  
**Última Atualização**: Janeiro 2024
