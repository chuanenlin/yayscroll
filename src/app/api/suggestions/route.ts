import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || query.trim().length < 2) {
      // Return static suggestions for short queries
      const staticSuggestions = [
        "World wonders",
        "SAT vocabulary", 
        "Coding challenges",
        "Historical facts",
        "Science trivia",
        "Movie quotes",
        "Philosophy quotes",
        "Math problems",
        "Language learning",
        "Fun facts"
      ]
      return NextResponse.json({ suggestions: staticSuggestions.slice(0, 5) })
    }

    // Use AI for longer queries
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an autocomplete system for infinite scroll content topics. Complete the user's partial input by suggesting engaging, scroll-worthy topics that START with their exact input. Think about topics that would generate interesting, varied content for endless scrolling (like facts, trivia, quotes, tips, stories, discoveries, etc.). Return ONLY a comma-separated list of 5 completions that begin with the user's text. Each should be 2-5 words maximum."
        },
        {
          role: "user",
          content: `Autocomplete this partial input: "${query.trim()}"`
        }
      ],
      max_tokens: 80,
      temperature: 0.7
    })

    let suggestions = []
    try {
      const response = completion.choices[0]?.message?.content?.trim()
      if (response) {
        const queryLower = query.toLowerCase().trim()
        // Parse comma-separated list and filter to only include actual completions
        suggestions = response
          .split(/[,\n]/)
          .map(s => s.trim().replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').replace(/["""]/g, ''))
          .filter(s => {
            const sLower = s.toLowerCase()
            return s.length > 0 && 
                   s.length < 50 && 
                   sLower.startsWith(queryLower) && 
                   sLower !== queryLower // Don't suggest exact match
          })
          .slice(0, 5)
      }
    } catch (parseError) {
      console.error('Failed to parse AI suggestions:', parseError)
      suggestions = []
    }


    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    console.error('Error details:', error.message)
    
    // Return fallback suggestions
    const fallbackSuggestions = [
      "World wonders",
      "Science facts", 
      "History trivia",
      "Tech tips",
      "Fun quotes"
    ]
    
    return NextResponse.json({ suggestions: fallbackSuggestions })
  }
}