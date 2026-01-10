import { useState, useMemo, useEffect } from 'react'
import {
  Megaphone,
  Instagram,
  Facebook,
  Globe,
  MessageCircle,
  Mail,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  BookOpen,
  Truck,
  Copy,
  TrendingUp,
  Store,
  Database,
  Settings,
} from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import {
  KPICard,
  StatGrid,
  ChartCard,
  Section,
  EmptyState,
} from '@/components/analysis'
import { formatPercentage } from '@/utils/analysisCalculations'

// Configuração dos canais
const CANAIS = [
  {
    id: 'instagram',
    nome: 'Instagram',
    icon: Instagram,
    descricao: 'Perfil comercial ativo',
    dicas: [
      'Poste pelo menos 3x por semana',
      'Use Stories diariamente',
      'Responda DMs em até 1 hora',
      'Use link na bio para catálogo',
      'Crie conteúdo visual atrativo',
    ],
    prioridade: 'alta',
  },
  {
    id: 'facebook',
    nome: 'Facebook',
    icon: Facebook,
    descricao: 'Página comercial ativa',
    dicas: [
      'Posts regulares com produtos',
      'Use o Marketplace para vendas',
      'Participe de grupos locais',
      'Invista em anúncios direcionados',
      'Crie eventos para lançamentos',
    ],
    prioridade: 'alta',
  },
  {
    id: 'whatsapp',
    nome: 'WhatsApp Business',
    icon: MessageCircle,
    descricao: 'WhatsApp Business configurado',
    dicas: [
      'Configure catálogo de produtos',
      'Use respostas rápidas',
      'Poste no Status diariamente',
      'Crie listas de transmissão',
      'Responda em até 1 hora',
    ],
    prioridade: 'alta',
  },
  {
    id: 'website',
    nome: 'Site/E-commerce',
    icon: Globe,
    descricao: 'Site ou loja online',
    dicas: [
      'Otimize para SEO',
      'Garanta velocidade de carregamento',
      'Design responsivo (mobile)',
      'Checkout simplificado',
      'Integre com redes sociais',
    ],
    prioridade: 'média',
  },
  {
    id: 'googleBusiness',
    nome: 'Google Meu Negócio',
    icon: MapPin,
    descricao: 'Perfil no Google completo',
    dicas: [
      'Adicione fotos dos produtos',
      'Mantenha horário atualizado',
      'Responda todas as avaliações',
      'Poste novidades semanalmente',
      'Use posts promocionais',
    ],
    prioridade: 'alta',
  },
  {
    id: 'email',
    nome: 'Email Marketing',
    icon: Mail,
    descricao: 'Lista de emails e campanhas',
    dicas: [
      'Crie newsletter semanal',
      'Envie promoções exclusivas',
      'Recupere carrinho abandonado',
      'Segmentação por interesse',
      'Automatize boas-vindas',
    ],
    prioridade: 'média',
  },
  {
    id: 'catalogo',
    nome: 'Catálogo Digital',
    icon: BookOpen,
    descricao: 'Catálogo de produtos online',
    dicas: [
      'Fotos profissionais',
      'Preços sempre atualizados',
      'Descrições completas',
      'Atualize semanalmente',
      'Compartilhe via WhatsApp',
    ],
    prioridade: 'média',
  },
  {
    id: 'delivery',
    nome: 'Delivery/Pedidos Online',
    icon: Truck,
    descricao: 'Sistema de pedidos online',
    dicas: [
      'Integre com iFood/Rappi',
      'Sistema próprio de delivery',
      'Promova no Instagram',
      'Ofereça frete grátis',
      'Tempo de entrega claro',
    ],
    prioridade: 'baixa',
  },
]

// Templates de posts
const POST_TEMPLATES = [
  {
    id: 'promocao',
    titulo: 'Promoção',
    template: `🔥 PROMOÇÃO ESPECIAL! 🔥

{Produto} com {Desconto}% OFF!

💰 De R$ {PrecoAntigo} por apenas R$ {PrecoNovo}
⏰ Válido até {Data}

💬 Chame no WhatsApp: {Telefone}
📍 {Endereco}

#Promoção #Oferta #Desconto`,
  },
  {
    id: 'lancamento',
    titulo: 'Lançamento',
    template: `✨ NOVIDADE CHEGOU! ✨

Acabamos de receber {Produto}!

{Descricao}

💎 Qualidade garantida
🚚 Entrega disponível
💬 Saiba mais no WhatsApp

#Novidade #Lançamento #NovoProduto`,
  },
  {
    id: 'dica',
    titulo: 'Dica Útil',
    template: `💡 DICA DO DIA 💡

{Dica}

Essa é uma dica que pode te ajudar no dia a dia!

Tem alguma dúvida? Chame no WhatsApp! 📱

#Dica #DicaUtil #Conhecimento`,
  },
  {
    id: 'bastidores',
    titulo: 'Bastidores',
    template: `📸 BASTIDORES 📸

Hoje mostramos um pouco do nosso dia a dia!

{Descricao}

É assim que cuidamos de cada detalhe para você! ❤️

#Bastidores #NossoDia #Equipe`,
  },
]

