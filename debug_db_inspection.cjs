const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectDB() {
  console.log('--- Inspecting Announcements Stats ---');
  
  // 1. Check Announcements Clicks
  const { data: announcements, error: annError } = await adminSupabase
    .from('announcements')
    .select('id, title, click_count, view_count, dismiss_count')
    .gt('click_count', 0)
    .limit(5);
    
  if (annError) console.error('Error fetching announcements:', annError.message);
  else {
    console.log(`Found ${announcements.length} announcements with clicks:`);
    announcements.forEach(a => console.log(`- [${a.id}] ${a.title}: ${a.click_count} clicks, ${a.view_count} views`));
  }

  const { count: clickRows, error: clickRowsError } = await adminSupabase
    .from('announcement_clicks')
    .select('*', { count: 'exact', head: true });
    
  if (clickRowsError) console.error('Error counting announcement_clicks:', clickRowsError.message);
  else console.log(`Total rows in 'announcement_clicks' table: ${clickRows}`);

  console.log('\n--- Inspecting Notifications Stats (Last 30 Days) ---');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isoDate = thirtyDaysAgo.toISOString();
  
  const { count: totalNotif, error: totalNotifError } = await adminSupabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDate);
    
  const { count: readNotif, error: readNotifError } = await adminSupabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDate)
    .not('read_at', 'is', null);

  const { count: clickedNotif, error: clickedNotifError } = await adminSupabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDate)
    .not('clicked_at', 'is', null);

  if (totalNotifError) console.error('Error counting notifications:', totalNotifError.message);
  else {
    console.log(`Total Notifications (last 30 days): ${totalNotif}`);
    console.log(`Read Notifications (last 30 days): ${readNotif}`);
    console.log(`Clicked Notifications (last 30 days): ${clickedNotif}`);
  }

  console.log('\n--- Inspecting Geographic Checkins (User ID Mismatch) ---');
  
  const { data: geoCheckins, error: geoError } = await adminSupabase
    .from('geographic_checkins')
    .select('id, user_id, created_at')
    .limit(5);
    
  if (geoError) console.error('Error fetching geographic_checkins:', geoError.message);
  else {
    console.log('Sample Geographic Checkins:');
    for (const checkin of geoCheckins) {
      // Try to find user by this ID (assuming it's public ID)
      const { data: userByPublic, error: userError } = await adminSupabase
        .from('users')
        .select('id, email, auth_id')
        .eq('id', checkin.user_id)
        .single();
        
      // Try to find user by Auth ID (assuming checkin stores Auth ID)
      const { data: userByAuth, error: authError } = await adminSupabase
        .from('users')
        .select('id, email, auth_id')
        .eq('auth_id', checkin.user_id)
        .single();

      let status = 'Unknown ID type';
      if (userByPublic) status = `Matches Public ID of ${userByPublic.email}`;
      else if (userByAuth) status = `Matches Auth ID of ${userByAuth.email}`;
      else status = 'No match found in users table';

      console.log(`- Checkin [${checkin.id}] UserID: ${checkin.user_id} -> ${status}`);
    }
  }
}

inspectDB();
