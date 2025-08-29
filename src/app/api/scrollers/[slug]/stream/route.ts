import { NextRequest } from 'next/server'
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
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params
  const db = getMockDB()

  const scroller = db.scrollers.find((s: any) => s.slug === slug)
  if (!scroller) {
    return new Response('Scroller not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Starting content generation...' })}\n\n`))

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-search-preview",
          web_search_options: {
            search_context_size: "medium"
          },
          messages: [
            {
              role: "system",
              content: "Generate 5 unique, VERY SHORT pieces of content (one line each). Use web search for current, accurate information. Format as numbered list."
            },
            {
              role: "user",
              content: `Generate 5 unique, short pieces of content for: ${scroller.prompt_template}`
            }
          ],
          max_tokens: 150,
          stream: true
        })

        let responseText = ''
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            responseText += content
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`))
          }
        }

        // Parse and save the final content
        const contentLines = responseText
          .split('\n')
          .filter(line => /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.length > 0)

        const newItems = contentLines.map(content => ({
          id: Math.random().toString(36).substring(7),
          scroller_id: scroller.id,
          content,
          created_at: new Date().toISOString()
        }))

        db.content_items.push(...newItems)
        saveMockDB(db)

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', items: newItems })}\n\n`))
        controller.close()
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed' })}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}