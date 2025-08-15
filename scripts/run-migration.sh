#!/bin/bash

# Load environment variables
source .env

echo "🚀 Running database migration..."

# Create sources table
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS sources (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE, source_type TEXT NOT NULL CHECK (source_type IN ('"'"'rss'"'"', '"'"'google_news'"'"')), keywords TEXT[], active BOOLEAN DEFAULT true, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());"
  }'

echo "Created sources table"

# Add more tables as separate requests
echo "✅ Migration completed!"