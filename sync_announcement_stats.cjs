const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAnnouncementStats() {
  console.log('--- Syncing Announcement Stats ---');

  // 1. Get all announcements
  const { data: announcements, error: annError } = await supabase
    .from('announcements')
    .select('id, title');

  if (annError) {
    console.error('Error fetching announcements:', annError);
    return;
  }

  console.log(`Found ${announcements.length} announcements.`);

  for (const ann of announcements) {
    // 2. Count actual rows
    const { count: viewCount } = await supabase
      .from('announcement_views')
      .select('id', { count: 'exact', head: true })
      .eq('announcement_id', ann.id);

    const { count: clickCount } = await supabase
      .from('announcement_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('announcement_id', ann.id);

    const { count: dismissCount } = await supabase
      .from('announcement_dismissals')
      .select('id', { count: 'exact', head: true })
      .eq('announcement_id', ann.id);

    // 3. Update metadata
    const { error: updateError } = await supabase
      .from('announcements')
      .update({
        view_count: viewCount || 0,
        click_count: clickCount || 0,
        dismiss_count: dismissCount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', ann.id);

    if (updateError) {
      console.error(`Error updating stats for ${ann.title}:`, updateError);
    } else {
      console.log(`Updated ${ann.title}: Views=${viewCount}, Clicks=${clickCount}, Dismissals=${dismissCount}`);
    }
  }
  console.log('--- Sync Complete ---');
}

syncAnnouncementStats();
