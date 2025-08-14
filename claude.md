# Streaming Industry Newsletter System

## Project Overview
An automated newsletter system that curates streaming industry articles using AI and delivers personalized newsletters to team members. Eliminates manual curation time by automatically gathering, evaluating, and summarizing the most relevant streaming technology content.

## Key Documents
- **PRD:** `tasks/prd-streaming-industry-newsletter.md` - Complete product requirements
- **Config:** `config/newsletter-config.yaml` - User preferences and system settings

## Tech Stack
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Email:** Mailgun API (100 emails/day free tier)
- **AI:** OpenAI GPT API (article evaluation + summarization)
- **Sources:** RSS feeds + NewsAPI
- **Scheduling:** Supabase pg_cron extension
- **Config:** YAML file in project root

## Target Content Focus
- Streaming industry companies: Netflix, Disney, Amazon Prime, etc.
- Production/post-production technology updates
- Gen AI applications in content creation
- Dubbing and localization technologies
- Streaming platform technical innovations

## Key Features
- AI-powered article relevance scoring
- Duplicate detection (same newsletter + historical)
- Configurable delivery schedules per user
- Article summarization for quick reading
- Team-based configuration (no UI needed)

## Architecture Notes
- All user preferences configured via YAML (no runtime customization)
- Permanent article history storage for duplicate prevention
- Supabase Edge Functions handle all processing
- Direct database integration for efficiency

## Environment Setup
- Copy `.env.example` to `.env` and fill in your API keys
- Configure team settings in `config/newsletter-config.yaml`
- All sensitive data stored in `.env` (not committed to git)

## Configuration
- **User Settings:** `config/newsletter-config.yaml`
- **API Keys:** `.env` file (use .env.example as template)
- **Topic Categories:** Defined in newsletter-config.yaml

## Development Priorities
1. Article gathering pipeline (RSS + NewsAPI)
2. OpenAI integration for evaluation/summarization
3. Duplicate detection system
4. Email template generation
5. Scheduling system with pg_cron

## Current Status
- PRD completed and reviewed
- Architecture decisions finalized
- Ready for implementation

## Important Constraints
- No web UI required - email delivery only
- Configuration via file only (no runtime changes)
- Must prevent duplicate articles forever (not time-limited)
- Team use within company (not external users)