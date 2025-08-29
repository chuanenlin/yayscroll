import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yfxhpbbduzpaopswotrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmeGhwYmJkdXpwYW9wc3dvdHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ1NTA4MCwiZXhwIjoyMDcyMDMxMDgwfQ.L01Z6HADkrPeDQCfwn9yT2_9DhvOjT6-84AjAE9UU3c'
)

async function testConnection() {
  try {
    console.log('Testing basic Supabase connection...')
    const { data, error } = await supabase.from('scrollers').select('count').limit(1)
    
    if (error) {
      console.log('Connection test failed:', error.message)
      
      // Test if it's a table issue vs connection issue
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✓ Connection works, but tables don\'t exist')
        return 'tables_missing'
      } else {
        console.log('✗ Connection failed')
        return 'connection_failed'
      }
    } else {
      console.log('✓ Connection successful:', data)
      return 'success'
    }
  } catch (err) {
    console.log('✗ Network error:', err.message)
    return 'network_error'
  }
}

testConnection().then(result => {
  console.log('Result:', result)
  process.exit(0)
})