
-- SCRIPT FINAL DE CORREÇÃO (VERSÃO 3 - DEFINITIVA)
-- Este script limpa dados inconsistentes antes de aplicar as restrições.

-- 1. Limpeza de Dados Órfãos (CRUCIAL PARA EVITAR ERRO 23503)
-- Remove avaliações de usuários que não existem mais na tabela users
DELETE FROM public.politician_ratings
WHERE user_id NOT IN (SELECT id FROM public.users);

-- Remove likes de usuários que não existem mais
DELETE FROM public.blog_post_likes
WHERE user_id NOT IN (SELECT id FROM public.users);

-- Remove comentários de usuários que não existem mais
DELETE FROM public.blog_post_comments
WHERE user_id NOT IN (SELECT id FROM public.users);

-- Remove sugestões de usuários que não existem mais
DELETE FROM public.politician_suggestions
WHERE user_id NOT IN (SELECT id FROM public.users);


-- 2. Corrigir Relacionamentos (Foreign Keys)

-- Tabela politician_ratings
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'politician_ratings') THEN
    -- Remove constraints antigas/incorretas
    ALTER TABLE public.politician_ratings DROP CONSTRAINT IF EXISTS politician_ratings_user_id_fkey;
    ALTER TABLE public.politician_ratings DROP CONSTRAINT IF EXISTS fk_user;
    
    -- Adiciona a constraint correta
    ALTER TABLE public.politician_ratings
    ADD CONSTRAINT politician_ratings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Tabela blog_post_likes
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_post_likes') THEN
    ALTER TABLE public.blog_post_likes DROP CONSTRAINT IF EXISTS blog_post_likes_user_id_fkey;
    
    ALTER TABLE public.blog_post_likes
    ADD CONSTRAINT blog_post_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Tabela blog_post_comments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_post_comments') THEN
    ALTER TABLE public.blog_post_comments DROP CONSTRAINT IF EXISTS blog_post_comments_user_id_fkey;
    
    ALTER TABLE public.blog_post_comments
    ADD CONSTRAINT blog_post_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Tabela politician_suggestions (se existir)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'politician_suggestions') THEN
    ALTER TABLE public.politician_suggestions DROP CONSTRAINT IF EXISTS politician_suggestions_user_id_fkey;
    
    ALTER TABLE public.politician_suggestions
    ADD CONSTRAINT politician_suggestions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;


-- 3. Garantir Permissões (RLS)

-- Permissões para USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all profiles" ON public.users;
CREATE POLICY "Users can read all profiles" ON public.users 
FOR SELECT TO authenticated, anon 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

-- Permissões para BLOG POST LIKES
CREATE TABLE IF NOT EXISTS public.blog_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read likes" ON public.blog_post_likes;
CREATE POLICY "Read likes" ON public.blog_post_likes 
FOR SELECT TO authenticated, anon 
USING (true);

DROP POLICY IF EXISTS "Insert likes" ON public.blog_post_likes;
CREATE POLICY "Insert likes" ON public.blog_post_likes 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete likes" ON public.blog_post_likes;
CREATE POLICY "Delete likes" ON public.blog_post_likes 
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Permissões para POLITICIAN RATINGS
ALTER TABLE public.politician_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read ratings" ON public.politician_ratings;
CREATE POLICY "Read ratings" ON public.politician_ratings 
FOR SELECT TO authenticated, anon 
USING (true);

DROP POLICY IF EXISTS "Insert ratings" ON public.politician_ratings;
CREATE POLICY "Insert ratings" ON public.politician_ratings 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update ratings" ON public.politician_ratings;
CREATE POLICY "Update ratings" ON public.politician_ratings 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Permissões para POLITICIAN SUGGESTIONS
CREATE TABLE IF NOT EXISTS public.politician_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    politician_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.politician_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert suggestions" ON public.politician_suggestions;
CREATE POLICY "Users can insert suggestions" ON public.politician_suggestions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own suggestions" ON public.politician_suggestions;
CREATE POLICY "Users can read own suggestions" ON public.politician_suggestions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);


-- 4. Trigger para atualizar likes_count em blog_posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.blog_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.blog_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.blog_post_likes;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
    CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON public.blog_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();
  END IF;
END $$;
