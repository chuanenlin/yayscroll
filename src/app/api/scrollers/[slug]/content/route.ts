import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { db } from '@/lib/database'

// Removed isContentSimilar function - now using GPT context awareness instead of post-generation filtering

interface Params {
  slug: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const loadMore = searchParams.get('loadMore') === 'true'
    const offset = parseInt(searchParams.get('offset') || '0')
    
    console.log(`🔥 [API] Request: slug=${slug}, loadMore=${loadMore}, offset=${offset}`)
    
    // Rate limiting to prevent excessive API calls
    const now = Date.now()
    const rateLimitKey = `rate_limit_${slug}`
    
    // Simple in-memory rate limiting (in production, use Redis)
    const globalCache = global as unknown as Record<string, { lastCall: number; calls: number }>
    if (!globalCache[rateLimitKey]) globalCache[rateLimitKey] = { lastCall: 0, calls: 0 }
    const rateLimit = globalCache[rateLimitKey]
    
    // Allow max 3 calls per minute per scroller
    if (now - rateLimit.lastCall < 60000 && rateLimit.calls >= 3) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    
    if (now - rateLimit.lastCall >= 60000) {
      rateLimit.calls = 0
    }
    rateLimit.calls++
    rateLimit.lastCall = now

    // Initialize database connection
    await db.initialize()

    // Get scroller
    const scroller = await db.getScrollerBySlug(slug)

    if (!scroller) {
      return NextResponse.json({ error: 'Scroller not found' }, { status: 404 })
    }

    // Get existing content
    let existingContent = await db.getAllContentItems(scroller.id)
    console.log(`📊 [API] Current content count: ${existingContent.length}`)

