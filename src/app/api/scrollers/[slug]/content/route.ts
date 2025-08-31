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
- If you know a credible source, put the source name in "source_title" and URL in "source_url"
- If no source is known, set "source_title" and "source_url" to null
- Keep content clean and readable without any citation clutter
- Use markdown formatting in content when needed (code blocks, bold, etc.)

Each item should be:
- Match the user's request exactly for length and detail
- Based on your training knowledge
- Completely different from the others
- Engaging and interesting
- Clean formatting in the content field only`
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

          // Insert new items
          if (processedItems.length > 0) {
            console.log(`💾 Saving ${processedItems.length} structured items to database`)
            const insertedItems = await db.addContentItems(processedItems)
            if (insertedItems.length > 0) {
              console.log(`✅ Successfully saved ${insertedItems.length} items`)
              // Refresh from database to ensure consistent ordering
              existingContent = await db.getAllContentItems(scroller.id)
            }
          }
        } else {
          console.log('⚠️ No structured response received from OpenAI')
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
    const paginatedContent = existingContent.slice(startIndex, endIndex)
    
    console.log(`📄 [API] Returning ${paginatedContent.length} items (${startIndex}-${endIndex-1}) from ${existingContent.length} total`)
    console.log(`📄 [API] First item: ${paginatedContent[0]?.id} - "${paginatedContent[0]?.content?.substring(0, 50)}..."`)
    
    return NextResponse.json(paginatedContent)
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}