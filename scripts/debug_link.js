
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars from current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLink() {
  console.log('Searching for "Allan"...')

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .ilike('full_name', '%Allan%')
  
  console.log('Users matching "Allan":', users)

  const { data: politicians } = await supabase
    .from('politicians')
    .select('id, name, email')
    .ilike('name', '%Allan%')

  console.log('Politicians matching "Allan":', politicians)
}

debugLink()
