import { supabase } from './supabase'
import type { Scroller, ContentItem } from './types'
import { promises as fs } from 'fs'
import path from 'path'

const mockDbPath = path.join(process.cwd(), 'mock-db.json')

interface MockDatabase {
  scrollers: Scroller[]
  content_items: ContentItem[]
}

// Helper functions for mock database
async function loadMockDB(): Promise<MockDatabase> {
  try {
    const data = await fs.readFile(mockDbPath, 'utf8')
    return JSON.parse(data)
  } catch {
    return { scrollers: [], content_items: [] }
  }
}

async function saveMockDB(db: MockDatabase): Promise<void> {
  await fs.writeFile(mockDbPath, JSON.stringify(db, null, 2))
}

// Test Supabase connectivity
async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { error } = await supabase.from('scrollers').select('count', { count: 'exact', head: true })
    return !error
  } catch {
    return false
  }
}

export class Database {
  private useSupabase: boolean = false

  async initialize(): Promise<void> {
    this.useSupabase = await isSupabaseAvailable()
    console.log(this.useSupabase ? '✓ Using Supabase database' : '⚠ Using local file database (Supabase unavailable)')
  }

  async createScroller(slug: string, title: string, promptTemplate: string): Promise<Scroller | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('scrollers')
        .insert({ slug, title, prompt_template: promptTemplate })
        .select()
        .single()
      
      return error ? null : data
    } else {
      const db = await loadMockDB()
      const newScroller: Scroller = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
        slug,
        title,
        prompt_template: promptTemplate,
        created_at: new Date().toISOString()
      }
      db.scrollers.push(newScroller)
      await saveMockDB(db)
      return newScroller
    }
  }

  async getScrollerBySlug(slug: string): Promise<Scroller | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('scrollers')
        .select('*')
        .eq('slug', slug)
        .single()
      
      return error ? null : data
    } else {
      const db = await loadMockDB()
      return db.scrollers.find(s => s.slug === slug) || null
    }
  }

  async isSlugTaken(slug: string): Promise<boolean> {
    if (this.useSupabase) {
      const { data } = await supabase
        .from('scrollers')
        .select('slug')
        .eq('slug', slug)
        .single()
      
      return !!data
    } else {
      const db = await loadMockDB()
      return db.scrollers.some(s => s.slug === slug)
    }
  }

  async getContentItems(scrollerId: string, offset: number = 0, limit: number = 20): Promise<ContentItem[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('scroller_id', scrollerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      return error ? [] : data
    } else {
      const db = await loadMockDB()
      return db.content_items
        .filter(item => item.scroller_id === scrollerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit)
    }
  }

  async getAllContentItems(scrollerId: string): Promise<ContentItem[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('scroller_id', scrollerId)
        .order('created_at', { ascending: true }) // Changed to ascending for chronological order
      
      return error ? [] : data
    } else {
      const db = await loadMockDB()
      return db.content_items
        .filter(item => item.scroller_id === scrollerId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Changed to ascending
    }
  }

  async addContentItems(items: Omit<ContentItem, 'id' | 'created_at'>[]): Promise<ContentItem[]> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('content_items')
        .insert(items)
        .select()
      
      return error ? [] : data
    } else {
      const db = await loadMockDB()
      const newItems: ContentItem[] = items.map(item => ({
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
        created_at: new Date().toISOString()
      }))
      db.content_items.push(...newItems)
      await saveMockDB(db)
      return newItems
    }
  }

  async getTrendingScrollers(limit: number = 4): Promise<Array<{ id: string; slug: string; title: string; previewContent: string; contentCount: number }>> {
    if (this.useSupabase) {
      const { data: scrollers, error } = await supabase
        .from('scrollers')
        .select(`
          id,
          slug,
          title,
          content_items (
            id,
            content
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) return []

      return scrollers?.map(scroller => ({
        id: scroller.id,
        slug: scroller.slug,
        title: scroller.title,
        previewContent: scroller.content_items?.[0]?.content || 'No content yet...',
        contentCount: scroller.content_items?.length || 0
      })) || []
    } else {
      const db = await loadMockDB()
      return db.scrollers
        .slice(0, limit)
        .map(scroller => {
          const content = db.content_items.filter(item => item.scroller_id === scroller.id)
          return {
            id: scroller.id,
            slug: scroller.slug,
            title: scroller.title,
            previewContent: content[0]?.content || 'No content yet...',
            contentCount: content.length
          }
        })
    }
  }
}

// Export singleton instance
export const db = new Database()