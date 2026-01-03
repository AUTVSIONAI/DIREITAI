const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  console.log('Checking Storage Buckets...');
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  
  console.table(data.map(b => ({ id: b.id, public: b.public })));
  
  // Check 'images' bucket specifically if it exists
  const imagesBucket = data.find(b => b.id === 'images');
  if (imagesBucket) {
      console.log('Images bucket found. Public:', imagesBucket.public);
  } else {
      console.log('Images bucket NOT found.');
  }
}

checkBuckets();
