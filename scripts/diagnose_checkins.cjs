const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend-oficial/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Diagnosticando Check-ins ---');

    // 1. Verificar geographic_checkins
    const { data: geoData, error: geoError } = await supabase
        .from('geographic_checkins')
        .select('*')
        .order('checked_in_at', { ascending: false })
        .limit(5);

    if (geoError) {
        console.error('Erro ao ler geographic_checkins:', geoError.message);
    } else {
        console.log(`Últimos 5 check-ins em geographic_checkins (Total encontrado nesta query: ${geoData.length}):`);
        console.log(JSON.stringify(geoData, null, 2));
    }

    // 2. Verificar checkins (eventos)
    const { data: eventData, error: eventError } = await supabase
        .from('checkins')
        .select('*')
        .order('created_at', { ascending: false }) // Assuming created_at or similar
        .limit(5);

    if (eventError) {
        // Might fail if column doesn't exist or table doesn't exist, try simple select
        const { data: eventData2, error: eventError2 } = await supabase.from('checkins').select('*').limit(5);
        if (eventError2) console.error('Erro ao ler checkins:', eventError2.message);
        else console.log('checkins (eventos) - primeiros 5:', eventData2);
    } else {
        console.log('checkins (eventos) - últimos 5:', eventData);
    }
    
    // 3. Verificar usuários
    const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
    if (userError) console.error('Erro ao contar usuários:', userError.message);
    else console.log(`Total de usuários na tabela public.users: ${userCount}`);
}

diagnose();
