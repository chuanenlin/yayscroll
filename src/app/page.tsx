'use client'

import ScrollerCreator from '@/components/ScrollerCreator'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex flex-col transition-colors">
      <ThemeToggle />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">YayScroll</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
            Create your own infinite scroll feed of AI-generated content. 
            Perfect for learning vocabulary, random facts, or anything you want to explore.
          </p>
        </div>
        
        <ScrollerCreator />
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Popular scrollers:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 shadow-sm">
              Wikipedia Facts
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 shadow-sm">
              GRE Vocabulary
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 shadow-sm">
              Daily Quotes
            </span>
            <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 shadow-sm">
              Programming Tips
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