    // Generate content if we need more (initial load or loadMore request)
    if (existingContent.length < 30 || loadMore) {
      const itemsToGenerate = 20 // Reduced batch size to save costs
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini-search-preview",
          web_search_options: {
            search_context_size: "medium",
          },
          messages: [
            {
              role: "system",
              content: "You are a content generator for a TikTok-style infinite scroll app. Use web search to find current, accurate information. Generate multiple unique pieces of content. Keep formatting clean and readable. Each should be different, factual, and engaging. ALWAYS include clickable source links from your web search results to build trust and credibility. Use markdown link format: [Source Name](URL). Format your response as a numbered list."
            },
            {
              role: "user",
              content: `Generate ${itemsToGenerate} completely unique pieces of content for: ${scroller.prompt_template}

CRITICAL ANTI-REPETITION REQUIREMENTS:
- Each item must be UNIQUE - avoid repeating the exact same content, examples, or specific details
- Study the existing content below and generate NEW items within the same category/theme
- Stay within the topic area but choose different specific items, words, facts, or examples
- If this is vocabulary: use different words than those already covered (but stay within vocabulary)
- If this is facts/records: cover different specific facts/records (but stay within the same domain)
- If this is tips/advice: give different specific tips (but stay within the same subject area)
- NEVER reuse the exact same examples, quotes, statistics, words, or specific details${existingContent.length > 0 ? `

EXISTING CONTENT TO STUDY AND AVOID DUPLICATING (${existingContent.length} items total):
${existingContent.slice(-25).map((item: { content: string }, index: number) => `${index + 1}. ${item.content}`).join('\n\n')}

INSTRUCTION: Generate NEW content within the same category as above, but avoid duplicating any of the specific items, words, examples, or details already covered.` : ''}

CONTENT LENGTH GUIDANCE:
- DEFAULT: Keep content short (1-2 sentences, like a tweet) for easy mobile scrolling
- BUT: If the user specifically asks for "complete", "full", "detailed", "code solution", "step by step", or similar terms, provide longer detailed content
- DETECT: Look for keywords indicating they want more detail: "complete code", "full explanation", "detailed guide", "step by step", "tutorial", etc.

Use web search to find current, accurate information. Each item should be:
- Match the user's request exactly for length and detail
- Based on real, current information when possible  
- Completely different from the others
- Engaging and interesting
- Clean formatting (use markdown for code blocks if needed)
- INCLUDE CLICKABLE SOURCES: Always add credible sources as clickable links at the end using markdown format like "[Source: Reuters](https://reuters.com)" or "[via BBC News](https://bbc.com/news/article)" to build trust and credibility

Format as:
1. [content]
2. [content]
3. [content]
etc.`
            }
          ],
          max_tokens: 16000, // High limit to ensure complete responses, especially for code
        })

        const response = completion.choices[0]?.message?.content
        const annotations = completion.choices[0]?.message?.annotations || []
        
        if (response) {
          // Extract all sources from annotations first
          const allSources: Array<{ text: string; url: string }> = []
          annotations.forEach((annotation: { type: string; url_citation?: { title?: string; url: string } }) => {
            if (annotation.type === 'url_citation' && annotation.url_citation) {
              const citation = annotation.url_citation
              const sourceData = {
                text: citation.title || new URL(citation.url).hostname,
                url: citation.url
              }
              // Deduplicate sources
              if (!allSources.some(s => s.url === sourceData.url)) {
                allSources.push(sourceData)
              }
            }
          })
          
          // Parse the numbered list - handle multi-line content properly
          // More robust parsing that preserves code blocks and multi-line content
          const contentLines: string[] = []
          const lines = response.split('\n')
          let currentSection = ''
          let inCodeBlock = false
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            
            // Track code block boundaries
            if (line.includes('```')) {
              inCodeBlock = !inCodeBlock
            }
            
            // Check if this is a new numbered item (only when not in code block)
            if (!inCodeBlock && /^\d+\.\s/.test(line.trim())) {
              // Save previous section if it exists
              if (currentSection.trim()) {
                contentLines.push(currentSection.trim())
              }
              // Start new section (remove the number)
              currentSection = line.replace(/^\d+\.\s*/, '').trim()
            } else {
              // Add to current section
              if (currentSection || line.trim()) {
                currentSection += (currentSection ? '\n' : '') + line
              }
            }
          }
          
          // Don't forget the last section
          if (currentSection.trim()) {
            contentLines.push(currentSection.trim())
          }
          
          // Filter out empty sections
          const validContentLines = contentLines.filter(section => section.length > 0)
            .map((section, itemIndex) => {
              // Find the most relevant source for this specific content item
              let bestSource = null
              let bestScore = -1
              
              // Try to match source content with the item content
              for (const source of allSources) {
                const sourceWords = source.text.toLowerCase().split(/\W+/).filter(w => w.length > 2)
                const contentWords = section.toLowerCase().split(/\W+/).filter(w => w.length > 2)
                
                // Calculate relevance score based on word overlap
                const commonWords = sourceWords.filter(word => 
                  contentWords.some(contentWord => 
                    contentWord.includes(word) || word.includes(contentWord)
                  )
                )
                const score = commonWords.length / Math.max(sourceWords.length, 1)
                
                if (score > bestScore) {
                  bestScore = score
                  bestSource = source
                }
              }
              
              // Fallback: if no good match, use round-robin distribution
              const itemSources = bestSource ? [bestSource] : 
                allSources.length > 0 ? [allSources[itemIndex % allSources.length]] : []
              
              // Clean up any existing markdown links and citations in content
              section = section.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
              section = section.replace(/\(https?:\/\/[^)]+\)/g, '')
              section = section.replace(/\(www\.[^)]+\)/g, '')
              section = section.replace(/\([a-zA-Z0-9.-]+\.(com|org|net|edu|gov|io|co|uk|ca|au)[^)]*\)/g, '')
              
              // Preserve code blocks and multi-line content
              if (!section.includes('```')) {
                // Only clean up non-code content
                section = section.replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold (except in code)
                section = section.replace(/\*(.*?)\*/g, '$1') // Remove italic (except in code)
                section = section.replace(/`([^`]+)`/g, '$1') // Remove inline code formatting
                
                // Clean up excessive spaces but preserve line breaks
                section = section.replace(/[ \t]+/g, ' ').trim()
                section = section.replace(/\s+([.!?])/g, '$1')
                
                // Only add period for short content that doesn't end with punctuation
                if (section.length < 200 && section && !section.match(/[.!?]$/) && !section.match(/__URL_\d+__$/)) {
                  section += '.'
                }
              }
              
              return { content: section, urls: itemSources }
            })

          
          // GPT has been instructed to avoid repetition based on existing content context
          // No need for post-generation similarity filtering - trust GPT's context awareness
          const uniqueContentLines = validContentLines
          
          console.log(`📊 Generated ${validContentLines.length} items from GPT with context awareness`)

          
          // Determine content type for consistent sizing across this scroller
          const hasLongContent = uniqueContentLines.some(item => 
            item.content.includes('```') || item.content.length > 200
          )
          const contentType: 'short' | 'detailed' = hasLongContent ? 'detailed' : 'short'

          const newItems = uniqueContentLines.map((item) => ({
            scroller_id: scroller.id,
            content: item.content,
            metadata: { 
              urls: item.urls,
              contentType: contentType
            }
          }))

          // Insert new items
          if (newItems.length > 0) {
            console.log(`💾 Saving ${newItems.length} new items to database`)
            const insertedItems = await db.addContentItems(newItems)
            if (insertedItems.length > 0) {
              console.log(`✅ Successfully saved ${insertedItems.length} items`)
              // Don't modify existingContent here - let the final sort handle order
              existingContent = await db.getAllContentItems(scroller.id)
            }
          }
        }
      } catch (error) {
        console.error('Error generating content:', error)
        // Add fallback content if OpenAI fails
        const fallbackItems = Array.from({ length: itemsToGenerate }, () => ({
          scroller_id: scroller.id,
          content: `${scroller.title} #${Math.floor(Math.random() * 1000)}`
        }))

        const insertedFallback = await db.addContentItems(fallbackItems)
        if (insertedFallback.length > 0) {
          // Refresh from database to ensure consistent ordering
          existingContent = await db.getAllContentItems(scroller.id)
        }
      }
    }

    // Sort by creation date (newest first)
    existingContent.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Return paginated results - larger chunks for smoother scrolling
    const startIndex = offset
    const endIndex = offset + 40 // Increased from 20 to 40 for better user experience
    return NextResponse.json(existingContent.slice(startIndex, endIndex))
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}