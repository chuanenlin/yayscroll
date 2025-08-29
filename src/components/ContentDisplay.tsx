'use client'

interface ContentDisplayProps {
  content: string
  urls?: Array<{ text: string; url: string }>
}

export default function ContentDisplay({ content, urls = [] }: ContentDisplayProps) {
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
    
    // Split content and render with links
    const parts = displayContent.split(/(__LINK_\d+__)/g)
    
    return parts.map((part, index) => {
      const linkMatch = part.match(/^__LINK_(\d+)__$/)
      if (linkMatch) {
        const linkIndex = parseInt(linkMatch[1])
        const urlData = urls[linkIndex]
        
        if (urlData) {
          return (
            <a
              key={index}
              href={urlData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 dark:text-black/40 text-base hover:text-white/60 dark:hover:text-black/60 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <br />
              <span className="text-xs">{urlData.text}</span>
            </a>
          )
        }
      }
      
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="text-center max-w-4xl">
      <div className="text-white dark:text-black text-lg sm:text-xl md:text-2xl leading-relaxed font-medium">
        {renderContent()}
      </div>
    </div>
  )
}