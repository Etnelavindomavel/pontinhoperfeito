-- Adicionar colunas de assinatura na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'essencial', 'pro', 'consultoria')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trial')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS uploads_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uploads_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Função para resetar contadores mensais
CREATE OR REPLACE FUNCTION reset_monthly_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET uploads_this_month = 0,
      uploads_reset_at = NOW() + INTERVAL '1 month'
  WHERE uploads_reset_at < NOW();
END;
$$;

-- Comentários para documentação
COMMENT ON COLUMN users.subscription_tier IS 'Tier da assinatura: free, essencial, pro, consultoria';
COMMENT ON COLUMN users.subscription_status IS 'Status da assinatura: active, canceled, expired, trial';
COMMENT ON COLUMN users.subscription_expires_at IS 'Data de expiração da assinatura';
COMMENT ON COLUMN users.uploads_this_month IS 'Contador de uploads no mês atual';
COMMENT ON COLUMN users.uploads_reset_at IS 'Data do próximo reset do contador';
