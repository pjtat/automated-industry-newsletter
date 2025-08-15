#!/usr/bin/env deno run --allow-net --allow-env --allow-read

// Test script to verify Supabase connection and basic functionality
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { load } from 'https://deno.land/std@0.208.0/dotenv/mod.ts'

// Load environment variables
await load({ export: true })

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  Deno.exit(1)
}

console.log('🔍 Testing Supabase connection...')
console.log(`URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseKey)

try {
  // Test 1: Basic connection
  console.log('\n1️⃣ Testing basic connection...')
  const { data, error } = await supabase.from('sources').select('count').single()
  
  if (error && error.code === 'PGRST205') {
    console.log('⚠️  Tables not yet created - this is expected on first run')
    console.log('📝 Creating database schema...')
    
    // Read and execute the migration
    const migrationSQL = await Deno.readTextFile('./supabase/migrations/001_initial_schema.sql')
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`   ${i + 1}/${statements.length}: ${statement.slice(0, 50)}...`)
      
      try {
        // Use the SQL function in Supabase
        const { error: sqlError } = await supabase.rpc('exec', {
          sql: statement + ';'
        })
        
        if (sqlError) {
          console.error(`   ❌ Error: ${sqlError.message}`)
        } else {
          console.log(`   ✅ Success`)
        }
      } catch (err) {
        console.error(`   ❌ Exception: ${err.message}`)
        // Try alternative approach with raw SQL
        console.log('   🔄 Trying alternative method...')
      }
    }
    
  } else if (error) {
    console.error('❌ Connection failed:', error)
    Deno.exit(1)
  } else {
    console.log('✅ Database connection successful!')
  }

  // Test 2: Check if tables exist
  console.log('\n2️⃣ Checking database schema...')
  const tables = ['sources', 'articles', 'users', 'sent_articles', 'newsletter_deliveries']
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.log(`   ❌ Table '${table}' not accessible: ${error.message}`)
      } else {
        console.log(`   ✅ Table '${table}' exists and accessible`)
      }
    } catch (err) {
      console.log(`   ❌ Table '${table}' error: ${err.message}`)
    }
  }

  // Test 3: Test OpenAI connection
  console.log('\n3️⃣ Testing OpenAI connection...')
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiKey) {
    console.log('❌ OPENAI_API_KEY not found')
  } else {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`
        }
      })
      
      if (response.ok) {
        console.log('✅ OpenAI API connection successful')
      } else {
        console.log(`❌ OpenAI API error: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.log(`❌ OpenAI connection failed: ${err.message}`)
    }
  }

  // Test 4: Test email configuration
  console.log('\n4️⃣ Checking email configuration...')
  const emailUser = Deno.env.get('EMAIL_USER')
  const emailPassword = Deno.env.get('EMAIL_PASSWORD')
  
  if (!emailUser || !emailPassword) {
    console.log('❌ Email configuration incomplete')
  } else {
    console.log(`✅ Email configured for: ${emailUser}`)
  }

  console.log('\n🎉 Connection test completed!')
  
} catch (error) {
  console.error('❌ Test failed:', error)
  Deno.exit(1)
}