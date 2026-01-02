const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials missing');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMapbox() {
    const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN; // Wait, backend .env might not have it if it's frontend only.
    // Let's read c:\DIREITAI\.env first to get the token.
    console.log('Checking MAPBOX_TOKEN in process.env...');
    
    // I need to manually read the frontend .env if it's not in backend .env
    // The previous read of backend .env didn't show MAPBOX_TOKEN.
    // The previous read of frontend .env failed (empty?).
    
    // Let's assume the user has it in frontend .env.
    // I will try to read it again.
}

console.log('Use verify_mapbox.cjs instead.');
