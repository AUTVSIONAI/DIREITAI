const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/DIREITAI/backend-oficial/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testBroadcastLogic() {
    console.log('Testing broadcast logic (DB Direct)...');
    
    // 1. Fetch users
    const { data: users, error } = await supabase.from('users').select('id');
    if (error) { 
        console.error('Error fetching users:', error); 
        return; 
    }
    
    console.log(`Found ${users.length} users.`);
    if (users.length === 0) {
        console.log('No users to broadcast to.');
        return;
    }
    
    // 2. Insert notifications
    const notifications = users.map(u => ({
        user_id: u.id,
        title: 'Test Broadcast Script ' + new Date().toISOString(),
        message: 'This is a test from the script.',
        type: 'info',
        category: 'system',
        is_read: false,
        created_at: new Date().toISOString()
    }));
    
    console.log(`Attempting to insert ${notifications.length} notifications...`);
    
    const { data, error: insertError } = await supabase.from('notifications').insert(notifications).select();
    
    if (insertError) {
        console.error('Error inserting:', insertError);
    } else {
        console.log(`Successfully inserted ${data.length} notifications!`);
    }
}

testBroadcastLogic();
