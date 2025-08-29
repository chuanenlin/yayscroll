'use client'

import ScrollerFeed from '@/components/ScrollerFeed'
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ScrollerPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function ScrollerPage({ params }: ScrollerPageProps) {
  const [slug, setSlug] = useState<string>('')
  const [scrollerExists, setScrollerExists] = useState<boolean | null>(null)

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

  if (scrollerExists === null) {
    return (
      <div className="h-screen bg-black dark:bg-white flex items-center justify-center">
        <div className="text-white dark:text-black">Loading...</div>
      </div>
    )
  }

  if (scrollerExists === false) {
    notFound()
  }

  return <ScrollerFeed scrollerSlug={slug} />
}