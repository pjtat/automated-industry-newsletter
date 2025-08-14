# Product Requirements Document: Streaming Industry Newsletter System

## Introduction/Overview

The Streaming Industry Newsletter System is an automated content curation and delivery platform designed to solve the time-consuming manual process of staying updated on production/post-production technology in the streaming industry. The system will automatically gather articles from multiple sources, use AI to evaluate and rank content based on relevance and impact, summarize the top articles, and deliver personalized newsletters to team members on their preferred schedule.

**Problem Statement:** Team members currently spend significant time manually searching for and curating industry news about streaming technology companies (Netflix, Disney, Amazon, etc.) and emerging technologies (Gen AI in content creation, dubbing technologies, etc.), leading to inconsistent coverage and time inefficiency.

**Goal:** Automate the entire content curation pipeline to deliver high-quality, personalized industry insights without manual intervention.

## Goals

1. **Reduce Manual Curation Time:** Eliminate 90% of time spent on manual article gathering and initial filtering
2. **Improve Content Quality:** Deliver only the most relevant and impactful articles through AI-powered selection
3. **Ensure Consistent Coverage:** Provide regular, scheduled updates to all team members
4. **Enable Personalization:** Allow team members to customize topics, frequency, and article count based on their roles
5. **Maintain Relevance:** Focus specifically on production/post-production streaming technology and major industry players

## User Stories

**As a team member, I want to:**
- Receive a curated newsletter with the most important streaming industry updates so that I stay informed without spending hours researching
- Configure my newsletter preferences (topics, frequency, article count) so that I receive content tailored to my role and interests
- Get AI-generated summaries of key articles so that I can quickly understand the main points without reading full articles
- Receive newsletters on my preferred schedule so that updates fit my workflow

**As a team administrator, I want to:**
- Add new RSS feeds and news sources so that we capture content from emerging industry publications
- Configure content filtering keywords so that we focus on the most relevant streaming technology topics
- Monitor system performance and delivery status so that I can ensure reliable newsletter delivery

## Functional Requirements

### Content Gathering
1. The system must integrate with RSS feeds from streaming industry publications and technology blogs
2. The system must integrate with news APIs (NewsAPI, Google News) to search for articles using streaming industry keywords
3. The system must allow administrators to add, remove, and modify content sources through configuration
4. The system must gather articles on a daily basis to ensure fresh content availability
5. The system must filter articles based on predefined keywords related to streaming technology and major industry companies

### Content Processing & Selection
6. The system must use OpenAI GPT to evaluate articles based on relevance to streaming industry technology
7. The system must rank articles considering factors including: relevance to specified topics, recency, source credibility, and technical depth
8. The system must allow users to configure the number of top articles to include in their newsletter (range: 3-15 articles)
9. The system must generate concise summaries for selected articles using OpenAI GPT
10. The system must maintain article metadata including source, publication date, and relevance score
11. The system must store previously sent article topics/titles to prevent duplicate content in future newsletters (permanent history)
12. The system must use OpenAI GPT to determine if articles cover the same topic for deduplication within the same newsletter and against historical sent articles

### User Management & Personalization
13. The system must support multiple team members with individual newsletter preferences
14. The system must read user configuration from a project configuration file (no runtime customization needed)
15. The system must support configuration of delivery frequency (daily, weekly, bi-weekly, monthly) per user in config file
16. The system must support configuration of custom delivery day and time per user in config file
17. The system must support topic customization per user with predefined categories (e.g., "Gen AI in Content", "Dubbing Technology", "Streaming Platforms", "Production Tools") in config file
18. The system must support configurable article count per user (range: 3-15 articles) in config file

### Email Delivery
19. The system must integrate with Mailgun for reliable and cost-effective email delivery (100 emails/day free tier)
20. The system must generate well-formatted HTML email newsletters with article summaries, links, and source attribution
21. The system must send newsletters according to each user's configured schedule from the config file
22. The system must handle email delivery failures with retry logic
23. The system must include unsubscribe functionality in all emails

### System Architecture
24. The system must be deployed using Supabase Edge Functions for scalability and seamless database integration
25. The system must implement scheduled jobs using Supabase's pg_cron extension for content gathering, processing, and delivery
26. The system must log all operations for debugging and monitoring purposes using Supabase logging
27. The system must handle API rate limits for external services (OpenAI, NewsAPI, Mailgun)
28. The system must store processed articles, sent article history, and user data in Supabase PostgreSQL database

## Non-Goals (Out of Scope)

- **Web User Interface:** No web-based dashboard or user management interface in initial version
- **Real-time Notifications:** No instant alerts or push notifications for breaking news
- **Social Media Integration:** No content gathering from Twitter, LinkedIn, or other social platforms
- **Advanced Analytics:** No detailed metrics on article engagement or user behavior
- **Multi-language Support:** English-only content and newsletters
- **Mobile Application:** No dedicated mobile app
- **Comment/Feedback System:** No user feedback collection on article relevance
- **Archive/Search Functionality:** No searchable archive of past newsletters

## Technical Considerations

### Architecture Recommendations
- **Serverless Framework:** Use Supabase Edge Functions for scheduled content processing and email generation
- **Database:** Supabase (PostgreSQL) for user preferences, article metadata, and sent article history storage
- **Job Scheduling:** Supabase Cron Jobs (pg_cron extension) for scheduled newsletter delivery
- **Configuration Management:** Store RSS feeds, keywords, and user preferences in YAML configuration file in project root or Supabase storage
- **Error Handling:** Implement comprehensive logging with Supabase logging and monitoring

### API Integrations
- **OpenAI GPT API:** For article evaluation and summarization (monitor token usage and costs)
- **NewsAPI:** For gathering articles from news sources (respect rate limits)
- **Mailgun or MailerSend API:** For email delivery (handle bounces and delivery failures)
- **RSS Parsing:** Use reliable RSS parsing library with error handling for malformed feeds

### Data Models
- **Users:** email, preferences loaded from config file (topics, frequency, schedule, article_count)
- **Articles:** title, url, content, source, published_date, relevance_score, summary, topic_category
- **Sources:** RSS feed URLs, API endpoints, keywords, active status
- **Sent_Articles:** article_id, user_email, sent_date, topic_category (for duplicate prevention)

## Success Metrics

1. **Time Savings:** Reduce manual curation time from 2+ hours per week to 15 minutes for preference management
2. **Content Quality:** Achieve 80%+ user satisfaction with article relevance (measured through periodic surveys)
3. **Delivery Reliability:** Maintain 99%+ newsletter delivery success rate
4. **System Performance:** Process and deliver newsletters within 2 hours of scheduled time
5. **User Adoption:** 90%+ of team members actively receiving newsletters within 30 days of launch

## Open Questions

1. **Content Volume:** What is the expected daily volume of articles from all sources combined? This affects processing costs and infrastructure requirements.

2. **Content Rights:** Do we need to store full article content for summarization, or can we work with excerpts? This affects storage requirements and potential copyright considerations.

3. **Backup Communication:** If the primary system fails, should there be a fallback notification method to alert users about missed newsletters?

4. **Source Management:** Should there be a process for automatically discovering new relevant RSS feeds, or will this be purely manual curation?

5. **Content Deduplication:** How should the system handle the same story appearing across multiple sources?

6. **Historical Data:** Should the system maintain a history of sent newsletters for reference, and if so, for how long?

7. **Testing Strategy:** How will we validate that the AI is correctly identifying the most relevant articles before going live with the team?