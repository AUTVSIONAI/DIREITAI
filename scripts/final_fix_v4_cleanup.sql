-- Script de Limpeza e Correção Definitiva do Banco de Dados
-- Este script resolve erros de Foreign Key (23503), conflitos (409) e permissões.

BEGIN;

-- 1. Remover constraints antigas para recriar corretamente (evita erros se já existirem)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'politician_ratings_user_id_fkey') THEN
        ALTER TABLE public.politician_ratings DROP CONSTRAINT politician_ratings_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'blog_post_likes_user_id_fkey') THEN
        ALTER TABLE public.blog_post_likes DROP CONSTRAINT blog_post_likes_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'blog_post_comments_user_id_fkey') THEN
        ALTER TABLE public.blog_post_comments DROP CONSTRAINT blog_post_comments_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'politician_suggestions_user_id_fkey') THEN
        ALTER TABLE public.politician_suggestions DROP CONSTRAINT politician_suggestions_user_id_fkey;
    END IF;
END $$;

-- 2. Limpeza de Dados Órfãos (CRUCIAL PARA CORRIGIR O ERRO 23503)
-- Remove registros que apontam para usuários que não existem na tabela public.users
DELETE FROM public.politician_ratings WHERE user_id NOT IN (SELECT id FROM public.users);
DELETE FROM public.blog_post_likes WHERE user_id NOT IN (SELECT id FROM public.users);
DELETE FROM public.blog_post_comments WHERE user_id NOT IN (SELECT id FROM public.users);
DELETE FROM public.politician_suggestions WHERE user_id NOT IN (SELECT id FROM public.users);

-- 3. Recriar Constraints de Foreign Key
ALTER TABLE public.politician_ratings 
    ADD CONSTRAINT politician_ratings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.blog_post_likes 
    ADD CONSTRAINT blog_post_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.blog_post_comments 
    ADD CONSTRAINT blog_post_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.politician_suggestions 
    ADD CONSTRAINT politician_suggestions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Garantir Unique Constraints (Evita duplicidade)
-- Remove duplicatas antes de criar a constraint unique (se houver)
DELETE FROM public.politician_ratings a USING public.politician_ratings b
WHERE a.id < b.id AND a.politician_id = b.politician_id AND a.user_id = b.user_id;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'politician_ratings_politician_id_user_id_key') THEN
        ALTER TABLE public.politician_ratings ADD CONSTRAINT politician_ratings_politician_id_user_id_key UNIQUE (politician_id, user_id);
    END IF;
END $$;

DELETE FROM public.blog_post_likes a USING public.blog_post_likes b
WHERE a.id < b.id AND a.post_id = b.post_id AND a.user_id = b.user_id;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'blog_post_likes_post_id_user_id_key') THEN
        ALTER TABLE public.blog_post_likes ADD CONSTRAINT blog_post_likes_post_id_user_id_key UNIQUE (post_id, user_id);
    END IF;
END $$;

-- 5. Atualizar Policies RLS (Permissões)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politician_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop policies antigas para garantir limpeza
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.politician_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.politician_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.politician_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.politician_ratings;

-- Criar novas policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_id OR auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id OR auth.uid() = id);

CREATE POLICY "Ratings are viewable by everyone" ON public.politician_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own ratings" ON public.politician_ratings FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own ratings" ON public.politician_ratings FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can delete their own ratings" ON public.politician_ratings FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

-- Policies para Blog Likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.blog_post_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.blog_post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.blog_post_likes;

CREATE POLICY "Likes are viewable by everyone" ON public.blog_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.blog_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can delete their own likes" ON public.blog_post_likes FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

-- Policies para Blog Comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.blog_post_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.blog_post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.blog_post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.blog_post_comments;

CREATE POLICY "Comments are viewable by everyone" ON public.blog_post_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.blog_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own comments" ON public.blog_post_comments FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can delete their own comments" ON public.blog_post_comments FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

-- Policies para Politician Suggestions
DROP POLICY IF EXISTS "Suggestions are viewable by everyone" ON public.politician_suggestions;
DROP POLICY IF EXISTS "Users can insert their own suggestions" ON public.politician_suggestions;

CREATE POLICY "Suggestions are viewable by everyone" ON public.politician_suggestions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own suggestions" ON public.politician_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));

-- 6. Garantir permissões de acesso
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.politician_ratings TO service_role;
GRANT ALL ON public.blog_post_likes TO service_role;
GRANT ALL ON public.blog_post_comments TO service_role;
GRANT ALL ON public.politician_suggestions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.politician_ratings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_post_likes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_post_comments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.politician_suggestions TO anon, authenticated;

COMMIT;
