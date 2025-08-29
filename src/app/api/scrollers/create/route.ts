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

    const baseSlug = title.toLowerCase()
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
    
    // Start background content generation (don't await - let it run async)
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/scrollers/${slug}/content`, {
      method: 'GET',
    }).catch(error => {
      console.log('Background content generation failed:', error.message)
      // Fail silently - content will be generated on first visit
    })
    
    return NextResponse.json({ slug })
  } catch (error) {
    console.error('Error creating scroller:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}