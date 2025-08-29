'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    const title = prompt.split(' ').slice(0, 4).join(' ')

    setIsLoading(true)
    try {
      const response = await fetch('/api/scrollers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          promptTemplate: prompt,
        }),
      })

      if (response.ok) {
        const { slug } = await response.json()
        router.push(`/${slug}`)
      }
    } catch (error) {
      console.error('Error creating scroller:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:py-16">
        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light text-white mb-8 text-center tracking-tight leading-none">
          YayScroll
        </h1>
        
        {/* Form - Google-style minimal */}
        <form onSubmit={handleSubmit} className="w-full max-w-lg mb-8">
          <div className="relative mb-8">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Search for anything: Wikipedia facts, SAT vocabulary, coding solutions..."
              rows={1}
              className="w-full pl-12 pr-6 py-4 bg-white text-gray-900 text-base rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 border border-gray-200 resize-none overflow-hidden transition-all duration-300 font-normal placeholder:text-gray-400 shadow-sm hover:shadow-md focus:shadow-lg"
              style={{
                height: 'auto',
                minHeight: '56px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.max(56, target.scrollHeight) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              required
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-8 py-3 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </span>
              ) : (
                'Create Scroll'
              )}
            </button>
          </div>
        </form>
        
        {/* Trending Scrolls */}
        <div className="text-center max-w-4xl mt-16">
          <h2 className="text-lg text-gray-400 mb-6 font-light tracking-wide">Trending Scrolls</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <a
              href="/wikipedia-facts"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900/20 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3 sm:p-4 hover:border-gray-600/50 hover:bg-gray-800/30 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="text-white text-sm font-medium mb-2 group-hover:text-gray-100">Wikipedia Facts</div>
              <div className="text-gray-400 text-sm font-light leading-relaxed line-clamp-3 group-hover:text-gray-300">
                The Great Wall of China isn&apos;t visible from space with the naked eye, contrary to popular belief.
              </div>
            </a>
            <a
              href="/gre-vocabulary"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900/20 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3 sm:p-4 hover:border-gray-600/50 hover:bg-gray-800/30 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="text-white text-sm font-medium mb-2 group-hover:text-gray-100">GRE Vocabulary</div>
              <div className="text-gray-400 text-sm font-light leading-relaxed line-clamp-3 group-hover:text-gray-300">
                <strong>Ephemeral:</strong> Lasting for a very short time; transitory or fleeting in nature.
              </div>
            </a>
            <a
              href="/daily-quotes"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900/20 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3 sm:p-4 hover:border-gray-600/50 hover:bg-gray-800/30 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="text-white text-sm font-medium mb-2 group-hover:text-gray-100">Daily Quotes</div>
              <div className="text-gray-400 text-sm font-light leading-relaxed line-clamp-3 group-hover:text-gray-300">
                &ldquo;The only way to do great work is to love what you do.&rdquo; — Steve Jobs
              </div>
            </a>
            <a
              href="/programming-tips"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900/20 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3 sm:p-4 hover:border-gray-600/50 hover:bg-gray-800/30 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="text-white text-sm font-medium mb-2 group-hover:text-gray-100">Programming Tips</div>
              <div className="text-gray-400 text-sm font-light leading-relaxed line-clamp-3 group-hover:text-gray-300">
                Use <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">console.log</code> strategically for debugging, but remember to remove them before production.
              </div>
            </a>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between text-gray-500 text-sm gap-3">
          <div className="text-center sm:text-left font-light">
            © {new Date().getFullYear()} YayScroll. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></div>
            <span className="font-light">All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
