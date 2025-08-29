# YayScroll - TikTok Infinite Scroll Clone

A TikTok-style infinite scroll web app where users can create custom feeds of AI-generated content.

## Features

- **Custom Content Feeds**: Users can create scrollers with their own prompts (e.g., Wikipedia facts, GRE vocabulary)
- **TikTok-style Interface**: Full-screen vertical scrolling with snap-to-card behavior
- **AI Content Generation**: Powered by OpenAI GPT-4 for dynamic content creation
- **Infinite Scroll**: Automatically generates new content as users scroll
- **Clean Minimal Design**: No likes, comments, or social features - just content

## Setup Instructions

### 1. Database Setup

You need to run the SQL schema in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL commands

### 2. Environment Variables

The `.env.local` file is already configured with your API keys:

```
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3010`

## How It Works

1. **Landing Page** (`/`): Users can create new scrollers by entering a title and prompt template
2. **Scroller Feed** (`/[slug]`): TikTok-style infinite scroll interface showing AI-generated content
3. **Content Generation**: Each scroller uses OpenAI to generate content based on the user's prompt

## API Routes

- `POST /api/scrollers/create` - Create a new scroller
- `GET /api/scrollers/[slug]/content` - Fetch content for a scroller (auto-generates if needed)
- `POST /api/generate` - Generate content using OpenAI

## Database Schema

- `scrollers`: Stores scroller configurations (slug, title, prompt template)
- `content_items`: Stores generated content items linked to scrollers

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Deployment**: Ready for Vercel

## Usage Examples

Create scrollers for:
- Random Wikipedia facts
- GRE vocabulary practice
- Daily motivational quotes
- Programming tips and tricks
- Historical events
- Science facts
- Language learning phrases

## Next Steps

1. Set up the database schema in Supabase
2. Test creating a scroller from the homepage
3. Test the infinite scroll functionality
4. Deploy to Vercel for production use
