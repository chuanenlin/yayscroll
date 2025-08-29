'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('yayscroll-theme') as 'light' | 'dark'
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = savedTheme || systemTheme
    
    console.log('Initializing theme:', initialTheme)
    setTheme(initialTheme)
    setMounted(true)
    
    // Apply theme immediately
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
      console.log('Initial dark theme applied')
    } else {
      document.documentElement.classList.remove('dark')
      console.log('Initial light theme applied')
    }

    // Listen for theme changes from other instances
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail
      console.log('Received theme change event:', newTheme)
      setTheme(newTheme)
    }

    window.addEventListener('theme-changed', handleThemeChange as EventListener)
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange as EventListener)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    console.log('Toggling theme from', theme, 'to', newTheme)
    setTheme(newTheme)
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      console.log('Added dark class. Current classes:', document.documentElement.className)
    } else {
      document.documentElement.classList.remove('dark')
      console.log('Removed dark class. Current classes:', document.documentElement.className)
    }
    
    // Save to localStorage
    localStorage.setItem('yayscroll-theme', newTheme)
    console.log('Saved theme to localStorage:', newTheme)
    
    // Dispatch custom event to sync other instances
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: newTheme }))
  }

  if (!mounted) {
    return null // Don't render until mounted
  }

  return (
    <button
      onClick={(e) => {
        console.log('Button clicked!')
        e.preventDefault()
        e.stopPropagation()
        toggleTheme()
      }}
      className="fixed top-4 right-4 z-50 p-3 rounded-full bg-red-500 hover:bg-red-600 border-2 border-white transition-colors cursor-pointer"
      aria-label="Toggle theme"
      style={{ zIndex: 9999 }}
    >
      <div className="text-white font-bold text-xs">
        {theme === 'dark' ? '☀️' : '🌙'}
      </div>
    </button>
  )
}