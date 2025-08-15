#!/usr/bin/env deno run --allow-net --allow-env --allow-read

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { load } from 'https://deno.land/std@0.208.0/dotenv/mod.ts'
import { parse } from 'https://deno.land/std@0.208.0/yaml/mod.ts'

await load({ export: true })

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

console.log('🚀 Setting up database for newsletter system...')

// Step 1: Create tables using individual statements
console.log('\n📋 Creating database tables...')

const tableQueries = [
  // Sources table
  `CREATE TABLE IF NOT EXISTS sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'google_news')),
    keywords TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Articles table
  `CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    content TEXT,
    summary TEXT,
    source_id UUID REFERENCES sources(id),
    source_name TEXT NOT NULL,
    published_date TIMESTAMP WITH TIME ZONE,
    gathered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    relevance_score DECIMAL(3,2),
    topic_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    topics TEXT[],
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    delivery_day INTEGER,
    delivery_time TIME,
    article_count INTEGER DEFAULT 5 CHECK (article_count >= 3 AND article_count <= 15),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Sent articles table
  `CREATE TABLE IF NOT EXISTS sent_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES articles(id),
    user_email TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    topic_category TEXT,
    article_title TEXT NOT NULL,
    UNIQUE(article_id, user_email)
  )`,

  // Newsletter deliveries table
  `CREATE TABLE IF NOT EXISTS newsletter_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    article_count INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
  )`
]

// Execute table creation queries directly using REST API
for (let i = 0; i < tableQueries.length; i++) {
  const query = tableQueries[i]
  const tableName = query.match(/CREATE TABLE[^`]*?(\w+)/)?.[1] || `table_${i + 1}`
  
  console.log(`   Creating ${tableName}...`)
  
  try {
    // Use direct REST API call to execute SQL
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: query })
    })

    if (response.ok) {
      console.log(`   ✅ ${tableName} created successfully`)
    } else {
      const error = await response.text()
      console.log(`   ⚠️  ${tableName}: ${error}`)
    }
  } catch (error) {
    console.log(`   ❌ Error creating ${tableName}: ${error.message}`)
  }
}

// Step 2: Create indexes
console.log('\n📊 Creating database indexes...')

const indexQueries = [
  'CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published_date DESC)',
  'CREATE INDEX IF NOT EXISTS idx_articles_relevance_score ON articles(relevance_score DESC)',
  'CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id)',
  'CREATE INDEX IF NOT EXISTS idx_sent_articles_user_email ON sent_articles(user_email)',
  'CREATE INDEX IF NOT EXISTS idx_sent_articles_sent_at ON sent_articles(sent_at)',
  'CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_user_email ON newsletter_deliveries(user_email)',
  'CREATE INDEX IF NOT EXISTS idx_newsletter_deliveries_delivery_date ON newsletter_deliveries(delivery_date)'
]

for (const indexQuery of indexQueries) {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: indexQuery })
    })

    if (response.ok) {
      console.log(`   ✅ Index created`)
    } else {
      console.log(`   ⚠️  Index creation: ${await response.text()}`)
    }
  } catch (error) {
    console.log(`   ❌ Error creating index: ${error.message}`)
  }
}

// Step 3: Load configuration data
console.log('\n📄 Loading configuration data...')

try {
  const configText = await Deno.readTextFile('./config/newsletter-config.yaml')
  const config = parse(configText) as any

  // Insert sources from config
  console.log('   Adding RSS sources...')
  for (const source of config.rss_sources) {
    if (source.active) {
      const { error } = await supabase
        .from('sources')
        .insert({
          name: source.name,
          url: source.url,
          source_type: 'google_news',
          keywords: [source.category],
          active: source.active
        })
        .onConflict('url')
        .ignoreDuplicates()

      if (error) {
        console.log(`   ⚠️  Error adding ${source.name}: ${error.message}`)
      } else {
        console.log(`   ✅ Added ${source.name}`)
      }
    }
  }

  // Insert users from config
  console.log('   Adding users...')
  for (const user of config.users) {
    const { error } = await supabase
      .from('users')
      .insert({
        email: user.email,
        name: user.name,
        topics: user.topics,
        frequency: user.frequency,
        delivery_day: getDayNumber(user.delivery_day),
        delivery_time: user.delivery_time,
        article_count: user.article_count,
        active: true
      })
      .onConflict('email')
      .ignoreDuplicates()

    if (error) {
      console.log(`   ⚠️  Error adding user ${user.email}: ${error.message}`)
    } else {
      console.log(`   ✅ Added user ${user.email}`)
    }
  }

} catch (error) {
  console.log(`   ❌ Error loading config: ${error.message}`)
}

// Step 4: Verify setup
console.log('\n🔍 Verifying database setup...')

const tables = ['sources', 'articles', 'users', 'sent_articles', 'newsletter_deliveries']
for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: accessible`)
    }
  } catch (err) {
    console.log(`   ❌ ${table}: ${err.message}`)
  }
}

console.log('\n🎉 Database setup completed!')

function getDayNumber(day: string): number {
  const days = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  }
  return days[day.toLowerCase() as keyof typeof days] || 1
}