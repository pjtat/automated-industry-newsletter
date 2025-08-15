import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export interface Article {
  id: string
  title: string
  url: string
  content?: string
  summary?: string
  source_id: string
  source_name: string
  published_date: string
  gathered_at: string
  relevance_score?: number
  topic_category?: string
  created_at: string
}

export interface User {
  id: string
  email: string
  name?: string
  topics: string[]
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly'
  delivery_day?: number
  delivery_time?: string
  article_count: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Source {
  id: string
  name: string
  url: string
  source_type: 'rss' | 'google_news'
  keywords: string[]
  active: boolean
  created_at: string
  updated_at: string
}