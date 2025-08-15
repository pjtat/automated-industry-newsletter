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

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Starting article processing...')

    // Get unprocessed articles (no relevance score)
    const { data: articles, error: articlesError } = await supabaseClient
      .from('articles')
      .select('*')
      .is('relevance_score', null)
      .order('gathered_at', { ascending: false })
      .limit(20) // Process 20 at a time

    if (articlesError) {
      throw articlesError
    }

    console.log(`Found ${articles.length} articles to process`)

    let processedCount = 0

    for (const article of articles) {
      try {
        console.log(`Processing article: ${article.title}`)
        
        // Evaluate relevance with OpenAI
        const relevanceScore = await evaluateArticleRelevance(article, openaiApiKey)
        
        // Generate summary if highly relevant
        let summary = ''
        if (relevanceScore >= 0.6) {
          summary = await generateArticleSummary(article, openaiApiKey)
        }

        // Update article
        const { error: updateError } = await supabaseClient
          .from('articles')
          .update({
            relevance_score: relevanceScore,
            summary: summary
          })
          .eq('id', article.id)

        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError)
        } else {
          processedCount++
        }

        // Rate limiting - wait 1 second between OpenAI calls
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedCount} articles` 
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

async function evaluateArticleRelevance(article: any, apiKey: string): Promise<number> {
  const prompt = `
Evaluate the relevance of this article to the streaming industry and production technology.

Focus areas:
- Streaming platforms (Netflix, Disney+, Amazon Prime, etc.)
- Content production and post-production technology
- AI in content creation and media
- Dubbing and localization technology
- Streaming infrastructure and technology

Article Title: ${article.title}
Article Content: ${article.content?.slice(0, 500) || 'No content available'}
Source: ${article.source_name}

Rate relevance from 0.0 to 1.0 where:
- 1.0 = Highly relevant to streaming industry technology/production
- 0.8 = Very relevant to streaming platforms or content tech
- 0.6 = Moderately relevant to media/entertainment technology
- 0.4 = Somewhat relevant to general technology/media
- 0.2 = Barely relevant
- 0.0 = Not relevant

Respond with only a number between 0.0 and 1.0.
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    })

    const data = await response.json()
    const scoreText = data.choices[0]?.message?.content?.trim()
    const score = parseFloat(scoreText || '0')
    
    return isNaN(score) ? 0 : Math.max(0, Math.min(1, score))
  } catch (error) {
    console.error('Error evaluating article relevance:', error)
    return 0
  }
}

async function generateArticleSummary(article: any, apiKey: string): Promise<string> {
  const prompt = `
Summarize this streaming industry article in 2-3 concise sentences. Focus on the key technology, business, or industry implications.

Title: ${article.title}
Content: ${article.content?.slice(0, 1000) || 'No content available'}

Provide a professional summary suitable for a technology newsletter.
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    return data.choices[0]?.message?.content?.trim() || 'Summary unavailable'
  } catch (error) {
    console.error('Error generating article summary:', error)
    return 'Summary unavailable'
  }
}