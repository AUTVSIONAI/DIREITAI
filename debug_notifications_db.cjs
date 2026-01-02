const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load backend env
const backendEnvPath = path.resolve(__dirname, 'backend-oficial', '.env');
const backendEnv = dotenv.parse(fs.readFileSync(backendEnvPath));

const supabaseUrl = backendEnv.SUPABASE_URL;
const supabaseServiceKey = backendEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in backend .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log('--- Debugging Notifications DB ---');
    
    // Check total count
    const { count: totalCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });
        
    if (countError) {
        console.error('Error counting notifications:', countError);
        return;
    }
    console.log(`Total notifications in DB: ${totalCount}`);

    // Check recent notifications (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    console.log(`Checking notifications since: ${thirtyDaysAgo.toISOString()}`);
    
    const { data: recent, error: recentError } = await supabase
        .from('notifications')
        .select('id, created_at, read_at, clicked_at, dismissed_at, type')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });
        
    if (recentError) {
        console.error('Error fetching recent notifications:', recentError);
        return;
    }
    
    console.log(`Recent notifications found: ${recent.length}`);
    
    if (recent.length > 0) {
        console.log('Sample recent notifications:');
        recent.slice(0, 5).forEach(n => {
            console.log(` - ID: ${n.id}, Created: ${n.created_at}, Read: ${n.read_at}, Clicked: ${n.clicked_at}`);
        });
        
        // Count stats manually for verification
        const readCount = recent.filter(n => n.read_at).length;
        const clickedCount = recent.filter(n => n.clicked_at).length;
        const dismissedCount = recent.filter(n => n.dismissed_at).length;
        
        console.log('\nManual Stats Calculation (Last 30 days):');
        console.log(`Total: ${recent.length}`);
        console.log(`Read: ${readCount}`);
        console.log(`Clicked: ${clickedCount}`);
        console.log(`Dismissed: ${dismissedCount}`);
        console.log(`Read Rate: ${recent.length ? Math.round((readCount / recent.length) * 100) : 0}%`);
    } else {
        console.log('No recent notifications found. This explains why stats are zero.');
        
        // Check most recent notification ever
        const { data: lastOne } = await supabase
            .from('notifications')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (lastOne && lastOne.length > 0) {
            console.log(`Most recent notification in DB was created at: ${lastOne[0].created_at}`);
        }
    }
}

run();
