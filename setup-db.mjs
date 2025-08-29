import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yfxhpbbduzpaopswotrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmeGhwYmJkdXpwYW9wc3dvdHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ1NTA4MCwiZXhwIjoyMDcyMDMxMDgwfQ.L01Z6HADkrPeDQCfwn9yT2_9DhvOjT6-84AjAE9UU3c'
)

async function setupDatabase() {
  try {
    console.log('Creating test scroller...')
    
    // Create a test scroller
    const { data: scroller, error: scrollerError } = await supabase
      .from('scrollers')
      .insert([
        {
          slug: 'wikipedia-facts',
          title: 'Wikipedia Facts',
          prompt_template: 'Generate a random interesting fact from Wikipedia with a brief explanation. Make it engaging and educational.',
        },
      ])
      .select()
      .single()

    if (scrollerError) {
      console.log('Scroller might already exist or error occurred:', scrollerError.message)
    } else {
      console.log('Test scroller created:', scroller)
    }

    console.log('Database setup completed!')
  } catch (error) {
    console.error('Error:', error)
  }
}

setupDatabase()