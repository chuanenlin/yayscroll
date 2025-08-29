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
          content: "Generate 5 short, engaging infinite scroll topics based on the user's partial input. Each topic should be 2-4 words maximum. Return ONLY a comma-separated list without any JSON formatting. Focus on educational, entertaining, or useful content categories."
        },
        {
          role: "user",
          content: `Complete or suggest similar topics to: "${query.trim()}"`
        }
      ],
      max_tokens: 80,
      temperature: 0.7
    })

    let suggestions = []
    try {
      const response = completion.choices[0]?.message?.content?.trim()
      if (response) {
        // Parse comma-separated list
        suggestions = response
          .split(/[,\n]/)
          .map(s => s.trim().replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').replace(/["""]/g, ''))
          .filter(s => s.length > 0 && s.length < 50)
          .slice(0, 5)
      }
    } catch (parseError) {
      console.error('Failed to parse AI suggestions:', parseError)
      suggestions = []
    }

    // Fallback to static suggestions if AI fails
    if (suggestions.length === 0) {
      suggestions = [
        `${query} facts`,
        `${query} trivia`,
        `${query} quotes`,
        `${query} tips`,
        `${query} history`
      ]
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    
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