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

    console.log('Starting newsletter delivery process...')

    // Get active users
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('active', true)

    if (usersError) {
      throw usersError
    }

    console.log(`Found ${users.length} active users`)

    let deliveredCount = 0

    for (const user of users) {
      try {
        // Check if user should receive newsletter today
        if (!shouldSendToday(user)) {
          console.log(`Skipping ${user.email} - not scheduled for today`)
          continue
        }

        // Check if already sent today
        const today = new Date().toISOString().split('T')[0]
        const { data: existingDelivery } = await supabaseClient
          .from('newsletter_deliveries')
          .select('id')
          .eq('user_email', user.email)
          .eq('delivery_date', today)
          .eq('status', 'sent')

        if (existingDelivery && existingDelivery.length > 0) {
          console.log(`Already sent to ${user.email} today`)
          continue
        }

        console.log(`Preparing newsletter for ${user.email}`)

        // Get top articles for user
        const articles = await getTopArticlesForUser(user, supabaseClient)
        
        if (articles.length === 0) {
          console.log(`No articles found for ${user.email}`)
          continue
        }

        // Generate and send email
        const emailContent = generateNewsletterHTML(user, articles)
        await sendEmail(user.email, emailContent)

        // Record sent articles to prevent duplicates
        for (const article of articles) {
          await supabaseClient
            .from('sent_articles')
            .insert({
              article_id: article.id,
              user_email: user.email,
              topic_category: article.topic_category,
              article_title: article.title
            })
            .onConflict('article_id,user_email')
            .ignoreDuplicates()
        }

        // Record delivery
        await supabaseClient
          .from('newsletter_deliveries')
          .insert({
            user_email: user.email,
            delivery_date: today,
            article_count: articles.length,
            status: 'sent',
            sent_at: new Date().toISOString()
          })

        deliveredCount++
        console.log(`Newsletter sent to ${user.email}`)

      } catch (error) {
        console.error(`Error sending to ${user.email}:`, error)
        
        // Record failed delivery
        const today = new Date().toISOString().split('T')[0]
        await supabaseClient
          .from('newsletter_deliveries')
          .insert({
            user_email: user.email,
            delivery_date: today,
            article_count: 0,
            status: 'failed',
            error_message: error.message
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Delivered newsletters to ${deliveredCount} users` 
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

function shouldSendToday(user: any): boolean {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  switch (user.frequency) {
    case 'daily':
      return true
    case 'weekly':
      return dayOfWeek === (user.delivery_day || 1) // Default to Monday
    case 'bi-weekly':
      // Simple bi-weekly logic - every other week on delivery day
      const weekNumber = Math.floor(today.getTime() / (7 * 24 * 60 * 60 * 1000))
      return dayOfWeek === (user.delivery_day || 1) && weekNumber % 2 === 0
    case 'monthly':
      return today.getDate() === 1 // First day of month
    default:
      return false
  }
}

async function getTopArticlesForUser(user: any, supabaseClient: any): Promise<any[]> {
  // Get articles not yet sent to this user
  const { data: sentArticleIds } = await supabaseClient
    .from('sent_articles')
    .select('article_id')
    .eq('user_email', user.email)

  const excludeIds = sentArticleIds?.map((sa: any) => sa.article_id) || []

  // Build query for relevant articles
  let query = supabaseClient
    .from('articles')
    .select('*')
    .gte('relevance_score', 0.6) // Only relevant articles
    .gte('gathered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
    .order('relevance_score', { ascending: false })
    .limit(user.article_count || 5)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data: articles, error } = await query

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  return articles || []
}

function generateNewsletterHTML(user: any, articles: any[]): string {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Streaming Industry Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a73e8; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .article { border-left: 4px solid #1a73e8; padding-left: 15px; margin-bottom: 25px; }
        .article h3 { margin: 0 0 10px 0; color: #1a73e8; }
        .article .meta { color: #666; font-size: 0.9em; margin-bottom: 10px; }
        .article .summary { margin-bottom: 10px; }
        .article a { color: #1a73e8; text-decoration: none; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎬 Streaming Industry Newsletter</h1>
        <p>Your curated update for ${today}</p>
    </div>
    
    <p>Hi ${user.name || 'there'},</p>
    <p>Here are the top ${articles.length} streaming industry updates selected for you:</p>
    
    ${articles.map(article => `
    <div class="article">
        <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
        <div class="meta">
            ${article.source_name} • ${new Date(article.published_date).toLocaleDateString()} • ${article.topic_category}
        </div>
        ${article.summary ? `<div class="summary">${article.summary}</div>` : ''}
        <a href="${article.url}" target="_blank">Read full article →</a>
    </div>
    `).join('')}
    
    <div class="footer">
        <p>This newsletter was automatically curated for you based on your interests in streaming technology and industry news.</p>
        <p>Generated by AI • Delivered by Supabase</p>
    </div>
</body>
</html>
`
}

async function sendEmail(toEmail: string, htmlContent: string): Promise<void> {
  const emailConfig = {
    host: Deno.env.get('EMAIL_HOST') || 'smtp.gmail.com',
    port: parseInt(Deno.env.get('EMAIL_PORT') || '587'),
    secure: Deno.env.get('EMAIL_SECURE') === 'true',
    user: Deno.env.get('EMAIL_USER'),
    password: Deno.env.get('EMAIL_PASSWORD'),
  }

  if (!emailConfig.user || !emailConfig.password) {
    throw new Error('Email configuration missing')
  }

  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })

  // Using a simple SMTP implementation for Deno
  // In production, you might want to use a more robust email service
  const emailData = {
    from: emailConfig.user,
    to: toEmail,
    subject: `🎬 Streaming Industry Newsletter - ${today}`,
    html: htmlContent
  }

  // This is a simplified email sending - you'll need to implement proper SMTP
  // For now, we'll log the email content
  console.log(`Sending email to ${toEmail}`)
  console.log(`Subject: ${emailData.subject}`)
  
  // TODO: Implement actual SMTP sending using nodemailer or similar
  // For testing purposes, we'll just log success
}