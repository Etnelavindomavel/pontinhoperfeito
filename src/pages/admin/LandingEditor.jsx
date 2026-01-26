import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, RefreshCw } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/common/ToastContainer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { setSecureItem, getSecureItem, removeSecureItem } from '@/utils/secureStorage'

export default function LandingEditor() {
  const [content, setContent] = useState(null)
  const [activeTab, setActiveTab] = useState('hero')
  const [saved, setSaved] = useState(false)
  const { toasts, showToast, removeToast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    loadContent()
  }, [])

  function loadContent() {
    try {
      const saved = getSecureItem('pontoPerfeito_landingContent')
      if (saved) {
        setContent(saved)
      }
    } catch (error) {
      console.error('Erro ao carregar:', error)
    }
  }

  function handleSave() {
    try {
      setSecureItem('pontoPerfeito_landingContent', content)
      setSaved(true)
      showToast('Conteúdo salvo com sucesso', 'success')
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showToast('Erro ao salvar. Tente novamente.', 'error')
    }
  }

  function handleReset() {
    setConfirmDialog({
      isOpen: true,
      title: 'Restaurar Padrão',
      message: 'Tem certeza? Isso vai restaurar o conteúdo padrão e todas as alterações serão perdidas.',
      confirmLabel: 'Sim, restaurar',
      cancelLabel: 'Cancelar',
      variant: 'warning',
      onConfirm: () => {
        removeSecureItem('pontoPerfeito_landingContent')
        showToast('Conteúdo restaurado com sucesso', 'success')
        setConfirmDialog(null)
        setTimeout(() => window.location.reload(), 1000)
      },
    })
  }

  function updateHero(field, value) {
    setContent({
      ...content,
      hero: { ...content.hero, [field]: value }
    })
  }

  function updateAbout(field, value) {
    setContent({
      ...content,
      about: { ...content.about, [field]: value }
    })
  }

  function updateStat(index, field, value) {
    const newStats = [...content.stats]
    newStats[index] = { ...newStats[index], [field]: value }
    setContent({ ...content, stats: newStats })
  }

  function updatePlan(index, field, value) {
    const newPlans = [...content.plans]
    newPlans[index] = { ...newPlans[index], [field]: value }
    setContent({ ...content, plans: newPlans })
  }

  function updatePlanFeature(planIndex, featureIndex, value) {
    const newPlans = [...content.plans]
    newPlans[planIndex].features[featureIndex] = value
    setContent({ ...content, plans: newPlans })
  }

  function addPlanFeature(planIndex) {
    const newPlans = [...content.plans]
    newPlans[planIndex].features.push('Nova funcionalidade')
    setContent({ ...content, plans: newPlans })
  }

  function removePlanFeature(planIndex, featureIndex) {
    const newPlans = [...content.plans]
    newPlans[planIndex].features.splice(featureIndex, 1)
    setContent({ ...content, plans: newPlans })
  }

  function updateTestimonial(index, field, value) {
    const newTestimonials = [...content.testimonials]
    newTestimonials[index] = { ...newTestimonials[index], [field]: value }
    setContent({ ...content, testimonials: newTestimonials })
  }

  function addTestimonial() {
    const newTestimonials = [...content.testimonials]
    newTestimonials.push({
      name: 'Nome',
      role: 'Cargo',
      company: 'Empresa - Cidade/UF',
      content: 'Depoimento aqui...',
      rating: 5
    })
    setContent({ ...content, testimonials: newTestimonials })
  }

  function removeTestimonial(index) {
    const newTestimonials = [...content.testimonials]
    newTestimonials.splice(index, 1)
    setContent({ ...content, testimonials: newTestimonials })
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando editor...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'hero', name: 'Hero' },
    { id: 'stats', name: 'Estatísticas' },
    { id: 'about', name: 'Sobre' },
    { id: 'plans', name: 'Planos' },
    { id: 'testimonials', name: 'Depoimentos' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Editor da Landing Page</h1>
              <p className="text-sm text-gray-600">Personalize o conteúdo da página inicial</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleReset}
              >
                <RefreshCw size={16} />
                <span>Restaurar Padrão</span>
              </Button>
              <Button
                onClick={handleSave}
                className={saved ? 'bg-green-600' : ''}
              >
                <Save size={16} />
                <span>{saved ? 'Salvo!' : 'Salvar Alterações'}</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-secondary-600 text-secondary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HERO TAB */}
        {activeTab === 'hero' && (
          <Card>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge (topo)
                </label>
                <input
                  type="text"
                  value={content.hero.badge}
                  onChange={(e) => updateHero('badge', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título Principal
                </label>
                <input
                  type="text"
                  value={content.hero.title}
                  onChange={(e) => updateHero('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título em Destaque (parte colorida)
                </label>
                <input
                  type="text"
                  value={content.hero.titleHighlight}
                  onChange={(e) => updateHero('titleHighlight', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtítulo
                </label>
                <textarea
                  value={content.hero.subtitle}
                  onChange={(e) => updateHero('subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Botão Principal
                  </label>
                  <input
                    type="text"
                    value={content.hero.ctaPrimary}
                    onChange={(e) => updateHero('ctaPrimary', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Botão Secundário
                  </label>
                  <input
                    type="text"
                    value={content.hero.ctaSecondary}
                    onChange={(e) => updateHero('ctaSecondary', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.stats.map((stat, index) => (
              <Card key={index}>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Estatística {index + 1}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor
                    </label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStat(index, 'value', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legenda
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <Card>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Seção
                </label>
                <input
                  type="text"
                  value={content.about.title}
                  onChange={(e) => updateAbout('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parágrafo 1
                </label>
                <textarea
                  value={content.about.paragraph1}
                  onChange={(e) => updateAbout('paragraph1', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parágrafo 2
                </label>
                <textarea
                  value={content.about.paragraph2}
                  onChange={(e) => updateAbout('paragraph2', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
              </div>
            </div>
          </Card>
        )}

        {/* PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {content.plans.map((plan, planIndex) => (
              <Card key={planIndex}>
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                  Plano {planIndex + 1}: {plan.name}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Plano
                      </label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => updatePlan(planIndex, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preço
                      </label>
                      <input
                        type="text"
                        value={plan.price}
                        onChange={(e) => updatePlan(planIndex, 'price', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Período
                      </label>
                      <input
                        type="text"
                        value={plan.period}
                        onChange={(e) => updatePlan(planIndex, 'period', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="Ex: /mês"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Botão CTA
                      </label>
                      <input
                        type="text"
                        value={plan.cta}
                        onChange={(e) => updatePlan(planIndex, 'cta', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={plan.description}
                      onChange={(e) => updatePlan(planIndex, 'description', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Funcionalidades
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addPlanFeature(planIndex)}
                      >
                        <Plus size={14} />
                        <span>Adicionar</span>
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updatePlanFeature(planIndex, featureIndex, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => removePlanFeature(planIndex, featureIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={plan.highlight}
                      onChange={(e) => updatePlan(planIndex, 'highlight', e.target.checked)}
                      className="w-4 h-4 text-secondary-600 border-gray-300 rounded focus:ring-secondary-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Destacar este plano (recomendado)
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* TESTIMONIALS TAB */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Depoimentos ({content.testimonials.length})
              </h2>
              <Button onClick={addTestimonial}>
                <Plus size={16} />
                <span>Adicionar Depoimento</span>
              </Button>
            </div>

            {content.testimonials.map((testimonial, index) => (
              <Card key={index}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Depoimento {index + 1}
                  </h3>
                  <button
                    onClick={() => removeTestimonial(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={testimonial.name}
                        onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cargo
                      </label>
                      <input
                        type="text"
                        value={testimonial.role}
                        onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa - Cidade/UF
                    </label>
                    <input
                      type="text"
                      value={testimonial.company}
                      onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Depoimento
                    </label>
                    <textarea
                      value={testimonial.content}
                      onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avaliação (estrelas)
                    </label>
                    <select
                      value={testimonial.rating}
                      onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    >
                      <option value={5}>5 estrelas</option>
                      <option value={4}>4 estrelas</option>
                      <option value={3}>3 estrelas</option>
                      <option value={2}>2 estrelas</option>
                      <option value={1}>1 estrela</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          isOpen={confirmDialog.isOpen}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
