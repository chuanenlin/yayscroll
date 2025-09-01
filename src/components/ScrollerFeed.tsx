'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

const DEBUG_WAIT_MESSAGES = [
  "🧪 DEBUG MODE: Simulating 30-second loading delay...",
  "🧪 Testing scroll behavior with placeholder content...",
  "🧪 Generating debug scrolls (Scroll #1, #2, #3...)...",
  "🧪 Simulating real API loading time for testing...",
  "🧪 Debug mode active - no GPT costs here!",
  "🧪 Creating placeholder content for scroll testing...",
  "🧪 Debugging infinite scroll without API calls...",
  "🧪 Simulating content generation delays...",
  "🧪 Testing loading states with fake content...",
  "🧪 Debug scrolls incoming... almost ready!"
]

// Throttle utility for mobile scroll performance - simplified implementation
function throttle<T extends (...args: unknown[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | undefined
  let lastExecTime = 0
  
  return function (...args: Parameters<T>) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime >= delay) {
      // Execute immediately if enough time has passed
      func(...args)
      lastExecTime = currentTime
    } else if (!timeoutId) {
      // Schedule execution only if not already scheduled
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
        timeoutId = undefined
      }, delay - (currentTime - lastExecTime))
    }
  } as T
}

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
  const [isDebugMode, setIsDebugMode] = useState(false)
  const lastLoadMoreOffset = useRef<number>(-1) // Prevent duplicate requests

  const fetchContent = async (loadMore = false) => {
    try {
      // Use current content length from state - direct access is safe here since we're in the handler
      const currentContentLength = content.length
      
      // Prevent duplicate loadMore requests
      if (loadMore) {
        if (lastLoadMoreOffset.current === currentContentLength) {
          console.log(`⚠️ [CLIENT] Preventing duplicate loadMore request for offset ${currentContentLength}`)
          return
        }
        lastLoadMoreOffset.current = currentContentLength
        setIsGenerating(true)
      } else {
        setIsLoading(true)
      }
      
      const params = new URLSearchParams()
      if (loadMore) {
        params.append('loadMore', 'true')
        params.append('offset', currentContentLength.toString())
        console.log(`🔄 [CLIENT] Load more request: offset=${currentContentLength}, currentContent=${currentContentLength}`)
      } else {
        console.log(`🔄 [CLIENT] Initial load request`)
      }
      const url = `/api/scrollers/${scrollerSlug}/content${params.toString() ? '?' + params.toString() : ''}`
      console.log(`📡 [CLIENT] Making request: ${url}`)
      console.log(`📊 [CLIENT] Current state: ${content.length} items, currentIndex=${currentIndex}`)
      
      // Add timeout to prevent getting stuck - longer than server delay
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 35000) // 35 second timeout (server uses 30s)
      
      const response = await fetch(url, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const newContent = await response.json()
        console.log(`📦 [CLIENT] Received ${newContent.length} items, loadMore=${loadMore}`)
        console.log(`📦 [CLIENT] First item ID: ${newContent[0]?.id}, content preview: "${newContent[0]?.content?.substring(0, 50)}..."`)
        
        // Detect debug mode from content
        if (newContent.length > 0 && newContent[0]?.content?.includes('🧪 DEBUG MODE')) {
          setIsDebugMode(true)
          console.log('🧪 [CLIENT] Debug mode detected from content')
        }
        
        setContent(prev => {
          let newContentArray
          if (loadMore) {
            // For load more, append new content to the end
            const existingIds = new Set(prev.map(item => item.id))
            const uniqueNewContent = newContent.filter((item: ContentItem) => !existingIds.has(item.id))
            console.log(`🔍 [CLIENT] Filtered: ${newContent.length} → ${uniqueNewContent.length} unique items`)
            if (uniqueNewContent.length === 0) {
              console.log('⚠️ [CLIENT] All received items were duplicates!')
              return prev // Return unchanged if no new content
            }
            newContentArray = [...prev, ...uniqueNewContent]
            console.log(`📈 [CLIENT] Appended ${uniqueNewContent.length} items: ${prev.length} → ${newContentArray.length} total`)
          } else {
            // Initial load
            console.log(`🔄 [CLIENT] Initial load: replacing ${prev.length} items with ${newContent.length} items`)
            newContentArray = newContent
          }
          
          return newContentArray
        })
      } else {
        console.error(`API request failed: ${response.status} ${response.statusText}`)
        throw new Error(`API request failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      // Show error state to user instead of getting stuck
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out after 30 seconds')
      }
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  // Prevent double initial requests (React StrictMode issue)
  const initializationRef = useRef<{ [key: string]: boolean }>({})
  
  useEffect(() => {
    const key = `init_${scrollerSlug}`
    if (!initializationRef.current[key]) {
      initializationRef.current[key] = true
      console.log(`🎯 [CLIENT] First initialization for ${scrollerSlug}`)
      fetchContent()
    } else {
      console.log(`⚠️ [CLIENT] Skipping duplicate initialization for ${scrollerSlug}`)
    }
  }, [scrollerSlug])

  // Stabilize fetchContent to prevent race conditions
  const stableFetchContent = useCallback(fetchContent, [scrollerSlug])

  // Simplified infinite scroll trigger - only when near the end
  useEffect(() => {
    // Only trigger when we're at the last few items and not already generating
    const shouldTrigger = currentIndex >= content.length - 3 && content.length > 0 && !isGenerating && !isLoading
    
    // Additional check: only trigger if we haven't already requested this offset
    const wouldRequestOffset = content.length
    const isNewOffset = lastLoadMoreOffset.current !== wouldRequestOffset
    
    if (shouldTrigger && isNewOffset) {
      console.log(`🔄 [CLIENT] Triggering load more: currentIndex=${currentIndex}, contentLength=${content.length}, newOffset=${wouldRequestOffset}`)
      stableFetchContent(true)
    }
  }, [currentIndex, content.length, isGenerating, isLoading, stableFetchContent])

  // Cycle through witty messages for initial loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCreationMessageIndex((prev) => (prev + 1) % CREATION_MESSAGES.length)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [isLoading])


  // Cycle through witty wait messages (debug or normal)
  useEffect(() => {
    if (isGenerating) {
      const messages = isDebugMode ? DEBUG_WAIT_MESSAGES : WAIT_MESSAGES
      const interval = setInterval(() => {
        setWaitMessageIndex((prev) => (prev + 1) % messages.length)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [isGenerating, isDebugMode])

  // Use useCallback to stabilize scroll handler and prevent constant re-registration
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    
    // Don't block mobile scroll during keyboard animation
    if (isKeyboardScrolling.current) return
    
    const container = containerRef.current
    const scrollPosition = container.scrollTop
    const windowHeight = window.innerHeight
    
    // More forgiving scroll detection for mobile momentum scrolling
    const rawIndex = scrollPosition / windowHeight
    const newIndex = Math.round(rawIndex)
    
    // Calculate the maximum allowed index
    const maxIndex = isGenerating ? content.length : content.length - 1
    
    // Clamp the index to valid range
    const clampedIndex = Math.max(0, Math.min(newIndex, maxIndex))
    
    // Update current index if it changed and is valid
    if (clampedIndex !== currentIndex && clampedIndex >= 0) {
      setCurrentIndex(clampedIndex)
    }
    
    // Prevent scrolling beyond available content bounds
    if (newIndex > maxIndex) {
      container.scrollTo({
        top: maxIndex * windowHeight,
        behavior: 'smooth'
      })
    } else if (newIndex < 0) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [currentIndex, content.length, isGenerating])

  // Stable scroll listener registration
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Use passive scroll listener for better mobile performance
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

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
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black scroll-container"
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
                {(isDebugMode ? DEBUG_WAIT_MESSAGES : WAIT_MESSAGES)[waitMessageIndex]}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}