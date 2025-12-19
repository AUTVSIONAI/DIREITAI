
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars from current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('CHECKING USER ID f6326d10-59c9-4736-b9bf-5c848cc243de IN PUBLIC.USERS')

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', 'f6326d10-59c9-4736-b9bf-5c848cc243de')
    .maybeSingle()
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('User found:', user)
  }
}

run()
