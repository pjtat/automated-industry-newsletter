import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    console.log('Starting article gathering process...')

    // Get active sources
    const { data: sources, error: sourcesError } = await supabaseClient
      .from('sources')
      .select('*')
      .eq('active', true)

    if (sourcesError) {
      throw sourcesError
    }

    console.log(`Found ${sources.length} active sources`)

    let totalArticles = 0
    
    for (const source of sources) {
      console.log(`Processing source: ${source.name}`)
      
      try {
        // Fetch RSS feed
        const response = await fetch(source.url)
        const xmlText = await response.text()
        
        // Parse RSS (simplified - will enhance later)
        const articles = parseRSSFeed(xmlText, source)
        
        // Store articles
        for (const article of articles) {
          const { error: insertError } = await supabaseClient
            .from('articles')
            .insert(article)
            .onConflict('url')
            .ignoreDuplicates()
            
          if (insertError) {
            console.error(`Error inserting article: ${insertError.message}`)
          } else {
            totalArticles++
          }
        }
        
      } catch (error) {
        console.error(`Error processing source ${source.name}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Gathered ${totalArticles} new articles from ${sources.length} sources` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function parseRSSFeed(xmlText: string, source: any): any[] {
  // Basic RSS parsing - will enhance with proper XML parser later
  const articles: any[] = []
  
  try {
    // Extract items using regex (temporary solution)
    const itemRegex = /<item[^>]*>(.*?)<\/item>/gs
    const items = xmlText.match(itemRegex) || []
    
    for (const item of items.slice(0, 10)) { // Limit to 10 articles per source
      const title = extractXMLContent(item, 'title')
      const link = extractXMLContent(item, 'link')
      const pubDate = extractXMLContent(item, 'pubDate')
      const description = extractXMLContent(item, 'description')
      
      if (title && link) {
        articles.push({
          title: title.trim(),
          url: link.trim(),
          content: description?.trim() || '',
          source_id: source.id,
          source_name: source.name,
          published_date: pubDate ? new Date(pubDate) : new Date(),
          topic_category: categorizeArticle(title, description || ''),
        })
      }
    }
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
  }
  
  return articles
}

function extractXMLContent(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]><\/${tag}>|<${tag}[^>]*>(.*?)<\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? (match[1] || match[2] || '').replace(/<[^>]*>/g, '') : null
}

function categorizeArticle(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase()
  
  if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning')) {
    return 'Gen AI in Content'
  }
  if (text.includes('dub') || text.includes('localization') || text.includes('translation')) {
    return 'Dubbing Technology'
  }
  if (text.includes('production') || text.includes('post-production') || text.includes('editing')) {
    return 'Production Tools'
  }
  if (text.includes('netflix') || text.includes('disney') || text.includes('amazon') || text.includes('prime')) {
    return 'Streaming Platforms'
  }
  
  return 'General Streaming Industry'
}