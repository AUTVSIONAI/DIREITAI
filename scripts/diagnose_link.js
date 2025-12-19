
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env vars
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const logFile = path.resolve(__dirname, 'diagnose_output.txt')
function log(msg) {
  console.log(msg)
  fs.appendFileSync(logFile, msg + '\n')
}

async function diagnose() {
  fs.writeFileSync(logFile, '') // Clear file
  log('--- Diagnosing Allan Garces Link ---')

  // 1. Check Politician
  const { data: politician, error: polError } = await supabase
    .from('politicians')
    .select('*')
    .ilike('name', '%Allan%')
    .maybeSingle()
  
  if (polError) log('Error fetching politician: ' + polError.message)
  else log('Politician found: ' + (politician ? `${politician.name} (${politician.email}) - ID: ${politician.id}` : 'None'))

  // 2. Check User in 'users' table
  const email = 'dep.allangarces@camara.leg.br'
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (userError) log('Error fetching user from users: ' + userError.message)
  else log('User found in users: ' + (user ? `ID: ${user.id} - Email: ${user.email}` : 'None'))

  // 3. Check User in 'user_profiles' table
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (profileError) log('Error fetching user from user_profiles: ' + profileError.message)
  else log('User found in user_profiles: ' + (profile ? `ID: ${profile.id} - Email: ${profile.email}` : 'None'))

  // 4. Check for politician_id column in 'users'
  const { error: colError } = await supabase
    .from('users')
    .select('politician_id')
    .limit(1)
  
  if (colError) log('Column politician_id check in users: ' + colError.message)
  else log('Column politician_id exists in users.')

   // 5. Check for politician_id column in 'user_profiles'
  const { error: colError2 } = await supabase
    .from('user_profiles')
    .select('politician_id')
    .limit(1)
  
  if (colError2) log('Column politician_id check in user_profiles: ' + colError2.message)
  else log('Column politician_id exists in user_profiles.')
}

diagnose()
