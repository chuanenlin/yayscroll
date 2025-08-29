'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchBoxOpen, setSearchBoxOpen] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Debounced suggestion fetching
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (showSuggestions && prompt.trim().length > 0) {
        setIsLoadingSuggestions(true)
        try {
          const response = await fetch('/api/suggestions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: prompt }),
          })
          const data = await response.json()
          setSuggestions(data.suggestions || [])
        } catch (error) {
          console.error('Failed to fetch suggestions:', error)
          setSuggestions([])
        } finally {
          setIsLoadingSuggestions(false)
        }
      } else if (showSuggestions && prompt.trim().length === 0) {
        // Set static suggestions immediately for empty input
        setSuggestions([
          "World wonders",
          "SAT vocabulary", 
          "Coding challenges",
          "Historical facts",
          "Science trivia"
        ])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [prompt, showSuggestions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return

    const title = prompt.split(' ').slice(0, 4).join(' ')

    setIsLoading(true)
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-32 sm:py-36">
        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light text-white mb-8 text-center tracking-tight leading-none">
          Doomscroll Anything
        </h1>
        
        {/* Form - Google-style minimal */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8" style={{ minHeight: '88px' }}>
          <div className="flex gap-3 items-start">
            <div className="relative flex-1" style={{ minHeight: '56px' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => {
                setSearchBoxOpen(true)
                setShowSuggestions(true)
              }}
              onBlur={() => setTimeout(() => {
                setShowSuggestions(false)
                setSearchBoxOpen(false)
              }, 150)}
              placeholder="What to scroll?"
              rows={1}
              className={`w-full px-6 py-4 bg-white text-gray-900 text-sm focus:outline-none ${searchBoxOpen || (showSuggestions && (suggestions.length > 0 || isLoadingSuggestions)) ? 'border-l border-r border-t border-gray-200' : 'border border-gray-200'} resize-none overflow-hidden font-normal placeholder:text-gray-400 shadow-lg hover:shadow-xl focus:shadow-2xl`}
              style={{
                height: 'auto',
                minHeight: '56px',
                borderRadius: searchBoxOpen || (showSuggestions && (suggestions.length > 0 || isLoadingSuggestions))
                  ? '12px 12px 0 0' 
                  : '12px',
                transition: (searchBoxOpen || (showSuggestions && (suggestions.length > 0 || isLoadingSuggestions))) 
                  ? 'none' 
                  : 'border-radius 150ms ease-out'
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
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setSearchBoxOpen(false);
                }
              }}
              required
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions || prompt.trim().length === 0) && (
              <div className="absolute top-full left-0 right-0 -mt-2 bg-white border-l border-r border-b border-gray-200 rounded-b-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="px-4 py-3 text-gray-500 text-sm flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    Getting suggestions...
                  </div>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-900 text-sm border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur
                        setPrompt(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))
                )}
              </div>
            )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-4 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 border border-gray-300 hover:border-gray-400 shadow-lg hover:shadow-xl whitespace-nowrap flex items-center justify-center"
              style={{ minHeight: '56px', marginTop: '-2px' }}
            >
              Scroll
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
            © {new Date().getFullYear()} Doomscroll Anything. All rights reserved.
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
