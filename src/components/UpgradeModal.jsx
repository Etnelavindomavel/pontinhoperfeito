import { X, Sparkles, Check } from 'lucide-react';
import { PLANS, SUBSCRIPTION_TIERS } from '../config/plans';

export default function UpgradeModal({ isOpen, onClose, currentTier, requiredTier, feature }) {
  if (!isOpen) return null;

  const currentPlan = PLANS[currentTier];
  const requiredPlan = PLANS[requiredTier];
  const recommendedTier = requiredTier === SUBSCRIPTION_TIERS.ESSENCIAL ? SUBSCRIPTION_TIERS.PRO : requiredTier;
  const recommendedPlan = PLANS[recommendedTier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <Sparkles size={32} />
            <div>
              <h2 className="text-2xl font-bold">Upgrade Necessário</h2>
              <p className="text-white/90 mt-1">Desbloqueie recursos avançados</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>{feature}</strong> está disponível apenas para planos {requiredPlan.name} ou superior.
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Seu plano atual: <strong>{currentPlan.name}</strong>
            </p>
          </div>

          {/* Plano Recomendado */}
          <div className="border-2 border-primary rounded-xl p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{recommendedPlan.name}</h3>
                <p className="text-3xl font-bold text-primary mt-1">{recommendedPlan.priceLabel}</p>
              </div>
              {recommendedPlan.popular && (
                <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </span>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {recommendedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                // TODO: Implementar integração com gateway de pagamento
                alert('Em breve: Integração com sistema de pagamento!');
                onClose();
              }}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Fazer Upgrade Agora
            </button>
          </div>

          {/* Ver Todos os Planos */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                window.location.href = '/plans';
              }}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Ver todos os planos →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
