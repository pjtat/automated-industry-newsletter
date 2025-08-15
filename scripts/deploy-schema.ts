#!/usr/bin/env deno run --allow-net --allow-env --allow-read

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  Deno.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSQL(sql: string) {
  try {
    const { data, error } = await supabase.rpc('exec', { query: sql })
    if (error) {
      console.error('SQL Error:', error)
      return false
    }
    console.log('✓ SQL executed successfully')
    return true
  } catch (error) {
    console.error('Error executing SQL:', error)
    return false
  }
}

async function deploySchema() {
  console.log('🚀 Deploying database schema...')
  
  // Read the migration file
  const migrationSQL = await Deno.readTextFile('./supabase/migrations/001_initial_schema.sql')
  
  // Split by semicolons and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    console.log(`Executing: ${statement.slice(0, 50)}...`)
    const success = await runSQL(statement)
    if (!success) {
      console.error('❌ Migration failed')
      Deno.exit(1)
    }
  }
  
  console.log('✅ Schema deployment completed!')
}

if (import.meta.main) {
  await deploySchema()
}