import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(request: Request) {
  try {
    const { title, promptTemplate } = await request.json()

    if (!title || !promptTemplate) {
      return NextResponse.json({ error: 'Title and prompt template are required' }, { status: 400 })
    }

    // Initialize database connection
    await db.initialize()

    let baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 40) // Leave room for suffix

    // Make slug unique
    let slug = baseSlug
    let counter = 1
    
    while (await db.isSlugTaken(slug)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create new scroller
    const newScroller = await db.createScroller(slug, title, promptTemplate)

    if (!newScroller) {
      return NextResponse.json({ error: 'Failed to create scroller' }, { status: 500 })
    }

    console.log('✓ Created scroller:', newScroller)
    return NextResponse.json({ slug })
  } catch (error) {
    console.error('Error creating scroller:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}