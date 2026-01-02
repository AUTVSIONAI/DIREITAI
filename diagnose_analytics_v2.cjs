const { createClient } = require('@supabase/supabase-js');

// Hardcoded keys for diagnosis (copied from .env)
const SUPABASE_URL = 'https://vussgslenvyztckeuyap.supabase.co';
// WARNING: Using SERVICE_ROLE_KEY for admin access to bypass RLS
// Note: In the .env read, I only saw ANON_KEY. I need the SERVICE_ROLE_KEY.
// If I don't have SERVICE_ROLE_KEY, I can't bypass RLS easily unless I login.
// But wait, the user provided keys in .env. Let me check if SERVICE_ROLE_KEY is there.
// The .env read showed: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.
// It did NOT show SERVICE_ROLE_KEY.
// If I don't have service role key, I must use ANON_KEY and maybe I can't see everything if RLS blocks it.
// But for "Usuário anônimo", I can check public tables.
// For analytics, I might need to insert as a user.

// Let's use the keys I have.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
    console.log('--- Diagnóstico v2 ---');
    
    // 1. Check blog_post_likes
    console.log('\n1. Verificando blog_post_likes...');
    const { data: likes, error: likesError } = await supabase.from('blog_post_likes').select('*').limit(5);
    if (likesError) {
        console.error('Erro ao ler blog_post_likes:', likesError);
    } else {
        console.log(`Sucesso. Encontrados ${likes.length} likes.`);
        if (likes.length > 0) console.log('Exemplo:', likes[0]);
    }

    // 2. Check notification_stats
    console.log('\n2. Verificando notification_stats...');
    const { data: stats, error: statsError } = await supabase.from('notification_stats').select('*').limit(5);
    if (statsError) {
        console.error('Erro ao ler notification_stats:', statsError);
    } else {
        console.log(`Sucesso. Encontrados ${stats.length} stats.`);
        if (stats.length > 0) console.log('Exemplo:', stats[0]);
    }

    // 3. Check politician_ratings user mapping
    console.log('\n3. Verificando politician_ratings e users...');
    const { data: ratings, error: ratingsError } = await supabase
        .from('politician_ratings')
        .select('id, user_id, users(id, full_name, username)')
        .limit(5);
    
    if (ratingsError) {
        console.error('Erro ao ler politician_ratings:', ratingsError);
    } else {
        console.log(`Sucesso. Encontrados ${ratings.length} ratings.`);
        ratings.forEach(r => {
            console.log(`Rating ${r.id}: UserID=${r.user_id}, UserData=${JSON.stringify(r.users)}`);
        });
    }
    // 4. Check announcements
    console.log('\n4. Verificando announcements...');
    const { data: anns, error: annsError } = await supabase.from('announcements').select('*').limit(5);
    if (annsError) {
        console.error('Erro ao ler announcements:', annsError);
    } else {
        console.log(`Sucesso. Encontrados ${anns.length} anúncios.`);
        anns.forEach(a => {
            console.log(`Anúncio ${a.id}: is_archived=${a.is_archived} (Type: ${typeof a.is_archived})`);
        });
    }
}

diagnose();
