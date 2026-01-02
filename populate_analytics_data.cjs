const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateAnalytics() {
  console.log('--- Populating Analytics Data ---');

  // Get a valid user ID
  console.log('Fetching a valid user ID...');
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  
  if (!users || users.length === 0) {
      console.error('No users found in database to attach stats to.');
      return;
  }
  const userId = users[0].id;
  console.log('Using user ID:', userId);

  // 1. Populate notification_stats (General Stats)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

  console.log(`Upserting notification_stats for period: ${monthStr}`);
  const { error: statsError } = await supabase
    .from('notification_stats')
    .upsert({
      period: monthStr,
      total_sent: 150,
      total_read: 85,
      total_clicks: 45,
      delivery_rate: 98.5,
      click_rate: 30.0,
      updated_at: new Date()
    }, { onConflict: 'period' });

  if (statsError) {
      console.error('Error inserting notification_stats:', JSON.stringify(statsError, null, 2));
  } else {
      console.log('Inserted notification_stats for', monthStr);
  }

  // 2. Get an announcement to attach stats to
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id')
    .limit(1);

  let bannerId;
  if (announcements && announcements.length > 0) {
    bannerId = announcements[0].id;
    console.log('Attaching stats to existing announcement:', bannerId);
  } else {
    console.log('No announcements found. Creating a dummy one...');
    const { data: newAnn, error: annError } = await supabase
        .from('announcements')
        .insert({
            title: 'Teste de Analytics',
            content: 'Este é um anúncio de teste.',
            type: 'info',
            is_active: true,
            start_date: new Date(),
            target_audience: 'all'
        })
        .select()
        .single();
    
    if (annError) {
        console.error('Error creating dummy announcement:', annError);
        return;
    }
    bannerId = newAnn.id;
    console.log('Created dummy announcement:', bannerId);
  }

  if (bannerId) {
    // Insert announcement views
    console.log('Inserting announcement views...');
    const { error: viewsError } = await supabase
      .from('announcement_views')
      .insert([
        {
          announcement_id: bannerId,
          user_id: userId,
          viewed_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          announcement_id: bannerId,
          user_id: userId, // Same user viewed twice (e.g. different session)
          viewed_at: new Date().toISOString()
        }
      ]);

    if (viewsError) {
      console.error('Error inserting announcement views:', JSON.stringify(viewsError, null, 2));
    } else {
      console.log('Announcement views inserted successfully.');
    }

    // Insert announcement clicks
    console.log('Inserting announcement clicks...');
    const { error: clicksError } = await supabase
      .from('announcement_clicks')
      .insert([
        {
          announcement_id: bannerId,
          user_id: userId,
          clicked_at: new Date().toISOString()
        }
      ]);

    if (clicksError) {
      console.error('Error inserting announcement clicks:', JSON.stringify(clicksError, null, 2));
    } else {
      console.log('Announcement clicks inserted successfully.');
    }

    // Insert announcement dismissals
    console.log('Inserting announcement dismissals...');
    // Create another announcement for dismissal test
    const { data: dismissAnnouncement, error: dismissAnnError } = await supabase
        .from('announcements')
        .insert({
            title: 'Anúncio para Dispensar',
            content: 'Este anúncio será dispensado.',
            type: 'info',
            start_date: new Date(Date.now() - 86400000).toISOString(),
            end_date: new Date(Date.now() + 86400000).toISOString(),
            is_active: true,
            priority: 1
        })
        .select()
        .single();
    
    if (!dismissAnnError && dismissAnnouncement) {
        const { error: dismissalError } = await supabase
        .from('announcement_dismissals')
        .insert([
            {
            announcement_id: dismissAnnouncement.id,
            user_id: userId,
            dismissed_at: new Date().toISOString()
            }
        ]);

        if (dismissalError) {
            console.error('Error inserting announcement dismissals:', JSON.stringify(dismissalError, null, 2));
        } else {
            console.log('Announcement dismissals inserted successfully.');
        }
    }
  }
}

populateAnalytics();
