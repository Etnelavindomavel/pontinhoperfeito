-- Função para incrementar contador de uploads
CREATE OR REPLACE FUNCTION increment_upload_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET uploads_this_month = uploads_this_month + 1
  WHERE id = user_id;
END;
$$;
