const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationsStats() {
  try {
    console.log('Testing notifications stats...');
    
    // Simulate the logic in the backend route
    const period = 'month';
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    
    console.log(`Time range: ${start.toISOString()} to ${end.toISOString()}`);
    
    // 1. Total Sent
    const { count: totalSent, error: errorSent } = await adminSupabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
      
    if (errorSent) throw errorSent;
    console.log(`Total Sent: ${totalSent}`);
    
    // 2. Total Read (not null)
    const { count: totalRead, error: errorRead } = await adminSupabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .not('read_at', 'is', null)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
      
    if (errorRead) throw errorRead;
    console.log(`Total Read: ${totalRead}`);
    
    // 3. Total Clicked (not null)
    const { count: totalClicked, error: errorClicked } = await adminSupabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .not('clicked_at', 'is', null)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (errorClicked) throw errorClicked;
    console.log(`Total Clicked: ${totalClicked}`);

    // 4. Total Dismissed (not null)
    const { count: totalDismissed, error: errorDismissed } = await adminSupabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .not('dismissed_at', 'is', null)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
      
    if (errorDismissed) throw errorDismissed;
    console.log(`Total Dismissed: ${totalDismissed}`);
    
    // Rates
    const readRate = totalSent ? Math.round((totalRead / totalSent) * 100) : 0;
    const clickRate = totalRead ? Math.round((totalClicked / totalRead) * 100) : 0;
    
    console.log('--- Calculated Rates ---');
    console.log(`Read Rate: ${readRate}%`);
    console.log(`Click Rate: ${clickRate}%`);
    
    if (totalSent === 0 && totalRead === 0 && totalClicked === 0) {
        console.warn("WARNING: All stats are zero. Check if data exists in the 'notifications' table.");
    } else {
        console.log("SUCCESS: Data retrieved successfully.");
    }

  } catch (error) {
    console.error('Error testing notifications stats:', error);
  }
}

testNotificationsStats();
