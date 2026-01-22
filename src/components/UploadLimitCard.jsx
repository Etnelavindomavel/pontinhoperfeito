import { Upload, AlertCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export default function UploadLimitCard() {
  const { subscription, loading } = useSubscription();

  if (loading || !subscription) return null;

  const { plan, uploadsThisMonth } = subscription;
  const limit = plan.uploads_per_month;
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : (uploadsThisMonth / limit) * 100;
  const remaining = isUnlimited ? '∞' : limit - uploadsThisMonth;
  const isNearLimit = percentage >= 80;
  const isAtLimit = uploadsThisMonth >= limit && !isUnlimited;

  return (
    <div className={`
      bg-white rounded-lg border-2 p-4
      ${isAtLimit ? 'border-red-300 bg-red-50' : isNearLimit ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Upload size={20} className={isAtLimit ? 'text-red-600' : 'text-gray-600'} />
          <h3 className="font-semibold text-gray-900">Uploads este mês</h3>
        </div>
        <span className={`text-sm font-medium ${isAtLimit ? 'text-red-600' : 'text-gray-600'}`}>
          {uploadsThisMonth} / {isUnlimited ? '∞' : limit}
        </span>
      </div>

      {!isUnlimited && (
        <div className="mb-3">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {isAtLimit ? (
        <div className="flex items-start gap-2 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Limite atingido!</p>
            <p className="text-red-600">Faça upgrade para continuar usando o diagnóstico.</p>
          </div>
        </div>
      ) : isNearLimit ? (
        <p className="text-yellow-700 text-sm">
          Você tem {remaining} upload{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''} este mês.
        </p>
      ) : (
        <p className="text-gray-600 text-sm">
          {isUnlimited ? 'Uploads ilimitados' : `${remaining} upload${remaining > 1 ? 's' : ''} disponíve${remaining > 1 ? 'is' : 'l'}`}
        </p>
      )}
    </div>
  );
}
