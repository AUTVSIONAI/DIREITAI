const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials (SERVICE_ROLE_KEY required)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCounts() {
  console.log('--- Debugging User Data & Checkins ---');

  // 1. Identify User
  // The ID observed in logs/previous steps: 4f1b46b2-698c-4a79-ac64-df47278af391
  const targetId = '4f1b46b2-698c-4a79-ac64-df47278af391';
  console.log(`Target ID: ${targetId}`);

  // Find in users table
  let publicId = null;
  let authId = null;

  const { data: userByAuth, error: authErr } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', targetId)
    .single();

  if (userByAuth) {
    console.log('Found user by AUTH_ID in users table:', userByAuth.email);
    publicId = userByAuth.id;
    authId = userByAuth.auth_id;
  } else {
    console.log('Not found by auth_id. Checking if it IS the public id...');
    const { data: userById, error: idErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetId)
        .single();
    
    if (userById) {
        console.log('Found user by PUBLIC_ID in users table:', userById.email);
        publicId = userById.id;
        authId = userById.auth_id;
    } else {
        console.error('User not found in users table by either ID.');
        if (authErr) console.error('Auth Error:', authErr.message);
        if (idErr) console.error('ID Error:', idErr.message);
    }
  }

  if (!publicId && !authId) {
      // Just in case the targetId IS the ID used in checkins but not in users (orphan?)
      console.log('Proceeding to check tables using the Target ID directly...');
  }

  // 2. Count Checkins
  const idsToCheck = [];
  if (publicId) idsToCheck.push({ label: 'Public ID', id: publicId });
  if (authId) idsToCheck.push({ label: 'Auth ID', id: authId });
  if (!publicId && !authId) idsToCheck.push({ label: 'Target ID', id: targetId });

  for (const { label, id } of idsToCheck) {
      console.log(`\nChecking counts for ${label}: ${id}`);
      
      // Table: checkins
      const { count: checkinsCount, error: cErr } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);
      console.log(`- 'checkins' table count: ${checkinsCount} (Error: ${cErr?.message || 'None'})`);

      // Table: geographic_checkins (if exists)
      const { count: geoCount, error: gErr } = await supabase
        .from('geographic_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);
      console.log(`- 'geographic_checkins' table count: ${geoCount} (Error: ${gErr?.message || 'None'})`);
  }

  // 3. Check Notifications for these IDs (for the other issue)
  for (const { label, id } of idsToCheck) {
      console.log(`\nChecking notifications for ${label}: ${id}`);
      const { count: notifCount, error: nErr } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id);
      console.log(`- Total notifications: ${notifCount}`);
      
      const { count: readCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
          .not('read_at', 'is', null);
      console.log(`- Read notifications (read_at != null): ${readCount}`);

       const { count: isReadCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
          .eq('is_read', true);
      console.log(`- Read notifications (is_read = true): ${isReadCount}`);
  }
}

debugCounts();
