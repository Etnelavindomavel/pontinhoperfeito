export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  ESSENCIAL: 'essencial',
  PRO: 'pro',
  CONSULTORIA: 'consultoria'
};

export const PLANS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    priceLabel: 'Grátis',
    uploads_per_month: 3,
    features: [
      '3 uploads por mês',
      'Análise básica',
      'Dashboard padrão',
      'Suporte por comunidade'
    ],
    analyses: ['basica'],
    support: 'comunidade',
    color: 'gray',
    badge: 'Free'
  },
  
  [SUBSCRIPTION_TIERS.ESSENCIAL]: {
    id: 'essencial',
    name: 'Essencial',
    price: 47,
    priceLabel: 'R$ 47/mês',
    uploads_per_month: 10,
    features: [
      '10 uploads por mês',
      'Análise básica e avançada',
      'Relatórios PDF',
      'Suporte por email'
    ],
    analyses: ['basica', 'avancada'],
    support: 'email',
    color: 'blue',
    badge: 'Essencial',
    popular: false
  },
  
  [SUBSCRIPTION_TIERS.PRO]: {
    id: 'pro',
    name: 'Pro',
    price: 97,
    priceLabel: 'R$ 97/mês',
    uploads_per_month: 50,
    features: [
      '50 uploads por mês',
      'Todas as análises',
      'Análise preditiva',
      'Exportação avançada',
      'Suporte prioritário'
    ],
    analyses: ['basica', 'avancada', 'preditiva'],
    support: 'prioritario',
    color: 'purple',
    badge: 'Pro',
    popular: true
  },
  
  [SUBSCRIPTION_TIERS.CONSULTORIA]: {
    id: 'consultoria',
    name: 'Consultoria',
    price: 297,
    priceLabel: 'R$ 297/mês',
    uploads_per_month: -1, // ilimitado
    features: [
      'Uploads ilimitados',
      'Todas as análises',
      'Análise personalizada',
      'Consultoria dedicada',
      'Suporte prioritário 24/7',
      'Integração customizada'
    ],
    analyses: ['basica', 'avancada', 'preditiva', 'personalizada'],
    support: 'dedicado',
    color: 'yellow',
    badge: 'Consultoria',
    popular: false
  }
};

export const PLAN_COLORS = {
  gray: 'bg-gray-700 text-white border-gray-600 font-semibold shadow-sm',
  blue: 'bg-blue-600 text-white border-blue-700 font-semibold shadow-sm',
  purple: 'bg-purple-600 text-white border-purple-700 font-semibold shadow-sm',
  yellow: 'bg-yellow-600 text-white border-yellow-700 font-semibold shadow-sm'
};

export const getPlanByTier = (tier) => {
  return PLANS[tier] || PLANS[SUBSCRIPTION_TIERS.FREE];
};

export const canAccessFeature = (userTier, requiredTier) => {
  const tiers = [
    SUBSCRIPTION_TIERS.FREE,
    SUBSCRIPTION_TIERS.ESSENCIAL,
    SUBSCRIPTION_TIERS.PRO,
    SUBSCRIPTION_TIERS.CONSULTORIA
  ];
  
  const userIndex = tiers.indexOf(userTier);
  const requiredIndex = tiers.indexOf(requiredTier);
  
  return userIndex >= requiredIndex;
};
