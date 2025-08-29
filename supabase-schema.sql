-- Create scrollers table
CREATE TABLE IF NOT EXISTS scrollers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scroller_id UUID REFERENCES scrollers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scrollers_slug ON scrollers(slug);
CREATE INDEX IF NOT EXISTS idx_content_items_scroller_id ON content_items(scroller_id);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE scrollers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public app)
CREATE POLICY "Allow public read access on scrollers" ON scrollers
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on scrollers" ON scrollers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on content_items" ON content_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on content_items" ON content_items
  FOR INSERT WITH CHECK (true);