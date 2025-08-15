# Streaming Industry Newsletter System

## Overview
Automated newsletter that gathers streaming industry articles, uses AI to find the best ones, summarizes them, and emails them to me on a schedule.

## Tech Stack
- Supabase (database + Edge Functions)
- OpenAI GPT (article evaluation + summarization) 
- Gmail SMTP (email delivery)
- RSS feeds + Google News (article sources)

## Key Files
- `tasks/prd-streaming-industry-newsletter.md` - Full requirements
- `config/newsletter-config.yaml` - All settings and preferences
- `.env` - API keys and SMTP config

## Focus Areas
- Streaming companies: Netflix, Disney, Amazon Prime
- Gen AI in content creation
- Dubbing/localization tech
- Production/post-production tools

## Implementation Notes
- Personal use only (emails to myself)
- No UI needed - just email delivery
- Prevent duplicate articles forever
- Use Supabase pg_cron for scheduling