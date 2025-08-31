'use client'

interface ContentDisplayProps {
  content: string
  urls?: Array<{ text: string; url: string }>
  contentType?: 'short' | 'detailed'
}

export default function ContentDisplay({ content, urls = [], contentType }: ContentDisplayProps) {
  // Determine font size based on content type (for consistency) or content length (fallback)
  const getAdaptiveFontSize = () => {
    // If we have contentType from metadata, use it for consistency within the scroller
    if (contentType) {
      if (contentType === 'detailed') {
        return "text-lg sm:text-xl md:text-2xl lg:text-3xl"
      } else {
        return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
      }
    }
    
    // Fallback to individual analysis (for backwards compatibility)
    const hasCodeBlocks = content.includes('```')
    const textLength = content.replace(/```[\s\S]*?```/g, '').length // Exclude code from length calculation
    
    if (hasCodeBlocks) {
      // Code content - smaller base size
      return "text-lg sm:text-xl md:text-2xl lg:text-3xl"
    } else if (textLength < 50) {
      // Very short content - large but reasonable text
      return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
    } else if (textLength < 200) {
      // Medium content - medium text
      return "text-xl sm:text-2xl md:text-3xl lg:text-4xl"
    } else {
      // Long content - smaller text to fit
      return "text-lg sm:text-xl md:text-2xl lg:text-3xl"
    }
  }

  // Create JSX elements by parsing the content
  const renderContent = () => {
    // Handle code blocks first
    if (content.includes('```')) {
      const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
      const parts = content.split(codeBlockRegex)
      
      return parts.map((part, index) => {
        // Code block content (every 3rd element starting from index 2)
        if (index % 3 === 2) {
          return (
            <div key={`code-${index}`} className="my-4 text-left">
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-green-400 text-sm font-mono">
                <code>{part.trim()}</code>
              </pre>
            </div>
          )
        }
        // Language identifier (every 3rd element starting from index 1) - skip
        if (index % 3 === 1) {
          return null
        }
        
        // Regular content - parse inline markdown directly
        return <div key={`text-${index}`} dangerouslySetInnerHTML={{ __html: formatMarkdown(part) }} />
      }).flat().filter(Boolean)
    }
    
    return [<div key="content" dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />]
  }

  // Simple HTML conversion for markdown formatting
  const formatMarkdown = (text: string) => {
    let html = text
    
    // Process markdown formatting
    html = html
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic text-white/90">$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-green-400 font-mono">$1</code>')
      // Headers
      .replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, content) => {
        const level = hashes.length
        const className = level === 1 ? 'text-4xl font-bold mb-4' : 
                         level === 2 ? 'text-3xl font-bold mb-3' : 
                         'text-2xl font-semibold mb-2'
        return `<div class="${className} text-white">${content}</div>`
      })
      // Bullet points
      .replace(/^[\s]*[-*+•]\s+(.+)$/gm, '<div class="flex items-start mb-2"><span class="text-white mr-2">•</span><span class="text-white">$1</span></div>')
      // Numbered lists
      .replace(/^[\s]*(\d+\.)\s+(.+)$/gm, '<div class="flex items-start mb-2"><span class="text-white mr-2">$1</span><span class="text-white">$2</span></div>')
      // Line breaks
      .replace(/\n\n/g, '<div class="mb-4"></div>')
      .replace(/\n/g, '<br />')

    return html
  }

  // Determine text alignment based on content length
  const getTextAlignment = () => {
    // Remove markdown and URLs for accurate length calculation
    const plainText = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/__URL_\d+__/g, '') // Remove URL placeholders
      .replace(/^#{1,3}\s+/gm, '') // Remove headers
      .replace(/^[\s]*[-*+]\s+/gm, '') // Remove bullet points
      .replace(/^[\s]*\d+\.\s+/gm, '') // Remove numbered lists
      .trim()

    // Only center align if it's very short content that fits on a single row
    // Assume ~40-50 characters per row for mobile, being more conservative
    const isSingleShortRow = plainText.length <= 40 && !plainText.includes('\n')
    
    return isSingleShortRow ? 'text-center' : 'text-left'
  }

  return (
    <div className={`${getTextAlignment()} max-w-5xl w-full`}>
      <div className={`text-white ${getAdaptiveFontSize()} leading-relaxed font-medium`}>
        {renderContent()}
      </div>
      
      {/* Sources section - display as subtle clickable links */}
      {urls.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {urls.map((urlData, index) => (
              <a
                key={index}
                href={urlData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white/70 text-sm underline underline-offset-2 transition-colors duration-200"
              >
                {urlData.text}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}