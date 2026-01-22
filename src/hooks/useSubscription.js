import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/ClerkAuthContext';
import { subscriptionService } from '../services/subscriptionService';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getUserSubscription(user.id);
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const canUpload = async () => {
    if (!user?.id) return false;
    return await subscriptionService.canUpload(user.id);
  };

  const canAccessAnalysis = (analysisType) => {
    if (!subscription) return false;
    return subscriptionService.canAccessAnalysis(subscription, analysisType);
  };

  const incrementUpload = async () => {
    if (!user?.id) return false;
    const success = await subscriptionService.incrementUploadCount(user.id);
    if (success) {
      await loadSubscription(); // Recarregar para atualizar contador
    }
    return success;
  };

  const upgradeTo = async (newTier) => {
    if (!user?.id) return false;
    const success = await subscriptionService.updateSubscriptionTier(user.id, newTier);
    if (success) {
      await loadSubscription(); // Recarregar assinatura
    }
    return success;
  };

  return {
    subscription,
    loading,
    canUpload,
    canAccessAnalysis,
    incrementUpload,
    upgradeTo,
    refresh: loadSubscription
  };
};
