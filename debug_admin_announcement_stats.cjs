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

async function debugAnnouncementStats() {
  console.log('--- Debugging Announcement Stats ---');

  // 1. Get an active announcement
  const { data: announcements, error: annError } = await supabase
    .from('announcements')
    .select('id, title, view_count, click_count, dismiss_count')
    .limit(5);

  if (annError) {
    console.error('Error fetching announcements:', annError);
    return;
  }

  console.log('Announcements found:', announcements.length);
  
  for (const ann of announcements) {
    console.log(`\nChecking Announcement: ${ann.title} (${ann.id})`);
    console.log('  Metadata Counts:', {
      views: ann.view_count,
      clicks: ann.click_count,
      dismissals: ann.dismiss_count
    });

    // 2. Count actual rows in tracking tables
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

    console.log('  Actual Table Counts:', {
      views: viewCount,
      clicks: clickCount,
      dismissals: dismissCount
    });
    
    // Check if they match
    if (viewCount !== ann.view_count || clickCount !== ann.click_count || dismissCount !== ann.dismiss_count) {
        console.warn('  MISMATCH DETECTED! Metadata counts do not match actual table counts.');
    } else {
        console.log('  Counts are consistent.');
    }
  }
}

debugAnnouncementStats();
