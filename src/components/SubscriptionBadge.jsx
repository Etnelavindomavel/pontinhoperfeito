import { PLAN_COLORS } from '../config/plans';

export default function SubscriptionBadge({ plan, size = 'md' }) {
  if (!plan) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${PLAN_COLORS[plan.color]}
        ${sizeClasses[size]}
      `}
    >
      {plan.badge}
    </span>
  );
}
