
-- SCRIPT FINAL PARA CORREÇÃO DE PERMISSÕES E TABELAS
-- Execute este script no SQL Editor do Supabase se ainda houver problemas de permissão.

-- 1. Garantir permissões na tabela de usuários
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read all profiles" ON public.users;
CREATE POLICY "Users can read all profiles" ON public.users 
FOR SELECT TO authenticated, anon 
USING (true);

-- 2. Garantir tabela e permissões de Likes do Blog
CREATE TABLE IF NOT EXISTS public.blog_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert likes" ON public.blog_post_likes;
CREATE POLICY "Insert likes" ON public.blog_post_likes 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete likes" ON public.blog_post_likes;
CREATE POLICY "Delete likes" ON public.blog_post_likes 
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Read likes" ON public.blog_post_likes;
CREATE POLICY "Read likes" ON public.blog_post_likes 
FOR SELECT TO authenticated, anon 
USING (true);

-- 3. Garantir permissões de Avaliações de Políticos
ALTER TABLE public.politician_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert ratings" ON public.politician_ratings;
CREATE POLICY "Insert ratings" ON public.politician_ratings 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update ratings" ON public.politician_ratings;
CREATE POLICY "Update ratings" ON public.politician_ratings 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete ratings" ON public.politician_ratings;
CREATE POLICY "Delete ratings" ON public.politician_ratings 
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Read ratings" ON public.politician_ratings;
CREATE POLICY "Read ratings" ON public.politician_ratings 
FOR SELECT TO authenticated, anon 
USING (true);
