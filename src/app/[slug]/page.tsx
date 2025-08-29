'use client'

import ScrollerFeed from '@/components/ScrollerFeed'
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'

const WITTY_MESSAGES = [
  "Preparing your scroll...",
  "Training hamsters to run the content wheel...",
  "Asking the AI nicely for good content...",
  "Brewing the perfect scroll sauce...",
  "Summoning content from the digital void...",
  "Polishing pixels for maximum scrollability...",
  "Teaching robots to be creative...",
  "Calibrating the awesome-o-meter...",
  "Consulting the scroll fortune teller...",
  "Mixing content cocktails..."
]

interface ScrollerPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function ScrollerPage({ params }: ScrollerPageProps) {
  const [slug, setSlug] = useState<string>('')
  const [scrollerExists, setScrollerExists] = useState<boolean | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    async function loadSlug() {
      const { slug: resolvedSlug } = await params
      setSlug(resolvedSlug)
      
      // Check if scroller exists by making API call
      try {
        const response = await fetch(`/api/scrollers/${resolvedSlug}/content`)
        if (response.status === 404) {
          setScrollerExists(false)
        } else {
          setScrollerExists(true)
        }
      } catch (error) {
        setScrollerExists(false)
      }
    }
    
    loadSlug()
  }, [params])

  // Cycle through witty messages
  useEffect(() => {
    if (scrollerExists === null) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % WITTY_MESSAGES.length)
      }, 2000) // Change message every 2 seconds
      
      return () => clearInterval(interval)
    }
  }, [scrollerExists])

  if (scrollerExists === null) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 flex flex-col items-center justify-center w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-6"></div>
          <div className="text-white text-center text-xl sm:text-2xl transition-opacity duration-500 max-w-5xl">{WITTY_MESSAGES[messageIndex]}</div>
        </div>
      </div>
    )
  }

  if (scrollerExists === false) {
    notFound()
  }

  return <ScrollerFeed scrollerSlug={slug} />
}