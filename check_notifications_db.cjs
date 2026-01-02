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

async function checkNotifications() {
  console.log('--- Checking Notifications Table ---');

  // 1. Count total notifications
  const { count, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting notifications:', countError);
    return;
  }
  console.log('Total Notifications:', count);

  // 2. Get distribution by created_at (month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { count: monthCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth);
    
  console.log(`Notifications since ${startOfMonth}: ${monthCount}`);

  // 3. Check read status
  const { count: readCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)
    .not('read_at', 'is', null);
    
  console.log(`Read Notifications (this month): ${readCount}`);
  
  // 4. Sample latest notification
  const { data: latest } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
    
  console.log('Latest Notification:', latest ? latest[0] : 'None');
}

checkNotifications();
