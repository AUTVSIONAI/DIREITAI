const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Load environment variables from backend .env
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const parseEnv = (content) => {
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  return env;
};

const env = parseEnv(envContent);
const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAnnouncementClicks() {
  console.log('🧪 Debugging Announcement Clicks...');

  // 1. Create a test announcement
  console.log('📝 Creating test announcement...');
  const { data: announcement, error: createError } = await supabase
    .from('announcements')
    .insert({
      title: 'Debug Click Test',
      message: 'Testing click tracking',
      content: 'Testing click tracking content', // Added content field
      type: 'info',
      is_active: true,
      click_count: 0
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create announcement:', createError);
    return;
  }
  
  const announcementId = announcement.id;
  console.log('✅ Created announcement:', announcementId);

  // 2. Simulate a click (Direct DB update via RPC if possible, or simulate HTTP request logic)
  // We will simulate the logic used in the route handler: Insert tracking + RPC increment + Fallback
  
  console.log('🖱️ Simulating click...');
  
  // A. Insert tracking (simulate guest user for simplicity, or we can use a dummy user ID if needed)
  // Since tracking is optional for guests, let's skip user tracking for now and focus on the counter.
  
  // B. Call RPC
  console.log('📞 Calling increment_announcement_click RPC...');
  const { error: rpcError } = await supabase.rpc('increment_announcement_click', { announcement_id_input: announcementId });
  
  if (rpcError) {
    console.warn('⚠️ RPC failed:', rpcError.message);
    
    // C. Fallback logic
    console.log('🔄 Executing fallback logic...');
    const { data: current } = await supabase
      .from('announcements')
      .select('click_count')
      .eq('id', announcementId)
      .single();
      
    const next = (current?.click_count || 0) + 1;
    
    const { error: updateError } = await supabase
      .from('announcements')
      .update({ click_count: next })
      .eq('id', announcementId);
      
    if (updateError) {
      console.error('❌ Fallback update failed:', updateError.message);
    } else {
      console.log('✅ Fallback update success');
    }
  } else {
    console.log('✅ RPC success');
  }

  // 3. Verify counts
  console.log('🔍 Verifying counts...');
  const { data: finalAnnouncement } = await supabase
    .from('announcements')
    .select('click_count')
    .eq('id', announcementId)
    .single();

  console.log('📊 Final Click Count:', finalAnnouncement?.click_count);

  if (finalAnnouncement?.click_count === 1) {
    console.log('✅ SUCCESS: Click count incremented correctly.');
  } else {
    console.error('❌ FAILURE: Click count is not 1.');
  }

  // Cleanup
  console.log('🧹 Cleaning up...');
  await supabase.from('announcements').delete().eq('id', announcementId);
}

debugAnnouncementClicks();
