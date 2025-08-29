'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentItem } from '@/lib/types'
import ContentDisplay from './ContentDisplay'
import ThemeToggle from './ThemeToggle'

interface ScrollerFeedProps {
  scrollerSlug: string
}

export default function ScrollerFeed({ scrollerSlug }: ScrollerFeedProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchContent = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true)
      } else {
        setIsGenerating(true)
      }
      
      const response = await fetch(`/api/scrollers/${scrollerSlug}/content`)
      if (response.ok) {
        const newContent = await response.json()
        setContent(prev => loadMore ? [...prev, ...newContent] : newContent)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [scrollerSlug])

  useEffect(() => {
    if (currentIndex >= content.length - 2 && content.length > 0) {
      fetchContent(true)
    }
  }, [currentIndex, content.length])

  const handleScroll = () => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const scrollPosition = container.scrollTop
    const windowHeight = window.innerHeight
    const newIndex = Math.round(scrollPosition / windowHeight)
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [currentIndex])

  if (isLoading) {
    return (
      <div className="h-screen bg-black dark:bg-white flex flex-col items-center justify-center">
        <ThemeToggle />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white dark:border-black mb-4"></div>
        <div className="text-white dark:text-black text-xl">Generating content...</div>
        <div className="text-white/60 dark:text-black/60 text-sm mt-2">Using AI web search for accurate info</div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black dark:bg-white"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <ThemeToggle />
      
      {content.map((item, index) => (
        <div
          key={item.id}
          className="h-screen w-full flex items-center justify-center snap-start relative"
        >
          <div className="px-8 py-12 flex items-center justify-center">
            <ContentDisplay 
              content={item.content}
              urls={item.metadata?.urls || []}
            />
          </div>

        </div>
      ))}
      
      {isGenerating && (
        <div className="h-screen w-full flex flex-col items-center justify-center snap-start bg-black dark:bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white dark:border-black mb-4"></div>
          <div className="text-white dark:text-black text-xl">Generating more content...</div>
          <div className="text-white/60 dark:text-black/60 text-sm mt-2">Searching the web for fresh info</div>
        </div>
      )}
    </div>
  )
}