-- Script Final de Correção de Banco de Dados
-- Este script garante que todas as funcionalidades corrigidas no frontend tenham suporte no backend.

-- 1. Garantir leitura pública de avaliações (ratings)
-- Necessário para exibir estrelas na lista de políticos
ALTER TABLE IF EXISTS public.politician_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public ratings access" ON public.politician_ratings;
CREATE POLICY "Public ratings access" ON public.politician_ratings
FOR SELECT TO public
USING (true);

-- 2. Garantir tabela de likes do blog e trigger
-- Verifica tanto 'blog_posts' quanto 'politician_posts'

-- Tabela de likes (se não existir)
CREATE TABLE IF NOT EXISTS public.blog_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL, -- Removida FK rígida para suportar múltiplas tabelas de post se necessário, ou manteremos flexível
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- RLS para likes
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view likes" ON public.blog_post_likes;
CREATE POLICY "Public view likes" ON public.blog_post_likes FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Auth insert likes" ON public.blog_post_likes;
CREATE POLICY "Auth insert likes" ON public.blog_post_likes FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

DROP POLICY IF EXISTS "Auth delete likes" ON public.blog_post_likes;
CREATE POLICY "Auth delete likes" ON public.blog_post_likes FOR DELETE TO authenticated 
USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

-- Trigger para atualizar contagem (suporta blog_posts e politician_posts)
CREATE OR REPLACE FUNCTION update_any_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Tenta atualizar blog_posts
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
      IF (TG_OP = 'INSERT') THEN
        UPDATE blog_posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
      ELSIF (TG_OP = 'DELETE') THEN
        UPDATE blog_posts SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.post_id;
      END IF;
  END IF;

  -- Tenta atualizar politician_posts
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'politician_posts') THEN
      IF (TG_OP = 'INSERT') THEN
        UPDATE politician_posts SET likes = COALESCE(likes, 0) + 1 WHERE id = NEW.post_id;
      ELSIF (TG_OP = 'DELETE') THEN
        UPDATE politician_posts SET likes = GREATEST(0, COALESCE(likes, 0) - 1) WHERE id = OLD.post_id;
      END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_likes ON public.blog_post_likes;
CREATE TRIGGER tr_update_likes
AFTER INSERT OR DELETE ON public.blog_post_likes
FOR EACH ROW EXECUTE FUNCTION update_any_post_likes_count();

-- 3. Garantir coluna likes_count na tabela blog_posts se ela existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
        ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
    END IF;
END
$$;

-- 4. Permissões para comentários (blog_post_comments)
-- Necessário para fallback funcionar
CREATE TABLE IF NOT EXISTS public.blog_post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL,
    user_id UUID REFERENCES public.users(id),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.blog_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view comments" ON public.blog_post_comments;
CREATE POLICY "Public view comments" ON public.blog_post_comments FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Auth insert comments" ON public.blog_post_comments;
CREATE POLICY "Auth insert comments" ON public.blog_post_comments FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
