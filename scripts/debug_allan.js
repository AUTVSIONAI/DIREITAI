
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars from current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('SEARCHING FOR USER ID f6326d10-59c9-4736-b9bf-5c848cc243de...')

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', 'f6326d10-59c9-4736-b9bf-5c848cc243de')
    .maybeSingle()
  
  console.log('User found:', user)

  const { data: politician } = await supabase
    .from('politicians')
    .select('*')
    .ilike('name', '%Allan%Garces%') // trying without circumflex first, but we know it has one
    .maybeSingle()
    
    // We know the politician ID from previous run: bf95ad31-d12a-4581-9ba4-d1c8c6a13dfa
  const { data: polByExactName } = await supabase
    .from('politicians')
    .select('*')
    .eq('id', 'bf95ad31-d12a-4581-9ba4-d1c8c6a13dfa')
    .single()

  console.log('Politician found:', polByExactName)
}

run()
