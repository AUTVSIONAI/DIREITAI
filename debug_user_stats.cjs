const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cmpejtsmlqylqnapriis.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns(table) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(`Error checking ${table}:`, error.message);
    return [];
  }
  
  if (data && data.length > 0) {
    return Object.keys(data[0]);
  } else {
    // If table is empty, we can't infer columns easily this way without information_schema permission
    // But we can try to insert a dummy record and see error, or just assume.
    // Let's try to select from information_schema
    return ['(table empty or no access)'];
  }
}

async function run() {
  console.log('Checking table structures...');
  
  const tables = ['fake_news_checks', 'badges', 'ai_conversations', 'announcement_views'];
  
  for (const table of tables) {
    console.log(`\nTable: ${table}`);
    const columns = await checkColumns(table);
    console.log('Columns (from first row):', columns.join(', '));
  }
  
  // Find the user
  const userId = '0155ccb7-0091-4202-8610-090956743950'; // The one we identified before
  console.log(`\nChecking data for user: ${userId}`);
  
  // Check User
  const { data: user, error: userError } = await supabase.from('users').select('id, auth_id, email').eq('id', userId).single();
  if (userError) console.error('User error:', userError.message);
  else console.log('User found:', user);
  
  if (!user) return;
  
  const authId = user.auth_id;
  const filter = authId ? `user_id.eq.${userId},user_id.eq.${authId}` : `user_id.eq.${userId}`;
  
  // Check Badges
  const { count: badgesCount, error: badgesError } = await supabase.from('badges').select('*', { count: 'exact', head: true }).or(filter);
  console.log(`Badges count (OR filter): ${badgesCount} (Error: ${badgesError?.message})`);
  
  // Check AI Conversations
  const { count: aiCount, error: aiError } = await supabase.from('ai_conversations').select('*', { count: 'exact', head: true }).or(filter);
  console.log(`AI Conversations count (OR filter): ${aiCount} (Error: ${aiError?.message})`);
  
  // Check Fake News Checks (try user_id and usuario_id)
  try {
      // Check if user_id exists in columns by trying to select it
      const { count: fnCount1, error: fnError1 } = await supabase.from('fake_news_checks').select('*', { count: 'exact', head: true }).or(filter);
      console.log(`Fake News (user_id filter): ${fnCount1} (Error: ${fnError1?.message})`);
  } catch (e) {
      console.log('Fake News (user_id filter) failed:', e.message);
  }

  const altFilter = authId ? `usuario_id.eq.${userId},usuario_id.eq.${authId}` : `usuario_id.eq.${userId}`;
  const { count: fnCount2, error: fnError2 } = await supabase.from('fake_news_checks').select('*', { count: 'exact', head: true }).or(altFilter);
  console.log(`Fake News (usuario_id filter): ${fnCount2} (Error: ${fnError2?.message})`);

}

run();
