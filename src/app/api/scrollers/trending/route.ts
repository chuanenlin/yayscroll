import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    // Initialize database connection
    await db.initialize()
    
    // Get trending scrollers
    const trendingScrollers = await db.getTrendingScrollers(4)

    return NextResponse.json(trendingScrollers)
  } catch (error) {
    console.error('Error in trending scrollers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}