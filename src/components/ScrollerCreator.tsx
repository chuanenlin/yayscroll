'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScrollerCreator() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    // Generate a title from the prompt (first few words)
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
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What content do you want to scroll through?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Random Wikipedia facts, GRE vocabulary words with definitions, Latest Roblox updates, Programming tips..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-4 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Scroller'}
        </button>
      </form>
    </div>
  )
}