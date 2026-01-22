import { Check, Crown } from 'lucide-react';
import { PLANS, SUBSCRIPTION_TIERS } from '../config/plans';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import SubscriptionBadge from '../components/SubscriptionBadge';

export default function Plans() {
  const { subscription, loading, upgradeTo } = useSubscription();
  const navigate = useNavigate();

  const handleSelectPlan = async (tierKey) => {
    if (tierKey === SUBSCRIPTION_TIERS.FREE) {
      navigate('/dashboard');
      return;
    }

    // TODO: Integrar com gateway de pagamento
    const confirmed = window.confirm(`Fazer upgrade para ${PLANS[tierKey].name}?`);
    if (confirmed) {
      const success = await upgradeTo(tierKey);
      if (success) {
        alert('Upgrade realizado com sucesso!');
        navigate('/dashboard');
      }
    }
  };

  const isCurrentPlan = (tierKey) => {
    return subscription?.tier === tierKey;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o Plano Ideal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Desbloqueie todo o potencial do diagnóstico de varejo com análises avançadas e suporte dedicado
          </p>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrent = isCurrentPlan(key);
            const isPopular = plan.popular;

            return (
              <div
                key={key}
                className={`
                  relative bg-white rounded-2xl shadow-lg p-6 
                  ${isPopular ? 'ring-2 ring-primary scale-105' : 'border-2 border-gray-200'}
                  transition-transform hover:scale-105
                `}
              >
                {/* Badge Popular */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Crown size={16} />
                      Mais Popular
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">/mês</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(key)}
                  disabled={isCurrent || loading}
                  className={`
                    w-full py-3 rounded-lg font-semibold transition-colors
                    ${isCurrent 
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                      : isPopular
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }
                  `}
                >
                  {isCurrent ? 'Plano Atual' : key === SUBSCRIPTION_TIERS.FREE ? 'Começar Grátis' : 'Fazer Upgrade'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Todos os planos incluem acesso ao dashboard e suporte da comunidade
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