// Calendário editorial sugerido
const CALENDARIO_EDITORIAL = [
  { dia: 'Segunda', tipo: 'Promoção', descricao: 'Inicie a semana com oferta' },
  { dia: 'Terça', tipo: 'Dica Útil', descricao: 'Conteúdo educativo' },
  { dia: 'Quarta', tipo: 'Produto', descricao: 'Destaque um produto' },
  { dia: 'Quinta', tipo: 'Bastidores', descricao: 'Mostre o dia a dia' },
  { dia: 'Sexta', tipo: 'Promoção', descricao: 'Prepare para o fim de semana' },
  { dia: 'Sábado', tipo: 'Lançamento', descricao: 'Novidades' },
  { dia: 'Domingo', tipo: 'Dica Útil', descricao: 'Conteúdo leve' },
]

/**
 * Círculo de progresso para score
 */
function ProgressCircle({ percentage }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (percentage < 30) return '#EF4444'
    if (percentage < 60) return '#F59E0B'
    if (percentage < 85) return '#3B82F6'
    return '#10B981'
  }

  const getMessage = () => {
    if (percentage < 30) return 'Presença digital inicial - muito a melhorar'
    if (percentage < 60) return 'Presença digital média - no caminho certo'
    if (percentage < 85) return 'Boa presença digital - continue investindo'
    return 'Excelente presença digital!'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40 mb-4">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={getColor()}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: getColor() }}>
              {percentage}%
            </div>
            <div className="text-xs text-gray-600">Score Digital</div>
          </div>
        </div>
      </div>
      <p
        className="text-center font-medium text-lg"
        style={{ color: getColor() }}
      >
        {getMessage()}
      </p>
    </div>
  )
}

/**
 * Componente de análise de Marketing Digital
 * Checklist interativo e orientações para presença digital
 */
