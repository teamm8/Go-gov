-- Go-gov Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  microsoft_id VARCHAR(255) UNIQUE,
  department VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_microsoft_id ON users(microsoft_id);

-- Bookmarks table (go links)
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  keyword_lower VARCHAR(255) UNIQUE NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  search_template TEXT,
  usage_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_keyword_lower ON bookmarks(keyword_lower);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_usage_count ON bookmarks(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_by ON bookmarks(created_by);

-- Tags table (for future use)
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookmark tags junction table
CREATE TABLE IF NOT EXISTS bookmark_tags (
  bookmark_id INTEGER REFERENCES bookmarks(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
);

-- Bookmark history table (track all edits)
CREATE TABLE IF NOT EXISTS bookmark_history (
  id SERIAL PRIMARY KEY,
  bookmark_id INTEGER REFERENCES bookmarks(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  search_template TEXT,
  edited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_type VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookmark_history_bookmark_id ON bookmark_history(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_history_edited_at ON bookmark_history(edited_at DESC);

-- Failed searches table (track 404s for analytics)
CREATE TABLE IF NOT EXISTS failed_searches (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  keyword_lower VARCHAR(255) NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_failed_searches_keyword_lower ON failed_searches(keyword_lower);
CREATE INDEX IF NOT EXISTS idx_failed_searches_search_count ON failed_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_failed_searches_last_searched ON failed_searches(last_searched_at DESC);

-- Settings table (for admin configuration like anonymous creation)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings (key, value) VALUES ('allow_anonymous_creation', 'false') ON CONFLICT (key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
