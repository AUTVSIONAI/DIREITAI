-- Atualização de políticas RLS para tabela public.affiliates
-- Alinha RLS ao modelo onde affiliates.user_id referencia public.users.id
-- e valida o usuário via users.auth_id = auth.uid()

-- Ativar RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Seleção: usuários autenticados podem ver seu próprio registro de afiliado
CREATE POLICY IF NOT EXISTS "affiliates_select_own_by_auth_id" ON public.affiliates
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.affiliates.user_id
      AND u.auth_id = auth.uid()
  )
);

-- Inserção: usuários autenticados podem inserir seu próprio registro
CREATE POLICY IF NOT EXISTS "affiliates_insert_own_by_auth_id" ON public.affiliates
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.affiliates.user_id
      AND u.auth_id = auth.uid()
  )
);

-- Atualização: usuários autenticados podem atualizar seu próprio registro
CREATE POLICY IF NOT EXISTS "affiliates_update_own_by_auth_id" ON public.affiliates
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.affiliates.user_id
      AND u.auth_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.affiliates.user_id
      AND u.auth_id = auth.uid()
  )
);

-- Políticas Admin (opcional): permitir admins gerenciarem todos os registros
CREATE POLICY IF NOT EXISTS "affiliates_admin_manage_all" ON public.affiliates
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND COALESCE(u.is_admin, false) = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND COALESCE(u.is_admin, false) = true
  )
);

-- Observações:
-- 1) As políticas acima assumem que public.users possui a coluna auth_id (UUID) do usuário do Supabase Auth.
-- 2) A coluna affiliates.user_id deve referenciar public.users.id (tipo compatível com users.id).
-- 3) Se desejar permitir leitura pública dos afiliados, adicione uma política SELECT para o papel "anon" com critérios apropriados.
-- 4) Caso já existam políticas conflitantes, considere removê-las manualmente no Console do Supabase.

-- Dica de verificação rápida (executar no SQL Editor):
-- SELECT a.* FROM public.affiliates a
-- JOIN public.users u ON u.id = a.user_id
-- WHERE u.auth_id = auth.uid();