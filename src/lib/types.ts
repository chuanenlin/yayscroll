export interface Scroller {
  id: string
  slug: string
  title: string
  prompt_template: string
  created_at: string
}

export interface ContentItem {
  id: string
  scroller_id: string
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}