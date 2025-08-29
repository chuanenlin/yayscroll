const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  'https://yfxhpbbduzpaopswotrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmeGhwYmJkdXpwYW9wc3dvdHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ1NTA4MCwiZXhwIjoyMDcyMDMxMDgwfQ.L01Z6HADkrPeDQCfwn9yT2_9DhvOjT6-84AjAE9UU3c'
)

async function setupDatabase() {
  try {
    console.log('Setting up database...')
    
    const sql = fs.readFileSync('./supabase-schema.sql', 'utf8')
    
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('Error executing SQL:', error)
    } else {
      console.log('Database setup completed successfully!')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

setupDatabase()