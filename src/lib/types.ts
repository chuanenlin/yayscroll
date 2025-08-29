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
  metadata?: {
    urls?: Array<{ text: string; url: string }>
    contentType?: 'short' | 'detailed'
    [key: string]: unknown
  }
  created_at: string
}