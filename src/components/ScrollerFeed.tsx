'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentItem } from '@/lib/types'
import ContentDisplay from './ContentDisplay'

const CREATION_MESSAGES = [
  "Creating your scroll...",
  "Convincing AI to work for free...",
  "Sprinkling digital fairy dust...",
  "Downloading more RAM for creativity...",
  "Negotiating with the content gods...",
  "Building a scroll-worthy experience...",
  "Teaching pixels to dance...",
  "Optimizing for maximum addiction...",
  "Channeling internet wisdom...",
  "Crafting scroll-stopping content..."
]

const LOADING_MORE_MESSAGES = [
  "Loading more...",
  "Fetching fresh content...",
  "Summoning more scroll fuel...",
  "Digging deeper into the content mine...",
  "Asking AI for an encore...",
  "Brewing another batch...",
  "Expanding your scroll universe...",
  "Finding more treasures...",
  "Loading level 2...",
  "Multiplying the fun..."
]

const WAIT_MESSAGES = [
  "Teaching AI to be more creative... this might take a sec",
  "Convincing robots to think outside the box...",
  "Feeding the AI some inspiration cookies...",
  "Upgrading the creativity engine... please hold",
  "AI is having a brainstorm session right now",
  "Downloading more imagination from the cloud...",
  "The content hamsters are working overtime",
  "Politely asking ChatGPT to try harder...",
  "Calibrating the genius-o-meter...",
  "Teaching machines the art of being interesting..."
]

interface ScrollerFeedProps {
  scrollerSlug: string
}

export default function ScrollerFeed({ scrollerSlug }: ScrollerFeedProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isKeyboardScrolling = useRef(false)
  const [creationMessageIndex, setCreationMessageIndex] = useState(0)
  const [waitMessageIndex, setWaitMessageIndex] = useState(0)

  const fetchContent = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true)
      } else {
        setIsGenerating(true)
      }
      
      const params = new URLSearchParams()
      if (loadMore) {
        params.append('loadMore', 'true')
        params.append('offset', content.length.toString())
      }
      const url = `/api/scrollers/${scrollerSlug}/content${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const newContent = await response.json()
        setContent(prev => {
          if (loadMore) {
            // Filter out any content that already exists to prevent duplicates
            const existingIds = new Set(prev.map(item => item.id))
            const uniqueNewContent = newContent.filter((item: ContentItem) => !existingIds.has(item.id))
            return [...prev, ...uniqueNewContent]
          }
          return newContent
        })
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
    if (currentIndex >= content.length - 10 && content.length > 0 && !isGenerating) {
      fetchContent(true)
    }
  }, [currentIndex, content.length, isGenerating])

  // Cycle through witty messages for initial loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCreationMessageIndex((prev) => (prev + 1) % CREATION_MESSAGES.length)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [isLoading])


  // Cycle through witty wait messages
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setWaitMessageIndex((prev) => (prev + 1) % WAIT_MESSAGES.length)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [isGenerating])

  const handleScroll = () => {
    if (!containerRef.current || isKeyboardScrolling.current) return
    
    const container = containerRef.current
    const scrollPosition = container.scrollTop
    const windowHeight = window.innerHeight
    const newIndex = Math.round(scrollPosition / windowHeight)
    
    // Allow scrolling to the wait message scroll when generating
    const maxIndex = isGenerating ? content.length : content.length - 1
    
    if (newIndex !== currentIndex && newIndex <= maxIndex) {
      setCurrentIndex(newIndex)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [currentIndex])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return
      
      const container = containerRef.current
      const windowHeight = window.innerHeight
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const maxIndex = isGenerating ? content.length : content.length - 1
        const nextIndex = Math.min(currentIndex + 1, maxIndex)
        
        if (nextIndex !== currentIndex) {
          isKeyboardScrolling.current = true
          setCurrentIndex(nextIndex)
          container.scrollTo({
            top: nextIndex * windowHeight,
            behavior: 'smooth'
          })
          // Reset flag after scroll animation completes
          setTimeout(() => {
            isKeyboardScrolling.current = false
          }, 500)
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex = Math.max(currentIndex - 1, 0)
        if (prevIndex !== currentIndex) {
          isKeyboardScrolling.current = true
          setCurrentIndex(prevIndex)
          container.scrollTo({
            top: prevIndex * windowHeight,
            behavior: 'smooth'
          })
          // Reset flag after scroll animation completes
          setTimeout(() => {
            isKeyboardScrolling.current = false
          }, 500)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, content.length])

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 flex flex-col items-center justify-center w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-6"></div>
          <div className="text-white text-center text-lg transition-opacity duration-500 max-w-5xl">{CREATION_MESSAGES[creationMessageIndex]}</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {content.map((item, index) => (
        <div
          key={item.id}
          className="h-screen w-full flex items-center justify-center snap-start relative"
        >
          <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 flex items-center justify-center w-full">
            <ContentDisplay 
              content={item.content}
              urls={item.metadata?.urls || []}
              contentType={item.metadata?.contentType}
            />
          </div>

        </div>
      ))}
      
      {isGenerating && (
        <div className="h-screen w-full flex items-center justify-center snap-start relative bg-gray-900/30">
          <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 flex items-center justify-center w-full">
            <div className="text-center max-w-5xl w-full">
              <div className="animate-spin w-12 h-12 border-2 border-white/30 border-t-white rounded-full mx-auto mb-8"></div>
              <div className="text-white/70 text-base leading-relaxed font-normal italic transition-opacity duration-500">
                {WAIT_MESSAGES[waitMessageIndex]}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}