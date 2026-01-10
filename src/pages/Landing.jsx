import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  TrendingUp, Package, Users, Store, CheckCircle, 
  Upload, LineChart, FileText, ArrowRight, Star,
  Zap, Shield, Clock, Menu, X
} from 'lucide-react'
import Logo from '../components/common/Logo'
import Button from '../components/common/Button'

export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [content, setContent] = useState(null)

  useEffect(() => {
    loadContent()
  }, [])

  function loadContent() {
    try {
      const saved = localStorage.getItem('pontoPerfeito_landingContent')
      if (saved) {
        setContent(JSON.parse(saved))
      } else {
        // Usar conteúdo padrão
        const defaultContent = {
          hero: {
            badge: 'Diagnóstico inteligente para varejo',
            title: 'Transforme Dados em',
            titleHighlight: 'Resultados Reais',
            subtitle: 'Plataforma de diagnóstico especializada em varejo de materiais de construção. Análises profundas, insights acionáveis e consultoria personalizada.',
            ctaPrimary: 'Começar Diagnóstico Gratuito',
            ctaSecondary: 'Já tenho conta'
          },
          stats: [
            { value: '500K+', label: 'Transações Analisadas' },
            { value: '87%', label: 'Aumento Médio em Faturamento' },
            { value: '60+', label: 'Lojas Atendidas' },
            { value: '4.9/5', label: 'Avaliação Média' }
          ],
          about: {
            title: 'Especialistas em Varejo de Materiais de Construção',
            paragraph1: 'A Ponto Perfeito é uma consultoria focada em transformar dados em decisões estratégicas para lojas de materiais de construção em todo o Brasil.',
            paragraph2: 'Nossa plataforma combina algoritmos inteligentes com expertise de mercado para identificar oportunidades de crescimento, otimizar estoque e maximizar resultados.'
          },
          plans: [
            {
              id: 'demo',
              name: 'Demo Gratuito',
              price: 'Grátis',
              period: 'para sempre',
              description: 'Conheça a plataforma',
              features: [
                'Upload de dados (1x)',
                '1 análise (Faturamento)',
                'Visualização limitada',
                'Sem exportar PDF',
                'Sem histórico'
              ],
              cta: 'Começar Grátis',
              highlight: false,
              link: '/register'
            },
            {
              id: 'essencial',
              name: 'Essencial',
              price: 'R$ 97',
              period: '/mês',
              description: 'Para lojas iniciantes',
              features: [
                'Upload ilimitado',
                '2 análises (Faturamento + Estoque)',
                'Relatórios em PDF',
                'Histórico de 30 dias',
                'Suporte por email'
              ],
              cta: 'Começar Teste Grátis',
              highlight: false,
              link: '/register?plan=essencial'
            },
            {
              id: 'pro',
              name: 'Profissional',
              price: 'R$ 197',
              period: '/mês',
              description: 'Para lojas em crescimento',
              features: [
                'Tudo do Essencial +',
                '4 análises (sem Marketing)',
                'Relatórios ilimitados',
                'Histórico de 90 dias',
                'Filtros avançados',
                'Suporte prioritário'
              ],
              cta: 'Começar Teste Grátis',
              highlight: true,
              link: '/register?plan=pro'
            },
            {
              id: 'consultoria',
              name: 'Consultoria',
              price: 'Sob consulta',
              period: '',
              description: 'Transformação completa',
              features: [
                'Tudo do Profissional +',
                'Todas as 5 análises',
                'Consultoria personalizada',
                'Plano de ação exclusivo',
                'Acompanhamento mensal',
                'Whatsapp dedicado'
              ],
              cta: 'Falar com Consultor',
              highlight: false,
              link: '/register?plan=consultoria'
            }
          ],
          testimonials: [
            {
              name: 'Carlos Eduardo',
              role: 'Proprietário',
              company: 'Constrular - Maceió/AL',
              content: 'Em 3 meses aumentamos o faturamento em 24% seguindo as recomendações. A análise de ruptura foi essencial!',
              rating: 5
            },
            {
              name: 'Marina Santos',
              role: 'Gerente Comercial',
              company: 'MegaConstrução - Recife/PE',
              content: 'Descobrimos que 30% do estoque estava encalhado. Com o plano de ação, liberamos R$ 180 mil em capital.',
              rating: 5
            },
            {
              name: 'Roberto Lima',
              role: 'Diretor',
              company: 'Casa & Obra - Aracaju/SE',
              content: 'A análise de equipe mostrou dependências críticas. Reestruturamos e o resultado veio rápido.',
              rating: 5
            },
            {
              name: 'Ana Paula',
              role: 'Sócia',
              company: 'Construmax - Caruaru/PE',
              content: 'Profissionalismo e praticidade. Os relatórios são perfeitos para apresentar aos investidores.',
              rating: 5
            }
          ]
        }
        setContent(defaultContent)
        localStorage.setItem('pontoPerfeito_landingContent', JSON.stringify(defaultContent))
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error)
    }
  }

  // Features e howItWorks permanecem hardcoded (não editáveis por enquanto)
  const features = [
    {
      icon: Upload,
      title: 'Upload Simples',
      description: 'Envie seus dados em CSV, Excel ou XLSX. Processamento automático em segundos.'
    },
    {
      icon: LineChart,
      title: 'Análises Inteligentes',
      description: 'Algoritmos especializados em varejo de materiais de construção.'
    },
    {
      icon: FileText,
      title: 'Relatórios Profissionais',
      description: 'PDFs executivos prontos para apresentar aos sócios e equipe.'
    },
    {
      icon: Zap,
      title: 'Insights Acionáveis',
      description: 'Recomendações práticas baseadas nos seus dados reais.'
    }
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Upload de Dados',
      description: 'Envie seu histórico de vendas, estoque e equipe'
    },
    {
      step: '02',
      title: 'Análise Automática',
      description: 'Processamento inteligente em tempo real'
    },
    {
      step: '03',
      title: 'Diagnóstico Completo',
      description: 'Visualize insights e oportunidades de melhoria'
    },
    {
      step: '04',
      title: 'Plano de Ação',
      description: 'Implemente melhorias com nosso suporte'
    }
  ]

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo variant="full" />
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#sobre" className="text-gray-700 hover:text-secondary-600 transition-colors">
                Sobre
              </a>
              <a href="#como-funciona" className="text-gray-700 hover:text-secondary-600 transition-colors">
                Como Funciona
              </a>
              <a href="#planos" className="text-gray-700 hover:text-secondary-600 transition-colors">
                Planos
              </a>
              <a href="#depoimentos" className="text-gray-700 hover:text-secondary-600 transition-colors">
                Depoimentos
              </a>
              <Link to="/login" className="text-gray-700 hover:text-secondary-600 transition-colors">
                Entrar
              </Link>
              <Button onClick={() => navigate('/register')}>
                Começar Grátis
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-4">
              <a href="#sobre" className="block text-gray-700 hover:text-secondary-600" onClick={() => setMobileMenuOpen(false)}>
                Sobre
              </a>
              <a href="#como-funciona" className="block text-gray-700 hover:text-secondary-600" onClick={() => setMobileMenuOpen(false)}>
                Como Funciona
              </a>
              <a href="#planos" className="block text-gray-700 hover:text-secondary-600" onClick={() => setMobileMenuOpen(false)}>
                Planos
              </a>
              <a href="#depoimentos" className="block text-gray-700 hover:text-secondary-600" onClick={() => setMobileMenuOpen(false)}>
                Depoimentos
              </a>
              <Link to="/login" className="block text-gray-700 hover:text-secondary-600" onClick={() => setMobileMenuOpen(false)}>
                Entrar
              </Link>
              <Button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }} className="w-full">
                Começar Grátis
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-secondary-50 text-secondary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap size={16} />
              <span>{content.hero.badge}</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {content.hero.title}
              <span className="text-secondary-600"> {content.hero.titleHighlight}</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              {content.hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                icon={ArrowRight}
                className="text-lg px-8 py-4"
              >
                {content.hero.ctaPrimary}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-4"
              >
                {content.hero.ctaSecondary}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-gray-200">
              {content.stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-secondary-600">{stat.value}</div>
                  <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {content.about.title}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {content.about.paragraph1}
              </p>
              <p className="text-lg text-gray-600 mb-8">
                {content.about.paragraph2}
              </p>
              <div className="grid grid-cols-2 gap-6">
                {features.slice(0, 2).map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <feature.icon className="text-secondary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <Store className="mx-auto text-secondary-600 mb-4" size={80} />
                <p className="text-gray-600">Mockup da ferramenta aqui</p>
                <p className="text-sm text-gray-500 mt-2">(será substituído após design)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600">
              Ferramentas profissionais para decisões inteligentes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-secondary-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600">
              Do upload à transformação em 4 passos simples
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Escolha seu Plano
            </h2>
            <p className="text-xl text-gray-600">
              Da experimentação à transformação completa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  plan.highlight
                    ? 'ring-2 ring-secondary-600 shadow-xl scale-105'
                    : 'shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="bg-secondary-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Mais Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600">{plan.period}</span>
                  )}
                </div>

                <Button
                  variant={plan.highlight ? 'primary' : 'outline'}
                  className="w-full mb-6"
                  onClick={() => navigate(plan.link)}
                >
                  {plan.cta}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start space-x-2">
                      <CheckCircle className="text-secondary-600 flex-shrink-0 mt-0.5" size={18} />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O Que Dizem Nossos Clientes
            </h2>
            <p className="text-xl text-gray-600">
              Resultados reais de varejistas transformados
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6"
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-yellow-400" size={16} />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-secondary-600">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 bg-gradient-to-br from-secondary-600 to-secondary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para Transformar seu Varejo?
          </h2>
          <p className="text-xl text-secondary-100 mb-10">
            Comece com diagnóstico gratuito e veja os resultados em minutos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              icon={ArrowRight}
              className="bg-white text-secondary-600 hover:bg-gray-50 text-lg px-8 py-4"
              onClick={() => navigate('/register')}
            >
              Começar Agora - É Grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
              onClick={() => navigate('/register?plan=consultoria')}
            >
              Falar com Consultor
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo variant="full" className="mb-4" />
              <p className="text-gray-400 text-sm">
                Transformando dados em decisões estratégicas para o varejo.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-white">Planos</a></li>
                <li><a href="#" className="hover:text-white">Consultoria</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#sobre" className="hover:text-white">Sobre</a></li>
                <li><a href="#depoimentos" className="hover:text-white">Casos de Sucesso</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 Ponto Perfeito. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
