import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { db } from '@/lib/database'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

// Define the structured output schema
const ContentItem = z.object({
  content: z.string().describe("The main content text without any source citations or links"),
  source_title: z.string().nullable().describe("The title or name of the source (null if no source)"),
  source_url: z.string().nullable().describe("The URL of the source (null if no source)")
})

const ContentResponse = z.object({
  items: z.array(ContentItem).describe("Array of content items with separated content and sources")
})

interface Params {
  slug: string
}

// Debug mode placeholder content generator
function generatePlaceholderContent(scrollerTitle: string, count: number, startIndex: number): Array<{
  scroller_id: string
  content: string
  metadata?: {
    urls?: Array<{ text: string; url: string }>
    contentType?: 'short' | 'detailed'
  }
}> {
  const placeholderItems = []
  
  for (let i = 0; i < count; i++) {
    const scrollNumber = startIndex + i + 1
    const content = `🧪 **Debug Scroll #${scrollNumber}**

${scrollerTitle} - Testing placeholder content

Generated: ${new Date().toLocaleTimeString()}
ID: ${Math.random().toString(36).substring(2, 8)}

This is debug content that fits in one scroll section for testing the infinite scroll behavior without API costs.`

    placeholderItems.push({
      scroller_id: '', // Will be set by caller
      content,
      metadata: {
        urls: Math.random() > 0.7 ? [{
          text: `Debug Source ${scrollNumber}`,
          url: `https://example.com/debug-${scrollNumber}`
        }] : [],
        contentType: 'short' as const
      }
    })
  }
  
  return placeholderItems
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
    
    // Check if debug mode is enabled first
    const isDebugMode = process.env.DEBUG_MODE === 'true'
    
    // Rate limiting to prevent excessive API calls
    const now = Date.now()
    const rateLimitKey = `rate_limit_${slug}`
    
    // Simple in-memory rate limiting and generation tracking (in production, use Redis)
    const globalCache = global as unknown as Record<string, { 
      lastCall: number; 
      calls: number; 
      isGenerating?: boolean;
      generationStartTime?: number;
    }>
    
    // Reset rate limit for debug testing
    if (isDebugMode || !globalCache[rateLimitKey]) {
      globalCache[rateLimitKey] = { lastCall: 0, calls: 0 }
    }
    const rateLimit = globalCache[rateLimitKey]
    
    // Initialize database connection and get scroller first
    await db.initialize()
    const scroller = await db.getScrollerBySlug(slug)

    if (!scroller) {
      return NextResponse.json({ error: 'Scroller not found' }, { status: 404 })
    }
    
    // Check if already generating (prevent concurrent generation)
    if (rateLimit.isGenerating && rateLimit.generationStartTime) {
      const generationAge = now - rateLimit.generationStartTime
      if (generationAge < 60000) { // 1 minute timeout
        console.log('⚠️ [API] Already generating content, blocking concurrent request...')
        // Wait longer for the other request to complete, then return what exists
        await new Promise(resolve => setTimeout(resolve, 4000)) // Wait 4 seconds for generation to complete
        let existingContent = await db.getAllContentItems(scroller.id)
        const startIndex = offset
        const endIndex = offset + 20
        const paginatedContent = existingContent.slice(startIndex, endIndex)
        console.log(`📄 [API] Returning ${paginatedContent.length} items after waiting for concurrent generation`)
        return NextResponse.json(paginatedContent)
      } else {
        // Clear stale generation lock
        rateLimit.isGenerating = false
        delete rateLimit.generationStartTime
      }
    }
    
    // Allow max 50 calls per minute per scroller for debug testing (increased from 10)
    if (now - rateLimit.lastCall < 60000 && rateLimit.calls >= 50) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    
    if (now - rateLimit.lastCall >= 60000) {
      rateLimit.calls = 0
    }
    rateLimit.calls++
    rateLimit.lastCall = now

    // Get existing content
    let existingContent = await db.getAllContentItems(scroller.id)
    console.log(`📊 [API] Current content count: ${existingContent.length}`)
    console.log(`🧪 [API] Debug mode: ${isDebugMode ? 'ENABLED' : 'DISABLED'}`)

    // For initial load, always generate content if we have less than 20 items
    // For loadMore, only generate if we need more content beyond what's requested
    const needsGeneration = (!loadMore && existingContent.length < 20) || 
                           (loadMore && existingContent.length < offset + 40)
    
    if (needsGeneration) {
      // CRITICAL: Set generation lock IMMEDIATELY to prevent race conditions
      rateLimit.isGenerating = true
      rateLimit.generationStartTime = now
      
      // Double-check existing content after setting lock (in case another request finished)
      existingContent = await db.getAllContentItems(scroller.id)
      console.log(`🔒 [API] Generation lock set, re-checking content count: ${existingContent.length}`)
      
      // Re-evaluate if we still need generation after the lock
      const stillNeedsGeneration = (!loadMore && existingContent.length < 20) || 
                                   (loadMore && existingContent.length < offset + 40)
      
      if (!stillNeedsGeneration) {
        // Another request finished generating while we were waiting
        console.log(`✅ [API] Content was generated by concurrent request, skipping generation`)
        rateLimit.isGenerating = false
        delete rateLimit.generationStartTime
        // Continue to return existing content below
      } else {
      
      const itemsToGenerate = 20 // Reduced batch size to save costs
      console.log(`🔧 [API] Need to generate content: loadMore=${loadMore}, existing=${existingContent.length}, offset=${offset}`)
      
      try {
        if (isDebugMode) {
        // DEBUG MODE: Generate placeholder content with simulated delay
        console.log(`🧪 [API] Generating ${itemsToGenerate} placeholder items (simulating 30s delay)...`)
        
        // Simulate API delay (reduced for testing - change to 30000 for full simulation)
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3 seconds for easier testing
        
        // Use the total number of existing content as the starting index for numbering
        const placeholderItems = generatePlaceholderContent(scroller.title, itemsToGenerate, existingContent.length)
        
        // Set the scroller_id for all items
        const processedItems = placeholderItems.map(item => ({
          ...item,
          scroller_id: scroller.id
        }))

        // Filter out duplicates (though unlikely with debug content)
        const existingContentSet = new Set(existingContent.map(item => item.content.trim()))
        const uniqueItems = processedItems.filter(item => {
          const content = item.content.trim()
          if (existingContentSet.has(content)) {
            return false
          }
          existingContentSet.add(content)
          return true
        })
        
        console.log(`🧪 [API] Generated ${uniqueItems.length} unique placeholder items`)

        // Insert new unique items
        if (uniqueItems.length > 0) {
          console.log(`💾 Saving ${uniqueItems.length} placeholder items to database`)
          const insertedItems = await db.addContentItems(uniqueItems)
          if (insertedItems.length > 0) {
            console.log(`✅ Successfully saved ${insertedItems.length} placeholder items`)
            // Refresh from database to ensure consistent ordering
            existingContent = await db.getAllContentItems(scroller.id)
          }
        }
        } else {
          // PRODUCTION MODE: Use OpenAI API
          const completion = await openai.chat.completions.parse({
          model: "gpt-4o-mini-search-preview",
          messages: [
            {
              role: "system",
              content: "You are a content generator for a TikTok-style infinite scroll app. Generate multiple unique pieces of content based on your knowledge. Keep each item's content clean and readable without any source citations mixed in. Sources should be provided separately in the source_title and source_url fields when available."
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

STRUCTURED OUTPUT INSTRUCTIONS:
- Put ONLY the main content in the "content" field - NO source citations, links, or "Source:" text
- DO NOT number the content items (no "1.", "2.", "8." etc. at the beginning)
- If you know a credible source, put the source name in "source_title" and URL in "source_url"  
- If no source is known, set "source_title" and "source_url" to null
- Keep content clean and readable without any citation clutter
- Use markdown formatting in content when needed (code blocks, bold, etc.)

Each item should be:
- Match the user's request exactly for length and detail
- Based on your training knowledge
- Completely different from the others
- Engaging and interesting
- Clean formatting in the content field only
- Start directly with the content (no numbering prefix)`
            }
          ],
          response_format: zodResponseFormat(ContentResponse, "content_response"),
          max_completion_tokens: 16000,
        })

        // Handle structured output response
        const parsedResponse = completion.choices[0]?.message?.parsed
        
        if (parsedResponse && parsedResponse.items) {
          console.log(`📊 Generated ${parsedResponse.items.length} items via structured output`)
          
          // Process each structured item
          const processedItems = parsedResponse.items.map((item) => {
            // Prepare source URLs array
            const urls: Array<{ text: string; url: string }> = []
            if (item.source_title !== null && item.source_url !== null) {
              urls.push({
                text: item.source_title,
                url: item.source_url
              })
            }
            
            // Determine content type for consistent sizing
            const contentType: 'short' | 'detailed' = 
              item.content.includes('```') || item.content.length > 200 ? 'detailed' : 'short'
            
            return {
              scroller_id: scroller.id,
              content: item.content.trim(),
              metadata: {
                urls: urls,
                contentType: contentType
              }
            }
          })

          // Filter out duplicates from generated items and existing content
          const existingContentSet = new Set(existingContent.map(item => item.content.trim()))
          const uniqueItems = processedItems.filter(item => {
            const content = item.content.trim()
            if (existingContentSet.has(content)) {
              return false
            }
            existingContentSet.add(content)
            return true
          })
          
          console.log(`🔍 Filtered ${processedItems.length} → ${uniqueItems.length} unique items (removed duplicates)`)

          // Insert new unique items
          if (uniqueItems.length > 0) {
            console.log(`💾 Saving ${uniqueItems.length} unique items to database`)
            const insertedItems = await db.addContentItems(uniqueItems)
            if (insertedItems.length > 0) {
              console.log(`✅ Successfully saved ${insertedItems.length} items`)
              // Refresh from database to ensure consistent ordering
              existingContent = await db.getAllContentItems(scroller.id)
            }
          }
          } else {
            console.log('⚠️ No structured response received from OpenAI')
          }
        } 
      } catch (generationError) {
        console.error('Generation failed:', generationError)
        // Add fallback content if generation fails
        const existingContentSet = new Set(existingContent.map(item => item.content.trim()))
        const fallbackItems = []
        
        while (fallbackItems.length < itemsToGenerate) {
          const content = `${scroller.title} #${Math.floor(Math.random() * 10000)}`
          if (!existingContentSet.has(content)) {
            fallbackItems.push({
              scroller_id: scroller.id,
              content: content
            })
            existingContentSet.add(content)
          }
        }

        const insertedFallback = await db.addContentItems(fallbackItems)
        if (insertedFallback.length > 0) {
          // Refresh from database to ensure consistent ordering
          existingContent = await db.getAllContentItems(scroller.id)
        }
      } finally {
        // Clear generation lock only if we actually generated content
        rateLimit.isGenerating = false
        delete rateLimit.generationStartTime
      }
      } // Close the else block for stillNeedsGeneration
    }

    // Database now returns items in chronological order, no need to sort again
    
    // For infinite scroll, return content starting from the offset
    const startIndex = offset
    // For initial load (offset=0), return 20 items. For loadMore, return 20 items.
    const itemsToReturn = loadMore ? 20 : 20
    const endIndex = startIndex + itemsToReturn
    const paginatedContent = existingContent.slice(startIndex, endIndex)
    
    console.log(`📄 [API] Returning ${paginatedContent.length} items (${startIndex}-${endIndex-1}) from ${existingContent.length} total`)
    console.log(`📄 [API] Content range: #${startIndex + 1} to #${Math.min(startIndex + paginatedContent.length, existingContent.length)}`)
    if (paginatedContent.length > 0) {
      console.log(`📄 [API] First item: ${paginatedContent[0]?.id} - "${paginatedContent[0]?.content?.substring(0, 30)}..."`)
      console.log(`📄 [API] Last item: ${paginatedContent[paginatedContent.length - 1]?.id} - "${paginatedContent[paginatedContent.length - 1]?.content?.substring(0, 30)}..."`)
    }
    
    return NextResponse.json(paginatedContent)
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}