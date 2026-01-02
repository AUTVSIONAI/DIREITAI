const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNotifications() {
  console.log('Checking notifications table...');

  // 1. Check table structure (columns) is not easily possible via client, but we can infer from data
  // Let's get one notification
  const { data: sample, error: sampleError } = await supabase
    .from('notifications')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('Error fetching sample:', sampleError);
  } else if (sample.length > 0) {
    console.log('Sample notification keys:', Object.keys(sample[0]));
    console.log('Sample notification:', sample[0]);
  } else {
    console.log('No notifications found.');
  }

  // 2. Count totals
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const isoDate = oneMonthAgo.toISOString();

  console.log('Checking stats since:', isoDate);

  const { count: total, error: totalError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDate);

  if (totalError) console.error('Error counting total:', totalError);
  console.log('Total notifications (last month):', total);

  // 3. Count read (using is_read)
  const { count: readBool, error: readBoolError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDate)
    .eq('is_read', true);

  console.log('Read (is_read=true):', readBool);

  // 4. Count read (using read_at)
  // Check if read_at column exists by trying to select it specifically if keys above didn't show it
  // If keys showed it, we know.
  
  const { count: readAt, error: readAtError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDate)
    .not('read_at', 'is', null);

  if (readAtError) console.error('Error counting read_at:', readAtError);
  console.log('Read (read_at is not null):', readAt);

  // 5. Count clicked (using clicked_at)
  const { count: clickedAt, error: clickedAtError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDate)
    .not('clicked_at', 'is', null);

  console.log('Clicked (clicked_at is not null):', clickedAt);

}

checkNotifications();
