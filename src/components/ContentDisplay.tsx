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

  // Create JSX elements by parsing the content and URL placeholders
  const renderContent = () => {
    let displayContent = content
    const elements: JSX.Element[] = []
    let elementIndex = 0
    
    // Replace URL placeholders with clickable links
    urls.forEach((urlData, index) => {
      const placeholder = `__URL_${index}__`
      if (displayContent.includes(placeholder)) {
        const parts = displayContent.split(placeholder)
        displayContent = parts.join(`__LINK_${elementIndex}__`)
        elementIndex++
      }
    })
    
    // Comprehensive markdown parsing
    const parseMarkdown = (text: string) => {
      const elements: JSX.Element[] = []

      // Handle code blocks first
      if (text.includes('```')) {
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
        const parts = text.split(codeBlockRegex)
        
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
          
          // Regular content - parse other markdown
          return parseInlineMarkdown(part, index)
        }).flat().filter(Boolean)
      }
      
      return [parseInlineMarkdown(text, 0)]
    }

    const parseInlineMarkdown = (text: string, baseIndex: number) => {
      const elements: JSX.Element[] = []
      let currentText = text
      let keyIndex = baseIndex * 1000

      // Handle headers (# ## ###)
      currentText = currentText.replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, content) => {
        const level = hashes.length
        const headerClass = level === 1 ? 'text-4xl font-bold mb-4' : 
                           level === 2 ? 'text-3xl font-bold mb-3' : 
                           'text-2xl font-semibold mb-2'
        elements.push(<div key={`h${level}-${keyIndex++}`} className={`${headerClass} text-white`}>{content}</div>)
        return `__HEADER_${elements.length - 1}__`
      })

      // Handle bold (**text**)
      currentText = currentText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
        elements.push(<strong key={`bold-${keyIndex++}`} className="font-bold text-white">{content}</strong>)
        return `__BOLD_${elements.length - 1}__`
      })

      // Handle italic (*text*)
      currentText = currentText.replace(/\*(.*?)\*/g, (match, content) => {
        elements.push(<em key={`italic-${keyIndex++}`} className="italic text-white/90">{content}</em>)
        return `__ITALIC_${elements.length - 1}__`
      })

      // Handle inline code (`code`)
      currentText = currentText.replace(/`([^`]+)`/g, (match, content) => {
        elements.push(<code key={`inline-code-${keyIndex++}`} className="bg-gray-800 px-2 py-1 rounded text-green-400 font-mono">{content}</code>)
        return `__INLINE_CODE_${elements.length - 1}__`
      })

      // Handle bullet points (including actual bullet character •)
      currentText = currentText.replace(/^[\s]*[-*+•]\s+(.+)$/gm, (match, content) => {
        elements.push(<div key={`bullet-${keyIndex++}`} className="flex items-start mb-2"><span className="text-white mr-2">•</span><span className="text-white">{content}</span></div>)
        return `__BULLET_${elements.length - 1}__`
      })

      // Handle numbered lists
      currentText = currentText.replace(/^[\s]*(\d+\.)\s+(.+)$/gm, (match, number, content) => {
        elements.push(<div key={`number-${keyIndex++}`} className="flex items-start mb-2"><span className="text-white mr-2">{number}</span><span className="text-white">{content}</span></div>)
        return `__NUMBER_${elements.length - 1}__`
      })

      // Handle line breaks
      currentText = currentText.replace(/\n\n/g, '__PARAGRAPH_BREAK__')
      currentText = currentText.replace(/\n/g, '__LINE_BREAK__')

      // Split by all possible placeholders and process each part
      const allPlaceholders = /(__(?:LINK|HEADER|BOLD|ITALIC|INLINE_CODE|BULLET|NUMBER)_\d+__|__(?:PARAGRAPH_BREAK|LINE_BREAK)__)/g
      const parts = currentText.split(allPlaceholders)
      
      return parts.map((part, index) => {
        if (!part) return null

        // Check for link placeholders
        const linkMatch = part.match(/^__LINK_(\d+)__$/)
        if (linkMatch) {
          const linkIndex = parseInt(linkMatch[1])
          const urlData = urls[linkIndex]
          
          if (urlData) {
            return (
              <a
                key={`link-${baseIndex}-${index}`}
                href={urlData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 text-base hover:text-white/60 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <br />
                <span className="text-sm">{urlData.text}</span>
              </a>
            )
          }
        }

        // Check for other markdown elements
        const elementMatch = part.match(/^__(HEADER|BOLD|ITALIC|INLINE_CODE|BULLET|NUMBER)_(\d+)__$/)
        if (elementMatch) {
          const elementIndex = parseInt(elementMatch[2])
          return elements[elementIndex] || null
        }

        // Handle paragraph breaks and line breaks
        if (part === '__PARAGRAPH_BREAK__') {
          return <div key={`p-break-${baseIndex}-${index}`} className="mb-4"></div>
        }
        if (part === '__LINE_BREAK__') {
          return <br key={`br-${baseIndex}-${index}`} />
        }

        // Handle any remaining __LINK_X__ patterns that weren't caught
        const remainingLinkMatch = part.match(/__LINK_(\d+)__/)
        if (remainingLinkMatch) {
          const linkIndex = parseInt(remainingLinkMatch[1])
          const urlData = urls[linkIndex]
          
          if (urlData) {
            return (
              <a
                key={`remaining-link-${baseIndex}-${index}`}
                href={urlData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 text-base hover:text-white/60 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <br />
                <span className="text-sm">{urlData.text}</span>
              </a>
            )
          }
          // If no URL data, just remove the placeholder
          return <span key={`missing-link-${baseIndex}-${index}`}>{part.replace(/__LINK_\d+__/g, '')}</span>
        }

        // Regular text
        if (part.trim()) {
          return <span key={`text-${baseIndex}-${index}`}>{part}</span>
        }
        
        return null
      }).filter(Boolean)
    }

    return parseMarkdown(displayContent)
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
    </div>
  )
}