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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 sm:py-32">
        {/* Title */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-light text-white mb-6 text-center tracking-tight leading-none">
          YayScroll
        </h1>
        
        {/* Tagline */}
        <p className="text-lg sm:text-xl text-gray-400 mb-16 text-center max-w-lg font-light tracking-wide">
          Create your infinite scroll of anything
        </p>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md sm:max-w-xl mb-20">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Wikipedia facts, SAT vocabulary, Leet code solutions..."
              rows={1}
              className="w-full px-5 py-5 sm:px-6 sm:py-6 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 text-white text-base sm:text-lg rounded-2xl focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 focus:outline-none placeholder:text-gray-500 mb-4 resize-none overflow-hidden transition-all duration-300 font-light"
              style={{
                height: 'auto',
                minHeight: isMobile ? '120px' : '80px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-white text-gray-900 py-4 sm:py-5 px-6 rounded-2xl text-base sm:text-lg font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin"></div>
                Creating...
              </span>
            ) : (
              'Create Scroll'
            )}
          </button>
        </form>
        
        {/* Trending Scrolls */}
        <div className="text-center max-w-4xl">
          <h2 className="text-xl sm:text-2xl text-gray-300 mb-8 font-light tracking-wide">Trending Scrolls</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <a
              href="/wikipedia-facts"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900/30 backdrop-blur-sm border border-gray-700/40 rounded-xl p-4 sm:p-5 hover:border-gray-600/60 hover:bg-gray-800/40 transition-all duration-300 cursor-pointer transform hover:scale-105 text-left"
            >
              <div className="text-white text-sm font-medium mb-3 group-hover:text-gray-100">Wikipedia Facts</div>
              <div className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed line-clamp-3 group-hover:text-gray-200">
                The Great Wall of China isn't visible from space with the naked eye, contrary to popular belief.
              </div>
            </a>
            <a
              href="/gre-vocabulary"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900/30 backdrop-blur-sm border border-gray-700/40 rounded-xl p-4 sm:p-5 hover:border-gray-600/60 hover:bg-gray-800/40 transition-all duration-300 cursor-pointer transform hover:scale-105 text-left"
            >
              <div className="text-white text-sm font-medium mb-3 group-hover:text-gray-100">GRE Vocabulary</div>
              <div className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed line-clamp-3 group-hover:text-gray-200">
                <strong>Ephemeral:</strong> Lasting for a very short time; transitory or fleeting in nature.
              </div>
            </a>
            <a
              href="/daily-quotes"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900/30 backdrop-blur-sm border border-gray-700/40 rounded-xl p-4 sm:p-5 hover:border-gray-600/60 hover:bg-gray-800/40 transition-all duration-300 cursor-pointer transform hover:scale-105 text-left"
            >
              <div className="text-white text-sm font-medium mb-3 group-hover:text-gray-100">Daily Quotes</div>
              <div className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed line-clamp-3 group-hover:text-gray-200">
                "The only way to do great work is to love what you do." — Steve Jobs
              </div>
            </a>
            <a
              href="/programming-tips"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900/30 backdrop-blur-sm border border-gray-700/40 rounded-xl p-4 sm:p-5 hover:border-gray-600/60 hover:bg-gray-800/40 transition-all duration-300 cursor-pointer transform hover:scale-105 text-left"
            >
              <div className="text-white text-sm font-medium mb-3 group-hover:text-gray-100">Programming Tips</div>
              <div className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed line-clamp-3 group-hover:text-gray-200">
                Use <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">console.log</code> strategically for debugging, but remember to remove them before production.
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
