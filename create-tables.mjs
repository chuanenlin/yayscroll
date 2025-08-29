import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yfxhpbbduzpaopswotrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmeGhwYmJkdXpwYW9wc3dvdHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ1NTA4MCwiZXhwIjoyMDcyMDMxMDgwfQ.L01Z6HADkrPeDQCfwn9yT2_9DhvOjT6-84AjAE9UU3c'
)

async function createTables() {
  console.log('Creating tables...')

  // Create scrollers table
  const { error: scrollersError } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS scrollers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        prompt_template TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `
  })

  if (scrollersError) {
    console.log('Scrollers table creation result:', scrollersError)
  } else {
    console.log('✓ Scrollers table created')
  }

  // Create content_items table
  const { error: contentError } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS content_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        scroller_id UUID REFERENCES scrollers(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `
  })

  if (contentError) {
    console.log('Content items table creation result:', contentError)
  } else {
    console.log('✓ Content items table created')
  }

  console.log('Done!')
}

createTables()