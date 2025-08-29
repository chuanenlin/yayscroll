import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'mock-db.json')

function getMockDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    }
  } catch (error) {
    console.log('Mock database not found')
  }
  return { scrollers: [], content_items: [] }
}

function saveMockDB(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

interface Params {
  slug: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    const db = getMockDB()

    const scroller = db.scrollers.find((s: any) => s.slug === slug)
    if (!scroller) {
      return NextResponse.json({ error: 'Scroller not found' }, { status: 404 })
    }

    let existingContent = db.content_items.filter((item: any) => item.scroller_id === scroller.id)

    // Generate content if we need more
    if (existingContent.length < 5) {
      const itemsToGenerate = Math.max(5, 10 - existingContent.length)
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-search-preview",
          web_search_options: {
            search_context_size: "medium"
          },
          messages: [
            {
              role: "system",
              content: "You are a content generator for a TikTok-style infinite scroll app. Use web search to find current, accurate information. Generate multiple unique, VERY SHORT pieces of content (one line each). Keep formatting clean and readable. Each should be different, factual, and engaging. Format your response as a numbered list."
            },
            {
              role: "user",
              content: `Generate ${itemsToGenerate} unique, short pieces of content for: ${scroller.prompt_template}

Use web search to find current, accurate information. Each item should be:
- One line only (like a tweet)
- Based on real, current information
- Completely different from the others
- Engaging and interesting
- Clean formatting (no complex markdown or cluttered links)
- If you include sources, keep them simple like "(Source: sitename.com)"

Format as:
1. [content]
2. [content]
3. [content]
etc.`
            }
          ],
          max_tokens: itemsToGenerate * 50,
        })

        const response = completion.choices[0]?.message?.content
        const annotations = completion.choices[0]?.message?.annotations || []
        
        console.log('AI Response:', response)
        console.log('Annotations:', annotations)
        
        if (response) {
          // Parse the numbered list and clean up formatting
          let contentLines = response
            .split('\n')
            .filter(line => /^\d+\./.test(line.trim()))
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(line => line.length > 0)
            .map(line => {
              // Store original URLs for clickable links
              const urls = []
              let urlIndex = 0
              
              // Extract URLs and replace with placeholders
              line = line.replace(/\(\[([^\]]+)\]\(([^)]+)\)\)/g, (match, text, url) => {
                urls.push({ text, url })
                return `__URL_${urlIndex++}__`
              })
              
              line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                urls.push({ text, url })
                return `$1 __URL_${urlIndex++}__`
              })
              
              line = line.replace(/\(https?:\/\/([^)]+)\)/g, (match, url) => {
                const domain = url.split('/')[0]
                urls.push({ text: domain, url: `https://${url}` })
                return `__URL_${urlIndex++}__`
              })
              
              line = line.replace(/\(www\.([^)]+)\)/g, (match, url) => {
                const domain = url.split('/')[0]
                urls.push({ text: domain, url: `https://${url}` })
                return `__URL_${urlIndex++}__`
              })
              
              // Remove excessive markdown formatting
              line = line.replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
              line = line.replace(/\*(.*?)\*/g, '$1') // Remove italic
              line = line.replace(/`([^`]+)`/g, '$1') // Remove code formatting
              
              // Clean up extra spaces and punctuation
              line = line.replace(/\s+/g, ' ').trim()
              line = line.replace(/\s+([.!?])/g, '$1')
              
              // Ensure sentences end properly (but not if ending with a source)
              if (line && !line.match(/[.!?]$/) && !line.match(/__URL_\d+__$/)) {
                line += '.'
              }
              
              console.log('Processed item:', { content: line, urls })
              return { content: line, urls }
            })

          console.log('All content lines processed:', contentLines)
          
          const newItems = contentLines.map(item => ({
            id: Math.random().toString(36).substring(7),
            scroller_id: scroller.id,
            content: item.content,
            metadata: { urls: item.urls },
            created_at: new Date().toISOString()
          }))

          db.content_items.push(...newItems)
          saveMockDB(db)
          existingContent = [...newItems, ...existingContent]
        }
      } catch (error) {
        console.error('Error generating content:', error)
        // Add fallback content if OpenAI fails
        const fallbackItems = Array.from({ length: itemsToGenerate }, (_, i) => ({
          id: Math.random().toString(36).substring(7),
          scroller_id: scroller.id,
          content: `${scroller.title} #${Math.floor(Math.random() * 1000)}`,
          created_at: new Date().toISOString()
        }))

        db.content_items.push(...fallbackItems)
        saveMockDB(db)
        existingContent = [...fallbackItems, ...existingContent]
      }
    }

    // Sort by creation date (newest first)
    existingContent.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(existingContent.slice(0, 10))
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}