import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Temporary mock database for local development
const DB_PATH = path.join(process.cwd(), 'mock-db.json')

function getMockDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    }
  } catch (error) {
    console.log('Creating new mock database')
  }
  return { scrollers: [], content_items: [] }
}

function saveMockDB(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export async function POST(request: Request) {
  try {
    const { title, promptTemplate } = await request.json()

    if (!title || !promptTemplate) {
      return NextResponse.json({ error: 'Title and prompt template are required' }, { status: 400 })
    }

    let baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 40) // Leave room for suffix

    // Mock database operations
    const db = getMockDB()
    
    // Make slug unique by adding suffix if needed
    let slug = baseSlug
    let counter = 1
    while (db.scrollers.find((s: any) => s.slug === slug)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create new scroller
    const newScroller = {
      id: Math.random().toString(36).substring(7),
      slug,
      title,
      prompt_template: promptTemplate,
      created_at: new Date().toISOString()
    }

    db.scrollers.push(newScroller)
    saveMockDB(db)

    console.log('✓ Created scroller with mock database:', newScroller)
    return NextResponse.json({ slug })
  } catch (error) {
    console.error('Error creating scroller:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}