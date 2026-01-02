const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials for debug script to avoid module resolution issues
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFields() {
  console.log('Checking announcement fields...');

  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching announcements:', error);
    } else if (data && data.length > 0) {
      console.log('Announcement fields:', Object.keys(data[0]));
      console.log('Sample record:', data[0]);
    } else {
      console.log('No announcements found.');
    }

    // Also check blog_post_likes RLS by trying to insert a dummy record (then delete)
    // Actually, service role bypasses RLS, so this won't test RLS.
    // I need to check policies metadata.
    const { data: policies, error: polError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'blog_post_likes');
      
    // pg_policies is a system catalog, might not be accessible via JS client directly unless mapped or via rpc.
    // Let's try to query it.
    // If not, I'll just rely on creating a fix script for RLS.
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkFields();
