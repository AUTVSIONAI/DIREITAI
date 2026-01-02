const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables manually
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const envConfig = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.trim();
  }
});

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateClick() {
  console.log('--- Simulating Announcement Click ---');

  // 1. Create a dummy announcement
  const { data: announcement, error: createError } = await supabase
    .from('announcements')
    .insert({
      title: 'Debug Click Test',
      message: 'Testing click increment',
      content: 'Testing click increment',
      type: 'info',
      priority: 'low',
      start_date: new Date().toISOString(),
      created_by: '00000000-0000-0000-0000-000000000000', // Assuming we can use dummy ID or need valid one
      view_count: 0,
      click_count: 0
    })
    .select()
    .single();

  if (createError) {
    // Maybe created_by constraint? Let's find a valid user
    console.log('Create failed, trying to find a valid user...');
    const { data: user } = await supabase.from('users').select('id').limit(1).single();
    
    if (user) {
         const { data: announcement2, error: createError2 } = await supabase
            .from('announcements')
            .insert({
            title: 'Debug Click Test 2',
            message: 'Testing click increment',
            content: 'Testing click increment',
            type: 'info',
            priority: 'low',
            start_date: new Date().toISOString(),
            created_by: user.id,
            view_count: 0,
            click_count: 0
            })
            .select()
            .single();
            
         if (createError2) {
             console.error('Failed to create announcement even with valid user:', createError2);
             return;
         }
         console.log('Created Announcement:', announcement2.id);
         await testRpc(announcement2.id);
    } else {
        console.error('No users found to create announcement.');
    }
  } else {
    console.log('Created Announcement:', announcement.id);
    await testRpc(announcement.id);
  }
}

async function testRpc(announcementId) {
    console.log(`Testing RPC on ${announcementId}...`);
    
    // Call RPC directly
    const { error: rpcError } = await supabase
      .rpc('increment_announcement_click', { announcement_id_input: announcementId });
      
    if (rpcError) {
        console.error('RPC Failed:', rpcError);
    } else {
        console.log('RPC Success.');
    }
    
    // Check count
    const { data: updated } = await supabase
        .from('announcements')
        .select('click_count')
        .eq('id', announcementId)
        .single();
        
    console.log('Updated Click Count:', updated.click_count);
    
    if (updated.click_count === 1) {
        console.log('SUCCESS: Click count incremented.');
    } else {
        console.error('FAILURE: Click count NOT incremented.');
    }
    
    // Cleanup
    await supabase.from('announcements').delete().eq('id', announcementId);
}

simulateClick();
