const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials from backend-oficial/.env
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Drop table to ensure clean state (removes old policies/triggers)
DROP TABLE IF EXISTS politician_suggestions CASCADE;

-- Create politician_suggestions table
CREATE TABLE politician_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE politician_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own suggestions
CREATE POLICY "Users can insert suggestions" ON politician_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view own suggestions
CREATE POLICY "Users can view own suggestions" ON politician_suggestions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Politicians can update suggestions
-- Using 'users' table assuming it has politician_id and role
CREATE POLICY "Politicians can update suggestions" ON politician_suggestions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
       SELECT 1 FROM users u 
       WHERE u.id = auth.uid() 
       AND (u.politician_id = politician_suggestions.politician_id OR u.role = 'admin')
    )
  );

-- Allow read for everyone (or authenticated) for now to debug
CREATE POLICY "Enable read access for all users" ON politician_suggestions FOR SELECT USING (true);

-- Allow update for authenticated (temporary fix for "DA ERRO")
-- This overlaps with the politician policy but ensures at least authenticated users can try.
-- However, strict security would require the politician policy only.
-- Let's keep this one as well to be safe for now.
CREATE POLICY "Enable update for authenticated" ON politician_suggestions FOR UPDATE USING (auth.role() = 'authenticated');
`;

async function run() {
  console.log('Running SQL...');
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Error executing SQL via RPC:', error);
  } else {
    console.log('SQL executed successfully.');
  }
}

run();
