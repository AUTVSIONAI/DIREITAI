-- Criar sistema de visualizações e compartilhamentos para o blog

-- 1. Adicionar colunas de contadores na tabela politician_posts
ALTER TABLE politician_posts 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- 2. Criar tabela para rastrear visualizações
CREATE TABLE IF NOT EXISTS blog_post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES politician_posts(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela para rastrear compartilhamentos
CREATE TABLE IF NOT EXISTS blog_post_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES politician_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform VARCHAR(50) DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_ip_created ON blog_post_views(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_post_shares_post_id ON blog_post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_shares_user_id ON blog_post_shares(user_id);

-- 5. Criar função RPC para incrementar visualizações
CREATE OR REPLACE FUNCTION increment_views_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE politician_posts 
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$;

-- 6. Criar função RPC para incrementar compartilhamentos
CREATE OR REPLACE FUNCTION increment_shares_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE politician_posts 
  SET shares_count = COALESCE(shares_count, 0) + 1
  WHERE id = post_id;
END;
$$;

-- 7. Criar políticas RLS para as novas tabelas

-- Habilitar RLS nas tabelas
ALTER TABLE blog_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_shares ENABLE ROW LEVEL SECURITY;

-- Políticas para blog_post_views
CREATE POLICY "Allow public to insert views" ON blog_post_views
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read views" ON blog_post_views
  FOR SELECT TO public
  USING (true);

-- Políticas para blog_post_shares
CREATE POLICY "Allow authenticated users to insert shares" ON blog_post_shares
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public to read shares" ON blog_post_shares
  FOR SELECT TO public
  USING (true);

-- 8. Inicializar contadores existentes (opcional)
-- Atualizar contadores baseado nos dados existentes
UPDATE politician_posts 
SET views = 0, shares_count = 0 
WHERE views IS NULL OR shares_count IS NULL;

-- Comentários para documentação
COMMENT ON TABLE blog_post_views IS 'Tabela para rastrear visualizações de posts do blog';
COMMENT ON TABLE blog_post_shares IS 'Tabela para rastrear compartilhamentos de posts do blog';
COMMENT ON FUNCTION increment_views_count(UUID) IS 'Função para incrementar contador de visualizações';
COMMENT ON FUNCTION increment_shares_count(UUID) IS 'Função para incrementar contador de compartilhamentos';