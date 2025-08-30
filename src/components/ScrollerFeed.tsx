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

// Debug mode - always enabled for mobile testing (can be toggled later)
const DEBUG_MODE = true // process.env.NODE_ENV === 'development'

// Throttle utility for mobile scroll performance
function throttle<T extends (...args: unknown[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout
  let lastExecTime = 0
  return function (...args: Parameters<T>) {
    const currentTime = Date.now()
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay)
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
  
  // Debug stats for mobile debugging
  const [debugStats, setDebugStats] = useState({
    totalApiCalls: 0,
    lastApiCall: null as Date | null,
    lastContentGenerated: 0,
    totalContentGenerated: 0,
    triggerHistory: [] as Array<{ type: string, timestamp: Date, currentIndex: number, contentLength: number }>,
    scrollEvents: 0,
    lastScrollEvent: null as Date | null,
  })

  const fetchContent = async (loadMore = false) => {
    const startTime = new Date()
    
    // Update debug stats for API call tracking
    setDebugStats(prev => ({
      ...prev,
      totalApiCalls: prev.totalApiCalls + 1,
      lastApiCall: startTime,
    }))
    
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
      console.log(`🔥 API CALL: ${loadMore ? 'LOAD_MORE' : 'INITIAL'} - ${url}`)
      
      const response = await fetch(url)
      if (response.ok) {
        const newContent = await response.json()
        console.log(`✅ API RESPONSE: Got ${newContent.length} items`)
        
        setContent(prev => {
          if (loadMore) {
            // Filter out any content that already exists to prevent duplicates
            const existingIds = new Set(prev.map(item => item.id))
            const uniqueNewContent = newContent.filter((item: ContentItem) => !existingIds.has(item.id))
            console.log(`📊 CONTENT UPDATE: ${uniqueNewContent.length} new items added (${prev.length} -> ${prev.length + uniqueNewContent.length})`)
            
            // Update debug stats
            setDebugStats(prevStats => ({
              ...prevStats,
              lastContentGenerated: uniqueNewContent.length,
              totalContentGenerated: prevStats.totalContentGenerated + uniqueNewContent.length,
            }))
            
            return [...prev, ...uniqueNewContent]
          } else {
            console.log(`📊 INITIAL CONTENT: ${newContent.length} items loaded`)
            
            // Update debug stats for initial load
            setDebugStats(prevStats => ({
              ...prevStats,
              lastContentGenerated: newContent.length,
              totalContentGenerated: newContent.length,
            }))
            
            return newContent
          }
        })
      } else {
        console.error('❌ API ERROR: Response not ok', response.status)
      }
    } catch (error) {
      console.error('❌ FETCH ERROR:', error)
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [scrollerSlug])

  // Stabilize fetchContent to prevent race conditions
  const stableFetchContent = useCallback(fetchContent, [scrollerSlug, content.length, isGenerating])

  // Separate effect for content generation trigger to avoid infinite loops
  useEffect(() => {
    if (currentIndex >= content.length - 25 && content.length > 0 && !isGenerating) {
      const trigger = { 
        type: 'INDEX_TRIGGER', 
        timestamp: new Date(), 
        currentIndex, 
        contentLength: content.length 
      }
      
      console.log('🎯 INDEX TRIGGER:', trigger)
      
      // Track trigger in history
      setDebugStats(prev => ({
        ...prev,
        triggerHistory: [...prev.triggerHistory.slice(-9), trigger] // Keep last 10 triggers
      }))
      
      stableFetchContent(true)
    }
  }, [currentIndex, stableFetchContent, content.length, isGenerating])

  // Additional safety net: trigger content generation on scroll position too
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const checkScrollPosition = () => {
      const scrollPosition = container.scrollTop
      const windowHeight = window.innerHeight
      const totalHeight = container.scrollHeight
      const scrollPercentage = scrollPosition / (totalHeight - windowHeight)
      
      // Update scroll event stats
      setDebugStats(prev => ({
        ...prev,
        scrollEvents: prev.scrollEvents + 1,
        lastScrollEvent: new Date(),
      }))
      
      // If user has scrolled 80% through available content, load more
      if (scrollPercentage > 0.8 && content.length > 0 && !isGenerating) {
        const trigger = { 
          type: 'SCROLL_TRIGGER', 
          timestamp: new Date(), 
          currentIndex, 
          contentLength: content.length 
        }
        
        console.log('📜 SCROLL TRIGGER:', { ...trigger, scrollPercentage, scrollPosition, totalHeight })
        
        // Track trigger in history
        setDebugStats(prev => ({
          ...prev,
          triggerHistory: [...prev.triggerHistory.slice(-9), trigger] // Keep last 10 triggers
        }))
        
        stableFetchContent(true)
      }
    }

    const throttledCheck = throttle(checkScrollPosition, 100) // Throttle to prevent excessive calls
    container.addEventListener('scroll', throttledCheck, { passive: true })
    return () => container.removeEventListener('scroll', throttledCheck)
  }, [content.length, isGenerating, stableFetchContent])

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
    
    // Allow scrolling to the wait message scroll when generating
    const maxIndex = isGenerating ? content.length : content.length - 1
    
    console.log('🔄 SCROLL EVENT:', { scrollPosition, rawIndex, newIndex, currentIndex, maxIndex, contentLength: content.length })
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex <= maxIndex) {
      console.log('📍 INDEX CHANGE:', { from: currentIndex, to: newIndex })
      setCurrentIndex(newIndex)
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
    <div className="relative">
      {/* Floating Debug Panel - always visible */}
      {DEBUG_MODE && (
        <>
          {/* High contrast debug indicator */}
          <div className="fixed top-0 left-0 z-[9999] bg-red-500 text-white p-1 text-xs font-bold">
            DEBUG: {content.length} items | Index: {currentIndex} | {isGenerating ? 'GENERATING' : 'IDLE'}
          </div>
          
          {/* Simple mobile debug bar */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-blue-600 text-white p-2 text-sm font-bold text-center">
            📊 API Calls: {debugStats.totalApiCalls} | Scroll: {debugStats.scrollEvents} | Trigger: {currentIndex >= content.length - 25 ? '🔴 READY' : '🟢 OK'}
          </div>
          
          <div className="fixed top-2 right-2 z-[9999] bg-black text-white text-xs p-2 rounded font-mono w-56 border-2 border-green-500 shadow-2xl" style={{ backgroundColor: '#000000', zIndex: 999999 }}>
            <div className="text-green-400 font-bold mb-1 text-center">🔍 DEBUG</div>
          
          <div className="space-y-1 text-xs">
            <div>Index: {currentIndex}/{content.length - 1}</div>
            <div>Status: <span className={isGenerating ? 'text-yellow-400' : isLoading ? 'text-blue-400' : 'text-green-400'}>
              {isGenerating ? 'GENERATING' : isLoading ? 'LOADING' : 'IDLE'}
            </span></div>
            <div>Content: {content.length} items</div>
            <div>Trigger: ≥{content.length - 25} <span className={currentIndex >= content.length - 25 ? 'text-red-400' : 'text-green-400'}>
              ({currentIndex >= content.length - 25 ? 'READY' : 'NOT_READY'})
            </span></div>
            <div>API calls: {debugStats.totalApiCalls}</div>
            <div>Scroll events: {debugStats.scrollEvents}</div>
            {containerRef.current && (
              <div>Scroll: {Math.round((containerRef.current.scrollTop / (containerRef.current.scrollHeight - window.innerHeight)) * 100)}%</div>
            )}
            
            {debugStats.triggerHistory.length > 0 && (
              <>
                <div className="mt-2 pt-2 border-t border-white/20 text-red-400">Last Triggers:</div>
                {debugStats.triggerHistory.slice(-2).map((trigger, i) => (
                  <div key={i} className="text-xs text-gray-300">
                    {trigger.type.replace('_TRIGGER', '')}: {new Date(trigger.timestamp).toLocaleTimeString()}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        </>
      )}
      
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

          {/* Comprehensive Debug overlay for mobile debugging */}
          {DEBUG_MODE && (
            <div className="absolute top-2 left-2 bg-black/95 text-white text-xs p-3 rounded-lg font-mono max-w-72 max-h-96 overflow-y-auto border border-white/20">
              {/* Header */}
              <div className="text-green-400 font-bold border-b border-white/20 pb-2 mb-2">
                🔍 DEBUG PANEL
              </div>
              
              {/* Current Status */}
              <div className="mb-3">
                <div className="text-blue-400 font-semibold">STATUS</div>
                <div>Card: {index}/{content.length - 1}</div>
                <div>Current: {currentIndex}</div>
                <div>Loading: <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>{isLoading ? 'YES' : 'NO'}</span></div>
                <div>Generating: <span className={isGenerating ? 'text-yellow-400' : 'text-green-400'}>{isGenerating ? 'YES' : 'NO'}</span></div>
              </div>
              
              {/* Content Stats */}
              <div className="mb-3">
                <div className="text-purple-400 font-semibold">CONTENT</div>
                <div>Total items: {content.length}</div>
                <div>Last generated: {debugStats.lastContentGenerated}</div>
                <div>Total generated: {debugStats.totalContentGenerated}</div>
              </div>
              
              {/* Trigger System */}
              <div className="mb-3">
                <div className="text-orange-400 font-semibold">TRIGGERS</div>
                <div>Index trigger: ≥{content.length - 25}</div>
                <div>Should trigger: <span className={currentIndex >= content.length - 25 ? 'text-red-400' : 'text-green-400'}>{currentIndex >= content.length - 25 ? 'YES' : 'NO'}</span></div>
                <div>API calls: {debugStats.totalApiCalls}</div>
                <div>Last API: {debugStats.lastApiCall ? new Date(debugStats.lastApiCall).toLocaleTimeString() : 'Never'}</div>
              </div>
              
              {/* Scroll Stats */}
              <div className="mb-3">
                <div className="text-cyan-400 font-semibold">SCROLL</div>
                <div>Position: {Math.round((containerRef.current?.scrollTop || 0) / window.innerHeight * 100) / 100}</div>
                <div>Height: {Math.round((window.innerHeight || 0) / 100) * 100}px</div>
                <div>Events: {debugStats.scrollEvents}</div>
                <div>Last event: {debugStats.lastScrollEvent ? new Date(debugStats.lastScrollEvent).toLocaleTimeString() : 'Never'}</div>
                {containerRef.current && (
                  <div>Scroll %: {Math.round((containerRef.current.scrollTop / (containerRef.current.scrollHeight - window.innerHeight)) * 100)}%</div>
                )}
              </div>
              
              {/* Recent Triggers */}
              {debugStats.triggerHistory.length > 0 && (
                <div className="mb-2">
                  <div className="text-red-400 font-semibold">RECENT TRIGGERS</div>
                  <div className="max-h-20 overflow-y-auto">
                    {debugStats.triggerHistory.slice(-3).map((trigger, i) => (
                      <div key={i} className="text-xs">
                        {trigger.type}: {trigger.currentIndex}→{trigger.contentLength} ({new Date(trigger.timestamp).toLocaleTimeString()})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Performance */}
              <div className="text-xs text-gray-400 border-t border-white/20 pt-2">
                Performance: {performance.now().toFixed(0)}ms
              </div>
            </div>
          )}
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
    </div>
  )
}