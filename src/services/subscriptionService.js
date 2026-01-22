import { supabase } from '../lib/supabase';
import { SUBSCRIPTION_TIERS, getPlanByTier } from '../config/plans';

export const subscriptionService = {
  // Buscar assinatura do usuário
  async getUserSubscription(userId) {
    if (!supabase) {
      // Retornar plano gratuito padrão se Supabase não estiver configurado
      return {
        tier: SUBSCRIPTION_TIERS.FREE,
        status: 'active',
        expiresAt: null,
        uploadsThisMonth: 0,
        uploadsResetAt: null,
        plan: getPlanByTier(SUBSCRIPTION_TIERS.FREE)
      }
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, subscription_expires_at, uploads_this_month, uploads_reset_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        tier: data.subscription_tier || SUBSCRIPTION_TIERS.FREE,
        status: data.subscription_status || 'active',
        expiresAt: data.subscription_expires_at,
        uploadsThisMonth: data.uploads_this_month || 0,
        uploadsResetAt: data.uploads_reset_at,
        plan: getPlanByTier(data.subscription_tier || SUBSCRIPTION_TIERS.FREE)
      };
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }
  },

  // Verificar se pode fazer upload
  async canUpload(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      const { plan, uploadsThisMonth } = subscription;

      // Plano com uploads ilimitados
      if (plan.uploads_per_month === -1) return true;

      // Verificar limite
      return uploadsThisMonth < plan.uploads_per_month;
    } catch (error) {
      console.error('Erro ao verificar limite de upload:', error);
      return false;
    }
  },

  // Incrementar contador de uploads
  async incrementUploadCount(userId) {
    if (!supabase) {
      return true
    }
    try {
      const { data, error } = await supabase.rpc('increment_upload_count', {
        user_id: userId
      });

      if (error) {
        // Se a função RPC não existir, fazer update direto
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            uploads_this_month: supabase.raw('uploads_this_month + 1')
          })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Erro ao incrementar contador:', error);
      return false;
    }
  },

  // Atualizar tier da assinatura
  async updateSubscriptionTier(userId, newTier) {
    if (!supabase) {
      return true
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: newTier,
          subscription_status: 'active',
          subscription_expires_at: null // ou calcular data de expiração
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tier:', error);
      return false;
    }
  },

  // Verificar se tem acesso a análise específica
  canAccessAnalysis(subscription, analysisType) {
    if (!subscription || !subscription.plan) return false;
    return subscription.plan.analyses.includes(analysisType);
  }
};
