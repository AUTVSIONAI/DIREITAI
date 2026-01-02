require('dotenv').config({ path: 'C:\\DIREITAI\\.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Tentar obter a chave de serviço (admin) ou anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Diagnóstico de Ambiente ---');
console.log('URL:', supabaseUrl ? 'Definida' : 'Indefinida');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Presente' : 'Ausente');
console.log('Anon Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'Presente' : 'Ausente');
console.log('Usando chave:', isServiceRole ? 'SERVICE_ROLE (Admin)' : 'ANON (Pública/Auth)');

if (!supabaseUrl || !supabaseKey) {
    console.error('ERRO: Variáveis de ambiente ausentes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('\n--- Diagnóstico de Analytics e Likes ---');

    // 1. Verificar Blog Post Likes
    console.log('\n1. Testando blog_post_likes...');
    try {
        const { data, error } = await supabase.from('blog_post_likes').select('*').limit(1);
        if (error) {
            console.error('Erro ao ler blog_post_likes:', error);
        } else {
            console.log('Leitura blog_post_likes OK. Linhas:', data.length);
        }
    } catch (e) {
        console.error('Exceção em blog_post_likes:', e);
    }

    // 2. Verificar Notification Stats
    console.log('\n2. Testando notification_stats...');
    try {
        const { data, error } = await supabase.from('notification_stats').select('*').limit(1);
        if (error) {
            console.error('Erro ao ler notification_stats:', error);
        } else {
            console.log('Leitura notification_stats OK. Linhas:', data.length);
        }
    } catch (e) {
        console.error('Exceção em notification_stats:', e);
    }

    // 3. Verificar Announcement Views (Inserção)
    console.log('\n3. Testando announcement_views (Inserção)...');
    try {
        // Buscar um anúncio existente primeiro
        const { data: anns } = await supabase.from('announcements').select('id, title, is_archived').limit(1);
        
        if (anns && anns.length > 0) {
            const annId = anns[0].id;
            console.log('Anúncio encontrado:', annId, 'Arquivado:', anns[0].is_archived);

            // Tentar inserir view
            const viewData = {
                announcement_id: annId,
                // user_id: precisa de um ID válido se tiver FK. Se for anon, pode ser null dependendo da schema.
                // Vou tentar com um UUID zerado se for service role, ou null
                user_id: isServiceRole ? '00000000-0000-0000-0000-000000000000' : undefined 
            };
            
            // Se for anon, provavelmente precisa de auth real. O script roda sem usuário logado.
            // Então insert com anon key vai falhar RLS se a tabela exigir auth.uid()
            
            if (isServiceRole) {
                 const { error: insError } = await supabase.from('announcement_views').insert(viewData);
                 if (insError) {
                     console.error('Erro ao inserir announcement_views (Admin):', insError);
                 } else {
                     console.log('Sucesso: Inserção em announcement_views (Admin) funcionou.');
                 }
            } else {
                console.log('Pulei inserção pois não tenho Service Role Key (RLS bloquearia ou faltaria user_id).');
            }

        } else {
            console.log('Nenhum anúncio encontrado para testar views.');
        }
    } catch (e) {
        console.error('Exceção em announcement_views:', e);
    }

    // 4. Verificar Campos de Arquivamento
    console.log('\n4. Verificando campos de arquivamento em announcements...');
    try {
         const { data: annData, error: annError } = await supabase
            .from('announcements')
            .select('*')
            .limit(1);
         
         if (annError) {
             console.error('Erro ao ler announcements:', annError);
         } else if (annData.length > 0) {
             const keys = Object.keys(annData[0]);
             console.log('Campos disponíveis:', keys.join(', '));
             console.log('Valor de is_archived:', annData[0].is_archived);
             console.log('Valor de archived:', annData[0].archived);
         }
    } catch (e) {
        console.error('Exceção ao verificar campos:', e);
    }
}

diagnose();
