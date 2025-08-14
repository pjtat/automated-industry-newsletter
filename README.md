# Automated Industry Newsletter

An AI-powered newsletter system that automatically curates and summarizes streaming industry articles, delivering personalized content via email.

## Overview

This system gathers articles from RSS feeds and Google News, uses OpenAI GPT to evaluate relevance and summarize content, then sends personalized newsletters based on configured preferences.

## Features

- **AI-Powered Curation**: Uses OpenAI GPT to evaluate article relevance and quality
- **Smart Summarization**: Generates concise summaries of the most important articles  
- **Duplicate Prevention**: Prevents sending the same articles using AI-powered similarity detection
- **Flexible Scheduling**: Configurable delivery frequency and timing
- **Multiple Sources**: Supports RSS feeds and Google News searches
- **Focus Areas**: Streaming industry, production technology, Gen AI in content creation

## Tech Stack

- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT API
- **Email**: Gmail SMTP
- **Sources**: RSS feeds + Google News
- **Scheduling**: Supabase pg_cron

## Setup

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key
- Gmail account with app password

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pjtat/automated-industry-newsletter.git
   cd automated-industry-newsletter
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and credentials
   ```

3. **Update configuration**
   ```bash
   # Edit config/newsletter-config.yaml with your preferences
   ```

### Required API Keys

- **Supabase**: Get from your Supabase project dashboard
- **OpenAI**: Get from https://platform.openai.com/api-keys
- **Gmail SMTP**: Generate app password in Google Account settings

## Configuration

All settings are managed in `config/newsletter-config.yaml`:

- **User preferences**: Email, topics, frequency, article count
- **Content sources**: RSS feeds and Google News search terms
- **AI settings**: Relevance thresholds and processing parameters

## Usage

The system runs automatically based on the configured schedule. Articles are:

1. Gathered from RSS feeds and Google News
2. Evaluated for relevance using AI
3. Deduplicated against historical articles
4. Summarized and formatted
5. Delivered via email

## Project Structure

```
├── README.md
├── LICENSE
├── claude.md                          # Claude Code context
├── .env.example                       # Environment template
├── .gitignore
├── config/
│   └── newsletter-config.yaml         # Main configuration
├── tasks/
│   └── prd-streaming-industry-newsletter.md
└── docs/
    └── development-notes.md
```

## Development

This project is designed to work with Claude Code for AI-assisted development.

See `tasks/prd-streaming-industry-newsletter.md` for detailed requirements and specifications.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

This is a personal project, but feel free to fork and adapt for your own use cases.