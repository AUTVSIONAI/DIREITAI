
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env:', result.error);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- 1. Fix Announcements Archive Button
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_archived') THEN 
        ALTER TABLE public.announcements ADD COLUMN is_archived BOOLEAN DEFAULT false; 
    END IF;
END $$;

-- 2. Fix User "Anonymous" Issue (RLS)
DO $$
BEGIN
    -- Check if policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone" 
        ON public.users FOR SELECT 
        USING (true);
    END IF;
END $$;

-- 3. Fix Blog Likes (Unique Constraint)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'blog_post_likes_post_id_user_id_key'
    ) THEN
        ALTER TABLE public.blog_post_likes 
        ADD CONSTRAINT blog_post_likes_post_id_user_id_key 
        UNIQUE (post_id, user_id);
    END IF;
END $$;

-- 4. Fix Politician Ratings (Unique Constraint)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'politician_ratings_politician_id_user_id_key'
    ) THEN
        ALTER TABLE public.politician_ratings 
        ADD CONSTRAINT politician_ratings_politician_id_user_id_key 
        UNIQUE (politician_id, user_id);
    END IF;
END $$;

-- 5. Fix Analytics (Ensure columns exist just in case script didn't catch all)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_stats' AND column_name = 'sent_count') THEN 
        ALTER TABLE public.notification_stats ADD COLUMN sent_count INTEGER DEFAULT 0; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_stats' AND column_name = 'read_count') THEN 
        ALTER TABLE public.notification_stats ADD COLUMN read_count INTEGER DEFAULT 0; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_stats' AND column_name = 'clicked_count') THEN 
        ALTER TABLE public.notification_stats ADD COLUMN clicked_count INTEGER DEFAULT 0; 
    END IF;
END $$;
`;

async function run() {
  console.log('Running DB fixes...');
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Error running SQL:', error);
    // Fallback: Try running individually if big block fails
  } else {
    console.log('Success! DB fixes applied.');
  }
}

run();
