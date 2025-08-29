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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Title */}
        <h1 className="text-7xl sm:text-8xl font-bold text-white mb-4 text-center">
          YayScroll
        </h1>
        
        {/* Tagline */}
        <p className="text-xl text-white/60 mb-12 text-center max-w-md">
          Create your infinite scroll of anything
        </p>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xs sm:max-w-lg mb-16">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Wikipedia facts, SAT vocabulary, Leet code solutions, ..."
            rows={1}
            className="w-full px-3 py-4 sm:px-6 sm:py-4 bg-transparent border border-white/20 text-white text-sm sm:text-lg rounded-lg focus:border-white focus:outline-none placeholder:text-white/40 mb-6 resize-none overflow-hidden min-h-[96px] sm:min-h-[56px]"
            style={{
              height: 'auto',
              minHeight: isMobile ? '96px' : '56px'
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
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-white text-black py-2 px-3 sm:py-4 sm:px-6 rounded-lg text-sm sm:text-lg font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating...' : 'Scroll'}
          </button>
        </form>
        
        {/* Trending Scrolls */}
        <div className="text-center">
          <h2 className="text-2xl text-white mb-6">Trending Scrolls</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            <div className="border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-white text-sm">Wikipedia Facts</div>
            </div>
            <div className="border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
              <div className="text-2xl mb-2">🧠</div>
              <div className="text-white text-sm">GRE Vocabulary</div>
            </div>
            <div className="border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
              <div className="text-2xl mb-2">💭</div>
              <div className="text-white text-sm">Daily Quotes</div>
            </div>
            <div className="border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer">
              <div className="text-2xl mb-2">💻</div>
              <div className="text-white text-sm">Programming Tips</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 px-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between text-white/40 text-sm gap-2">
          <div className="text-center sm:text-left">
            © {new Date().getFullYear()} YayScroll All rights reserved
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
