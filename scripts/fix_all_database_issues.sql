-- Script Unificado e Corrigido para Todos os Problemas de Banco de Dados
-- (Usuários, Sugestões de Políticos e Likes do Blog)
-- VERSÃO 2: Corrige erro de chave duplicada no Backfill e melhora RLS para IDs divergentes

-- PARTE 1: CORREÇÃO DA TABELA DE USUÁRIOS E PERMISSÕES

-- 1.1. Garantir que a tabela 'users' existe
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_id UUID REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  name TEXT, 
  avatar_url TEXT,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2. Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1.3. Políticas para users (Atualizadas para suportar id != auth_id)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users 
FOR INSERT WITH CHECK (
  auth.uid() = id OR auth.uid() = auth_id
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
FOR UPDATE USING (
  auth.uid() = id OR auth.uid() = auth_id
);

-- 1.4. Trigger para criar perfil automaticamente quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, auth_id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    auth_id = EXCLUDED.auth_id,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 1.5. BACKFILL: Inserir usuários que já existem no Auth mas não na tabela public.users
-- CORREÇÃO: Verifica se o ID OU o auth_id já existem para evitar erro de chave duplicada
INSERT INTO public.users (id, auth_id, email, full_name, avatar_url)
SELECT 
  id, 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.users.id 
    OR public.users.auth_id = auth.users.id
);


-- PARTE 2: CORREÇÃO DA TABELA DE SUGESTÕES DE POLÍTICOS

-- 2.1. Recriar tabela de sugestões (Drop seguro com CASCADE)
DROP TABLE IF EXISTS politician_suggestions CASCADE;

CREATE TABLE politician_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id UUID NOT NULL, 
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_applied BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2. Habilitar RLS
ALTER TABLE politician_suggestions ENABLE ROW LEVEL SECURITY;

-- 2.3. Políticas de Segurança para Sugestões (Robustas para id != auth.uid())
-- Usuário pode inserir se o user_id corresponder ao seu auth_id na tabela users
CREATE POLICY "Users can insert suggestions" ON politician_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id)
  );

-- Usuário pode ver suas próprias sugestões
CREATE POLICY "Users can view own suggestions" ON politician_suggestions
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id)
  );

-- Admins e Políticos podem ver todas as sugestões
CREATE POLICY "Politicians/Admins view suggestions" ON politician_suggestions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid() -- Alterado para auth_id para garantir match
      AND (u.role = 'admin' OR u.politician_id = politician_suggestions.politician_id)
    )
  );

GRANT ALL ON politician_suggestions TO authenticated;
GRANT ALL ON politician_suggestions TO service_role;


-- PARTE 3: CORREÇÃO DE LIKES NO BLOG

-- 3.1. Adicionar coluna likes na tabela politician_posts se não existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'politician_posts') THEN
        ALTER TABLE politician_posts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
    END IF;
END
$$;

-- 3.2. Criar tabela de likes para controle de unicidade
CREATE TABLE IF NOT EXISTS blog_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Tenta adicionar FK se politician_posts existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'politician_posts') THEN
        BEGIN
            ALTER TABLE blog_post_likes 
            ADD CONSTRAINT fk_blog_post_likes_post 
            FOREIGN KEY (post_id) 
            REFERENCES politician_posts(id) 
            ON DELETE CASCADE;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END
$$;

-- 3.3. Habilitar RLS
ALTER TABLE blog_post_likes ENABLE ROW LEVEL SECURITY;

-- 3.4. Políticas de Segurança para Likes (Robustas para id != auth.uid())
DROP POLICY IF EXISTS "Users can insert their own likes" ON blog_post_likes;
CREATE POLICY "Users can insert their own likes" ON blog_post_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id)
  );

DROP POLICY IF EXISTS "Users can delete their own likes" ON blog_post_likes;
CREATE POLICY "Users can delete their own likes" ON blog_post_likes
  FOR DELETE TO authenticated
  USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id)
  );

DROP POLICY IF EXISTS "Anyone can view likes" ON blog_post_likes;
CREATE POLICY "Anyone can view likes" ON blog_post_likes
  FOR SELECT TO public
  USING (true);

-- 3.5. Função para manter contador atualizado
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'politician_posts') THEN
      IF (TG_OP = 'INSERT') THEN
        UPDATE politician_posts
        SET likes = likes + 1
        WHERE id = NEW.post_id;
      ELSIF (TG_OP = 'DELETE') THEN
        UPDATE politician_posts
        SET likes = GREATEST(0, likes - 1)
        WHERE id = OLD.post_id;
      END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6. Trigger
DROP TRIGGER IF EXISTS on_blog_post_like_change ON blog_post_likes;
CREATE TRIGGER on_blog_post_like_change
  AFTER INSERT OR DELETE ON blog_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

GRANT ALL ON blog_post_likes TO service_role;
GRANT ALL ON blog_post_likes TO authenticated;
GRANT SELECT ON blog_post_likes TO anon;
