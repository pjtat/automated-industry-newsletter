-- Newsletter System Database Schema

-- Sources table for RSS feeds and news sources
CREATE TABLE sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'google_news')),
    keywords TEXT[], -- For Google News searches
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table for storing gathered articles
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    content TEXT,
    summary TEXT,
    source_id UUID REFERENCES sources(id),
    source_name TEXT NOT NULL, -- Denormalized for easier queries
    published_date TIMESTAMP WITH TIME ZONE,
    gathered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    topic_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table for newsletter subscribers (loaded from config)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    topics TEXT[], -- Array of topic preferences
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    delivery_day INTEGER, -- Day of week (0-6) for weekly/bi-weekly
    delivery_time TIME, -- Time of day for delivery
    article_count INTEGER DEFAULT 5 CHECK (article_count >= 3 AND article_count <= 15),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sent articles table for duplicate prevention
CREATE TABLE sent_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES articles(id),
    user_email TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    topic_category TEXT,
    article_title TEXT NOT NULL, -- Denormalized for dedup checking
    UNIQUE(article_id, user_email)
);

-- Newsletter deliveries table for tracking
CREATE TABLE newsletter_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    article_count INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_articles_published_date ON articles(published_date DESC);
CREATE INDEX idx_articles_relevance_score ON articles(relevance_score DESC);
CREATE INDEX idx_articles_source_id ON articles(source_id);
CREATE INDEX idx_sent_articles_user_email ON sent_articles(user_email);
CREATE INDEX idx_sent_articles_sent_at ON sent_articles(sent_at);
CREATE INDEX idx_newsletter_deliveries_user_email ON newsletter_deliveries(user_email);
CREATE INDEX idx_newsletter_deliveries_delivery_date ON newsletter_deliveries(delivery_date);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial Google News RSS sources
INSERT INTO sources (name, url, source_type, keywords) VALUES
('Netflix Streaming News', 'https://news.google.com/rss/search?q=Netflix+streaming&hl=en&gl=US&ceid=US:en', 'google_news', ARRAY['Netflix', 'streaming']),
('Disney Streaming Platform', 'https://news.google.com/rss/search?q=Disney+streaming+platform&hl=en&gl=US&ceid=US:en', 'google_news', ARRAY['Disney', 'streaming', 'platform']),
('Amazon Prime Video', 'https://news.google.com/rss/search?q=Amazon+Prime+Video&hl=en&gl=US&ceid=US:en', 'google_news', ARRAY['Amazon', 'Prime Video']),
('AI Content Creation', 'https://news.google.com/rss/search?q="generative+AI"+content+creation&hl=en&gl=US&ceid=US:en', 'google_news', ARRAY['AI', 'content creation', 'generative']),
('Dubbing Localization Tech', 'https://news.google.com/rss/search?q=dubbing+localization+technology&hl=en&gl=US&ceid=US:en', 'google_news', ARRAY['dubbing', 'localization', 'technology']),
('Streaming Production Tools', 'https://news.google.com/rss/search?q=streaming+production+post-production+tools&hl=en&gl=US&ceid=US:en', 'google_news', ARRAY['streaming', 'production', 'post-production']);