export default function MarketingAnalysis({ activeTab = 'checklist' }) {
  const { rawData } = useData()

  // Estado para checklist interativo
  const [checklist, setChecklist] = useState({
    instagram: false,
    facebook: false,
    whatsapp: false,
    website: false,
    googleBusiness: false,
    email: false,
    catalogo: false,
    delivery: false,
  })

  // Carregar checklist do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pontoPerfeito_marketingChecklist')
    if (saved) {
      try {
        setChecklist(JSON.parse(saved))
      } catch (error) {
        console.error('Erro ao carregar checklist:', error)
      }
    }
  }, [])

  // Salvar checklist no localStorage
  useEffect(() => {
    localStorage.setItem(
      'pontoPerfeito_marketingChecklist',
      JSON.stringify(checklist)
    )
  }, [checklist])

  // Calcular score
  const score = useMemo(() => {
    const total = Object.keys(checklist).length
    const completed = Object.values(checklist).filter((v) => v).length
    return Math.round((completed / total) * 100)
  }, [checklist])

  // Toggle checklist item
  const toggleItem = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Obter recomendações priorizadas
  const recomendacoes = useMemo(() => {
    if (score < 50) {
      return [
        {
          titulo: 'Criar perfil no Instagram',
          descricao:
            'Instagram é essencial para varejo. Crie um perfil comercial e comece a postar.',
          prioridade: 'Alta',
        },
        {
          titulo: 'Configurar WhatsApp Business',
          descricao:
            'WhatsApp Business permite catálogo, respostas rápidas e melhor atendimento.',
          prioridade: 'Alta',
        },
        {
          titulo: 'Cadastrar no Google Meu Negócio',
          descricao:
            'Apareça nas buscas locais e aumente sua visibilidade gratuitamente.',
          prioridade: 'Alta',
        },
      ]
    } else if (score < 80) {
      return [
        {
          titulo: 'Implementar catálogo digital',
          descricao:
            'Facilite a visualização de produtos pelos clientes via WhatsApp e site.',
          prioridade: 'Média',
        },
        {
          titulo: 'Iniciar email marketing',
          descricao:
            'Mantenha contato com clientes e envie promoções exclusivas.',
          prioridade: 'Média',
        },
        {
          titulo: 'Ativar anúncios pagos',
          descricao:
            'Invista em anúncios no Instagram e Facebook para alcançar mais pessoas.',
          prioridade: 'Média',
        },
      ]
    } else {
      return [
        {
          titulo: 'Automatizar marketing',
          descricao:
            'Use ferramentas para agendar posts e automatizar respostas.',
          prioridade: 'Baixa',
        },
        {
          titulo: 'Criar programa de fidelidade',
          descricao:
            'Recompense clientes frequentes e aumente a retenção.',
          prioridade: 'Baixa',
        },
        {
          titulo: 'Implementar CRM',
          descricao:
            'Gerencie relacionamento com clientes de forma profissional.',
          prioridade: 'Baixa',
        },
      ]
    }
  }, [score])

  // Função para copiar template
  const copyTemplate = (template) => {
    navigator.clipboard.writeText(template)
    alert('Template copiado para a área de transferência!')
  }

  // Renderizar conteúdo baseado na tab ativa
  return (
    <div className="space-y-8">
      {/* TAB: CHECKLIST */}
      {activeTab === 'checklist' && (
        <>
          {/* Score Card */}
          <Section title="Seu Score de Presença Digital">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <ProgressCircle percentage={score} />
                <div className="flex-1 max-w-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Como está sua presença digital?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Complete o checklist abaixo para melhorar seu score e
                    aumentar sua visibilidade online.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Dica:</strong> Comece pelos canais de alta
                      prioridade (Instagram, WhatsApp, Google Meu Negócio) para
                      ver resultados mais rápidos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Checklist Interativo */}
          <Section title="Checklist de Canais Digitais">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CANAIS.map((canal) => {
                const IconComponent = canal.icon
                const isChecked = checklist[canal.id]

                return (
                  <div
                    key={canal.id}
                    onClick={() => toggleItem(canal.id)}
                    className={`cursor-pointer border-2 rounded-lg p-6 transition-all ${
                      isChecked
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-secondary-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <IconComponent
                          size={32}
                          className={
                            isChecked ? 'text-green-600' : 'text-gray-400'
                          }
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {canal.nome}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {canal.descricao}
                          </p>
                        </div>
                      </div>
                      {isChecked ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <XCircle className="text-gray-300" size={24} />
                      )}
                    </div>

                    {isChecked && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="font-medium text-green-900 mb-2 text-sm">
                          Próximos passos:
                        </p>
                        <ul className="space-y-1 text-xs text-green-800">
                          {canal.dicas.map((dica, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{dica}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>

          {/* Recomendações Priorizadas */}
          {recomendacoes.length > 0 && (
            <Section title="Recomendações Priorizadas">
              <div className="space-y-4">
                {recomendacoes.map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-secondary-600 font-bold">
                            {idx + 1}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {rec.titulo}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                rec.prioridade === 'Alta'
                                  ? 'bg-red-100 text-red-700'
                                  : rec.prioridade === 'Média'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {rec.prioridade}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{rec.descricao}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Dica Importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle
                className="text-yellow-600 flex-shrink-0"
                size={20}
              />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">
                  Dica Importante
                </h4>
                <p className="text-sm text-yellow-800">
                  Comece com os canais onde seu cliente já está. Para varejo
                  local, WhatsApp e Instagram são essenciais. Não tente estar
                  em todos os lugares de uma vez - foque em fazer bem alguns
                  canais primeiro.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB: INTEGRACAO */}
      {activeTab === 'integracao' && (
        <>
          {/* Fluxo de Integração */}
          <Section title="Fluxo de Integração Omnichannel">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
                  <Store size={32} className="text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-blue-900">Loja Física</p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center">
                  <Database size={32} className="text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-900">Dados</p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 text-center">
                  <Settings size={32} className="text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-purple-900">Sistema</p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 text-center">
                  <Share2 size={32} className="text-orange-600 mx-auto mb-2" />
                  <p className="font-semibold text-orange-900">
                    Canais Digitais
                  </p>
                </div>
              </div>
              <p className="text-center text-gray-600">
                Integre seus dados de vendas e estoque com seus canais digitais
                para uma experiência unificada
              </p>
            </div>
          </Section>

          {/* Integrações Detalhadas */}
          <Section title="Integrações Recomendadas">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Integração 1 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Package className="text-blue-600" size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    Estoque x Catálogo
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Sincronize seu estoque físico com o catálogo online. Quando um
                  produto acabar, ele some automaticamente do catálogo.
                </p>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-xs font-medium text-blue-900 mb-1">
                    Benefícios:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Evita vendas de produtos sem estoque</li>
                    <li>• Atualização automática</li>
                    <li>• Economia de tempo</li>
                  </ul>
                </div>
              </div>

              {/* Integração 2 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <MessageCircle className="text-green-600" size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    WhatsApp x Vendas
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Automatize envio de novidades, confirmação de pedidos e
                  follow-up pós-venda via WhatsApp.
                </p>
                <div className="bg-green-50 rounded p-3">
                  <p className="text-xs font-medium text-green-900 mb-1">
                    Benefícios:
                  </p>
                  <ul className="text-xs text-green-800 space-y-1">
                    <li>• Comunicação direta com cliente</li>
                    <li>• Confirmação automática</li>
                    <li>• Aumento de conversão</li>
                  </ul>
                </div>
              </div>

              {/* Integração 3 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Mail className="text-purple-600" size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Email x CRM</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Segmentação de clientes, campanhas personalizadas e
                  recuperação de carrinho abandonado.
                </p>
                <div className="bg-purple-50 rounded p-3">
                  <p className="text-xs font-medium text-purple-900 mb-1">
                    Benefícios:
                  </p>
                  <ul className="text-xs text-purple-800 space-y-1">
                    <li>• Campanhas direcionadas</li>
                    <li>• Maior engajamento</li>
                    <li>• Retorno de investimento</li>
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          {/* Cases de Sucesso */}
          <Section title="Cases de Sucesso">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <TrendingUp className="text-green-600 flex-shrink-0" size={32} />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Loja X aumentou vendas em 40% com Instagram + WhatsApp
                  </h3>
                  <p className="text-gray-700 mb-4">
                    <strong>O que fizeram:</strong>
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 mb-4">
                    <li>• Postaram 5x por semana no Instagram</li>
                    <li>• Configuraram WhatsApp Business com catálogo</li>
                    <li>• Responderam mensagens em até 1 hora</li>
                    <li>• Criaram Stories diários com produtos</li>
                    <li>• Ofereceram frete grátis via WhatsApp</li>
                  </ul>
                  <p className="text-gray-700 mb-2">
                    <strong>Resultados:</strong>
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700 mb-4">
                    <li>• +40% de vendas em 3 meses</li>
                    <li>• +200% de seguidores no Instagram</li>
                    <li>• 80% das vendas via WhatsApp</li>
                  </ul>
                  <p className="text-sm text-gray-600 italic">
                    "Começamos simples, postando produtos que já tínhamos. O
                    WhatsApp virou nossa principal ferramenta de venda."
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Ferramentas Recomendadas */}
          <Section title="Ferramentas Recomendadas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gestão de Redes Sociais */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Share2 className="text-secondary-600 mr-2" size={20} />
                  Gestão de Redes Sociais
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-sm">mLabs</p>
                      <p className="text-xs text-gray-600">
                        Agendamento de posts (grátis)
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-sm">Canva</p>
                      <p className="text-xs text-gray-600">
                        Criação de conteúdo visual (grátis)
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Email Marketing */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="text-secondary-600 mr-2" size={20} />
                  Email Marketing
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-sm">MailChimp</p>
                      <p className="text-xs text-gray-600">
                        Grátis até 2000 contatos
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-sm">RD Station</p>
                      <p className="text-xs text-gray-600">
                        Automação completa (pago)
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* E-commerce */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="text-secondary-600 mr-2" size={20} />
                  E-commerce
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-sm">Nuvemshop</p>
                      <p className="text-xs text-gray-600">
                        Loja online completa
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-sm">Loja Integrada</p>
                      <p className="text-xs text-gray-600">
                        Solução nacional (grátis)
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Pagamentos */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="text-secondary-600 mr-2" size={20} />
                  Pagamentos
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-sm">Mercado Pago</p>
                      <p className="text-xs text-gray-600">
                        Solução completa
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-medium text-sm">PagSeguro</p>
                      <p className="text-xs text-gray-600">
                        Integração fácil
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </Section>

          {/* Templates de Posts */}
          <Section title="Templates de Posts Prontos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POST_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {template.titulo}
                    </h3>
                    <button
                      onClick={() => copyTemplate(template.template)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors text-sm"
                    >
                      <Copy size={16} />
                      <span>Copiar</span>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {template.template}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Calendário Editorial */}
          <Section title="Calendário Editorial Sugerido">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Conteúdo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {CALENDARIO_EDITORIAL.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.dia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.tipo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.descricao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
