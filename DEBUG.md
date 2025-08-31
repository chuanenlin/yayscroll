# Debug Mode for Yayscroll

## Overview
Debug mode allows you to test the scrolling and loading behavior without making expensive GPT API calls. Instead of generating real content, it creates placeholder scrolls with simulated loading delays.

## Enabling Debug Mode

1. Set the environment variable in `.env.local`:
   ```
   DEBUG_MODE=true
   ```

2. Restart the development server:
   ```bash
   npm run dev
   ```

## What Debug Mode Does

### Placeholder Content Generation
- Creates scrolls numbered "Scroll #1", "Scroll #2", etc.
- Each scroll contains debug information including:
  - Scroll number
  - Generation timestamp
  - Random ID
  - Debug status

### Simulated Loading Delays
- **30-second delay** for each batch of content generation (simulating real API response times)
- Shows debug-specific loading messages like "🧪 DEBUG MODE: Simulating 30-second loading delay..."
- All the same loading states and behaviors as production

### Features Tested
- ✅ Initial content loading (loads first batch with 30s delay)
- ✅ Infinite scroll preloading (triggers when near bottom)
- ✅ Loading state indicators with debug messages
- ✅ Scroll position tracking and keyboard navigation
- ✅ Content deduplication and database storage
- ✅ All timing and buffer management logic

## How to Test

1. **Create a new scroller** at http://localhost:3001
2. **Navigate to your scroller** - you'll see the initial loading with debug messages
3. **Wait ~30 seconds** for the first batch of placeholder content
4. **Scroll down** through the placeholder scrolls
5. **Test infinite loading** by scrolling near the bottom - it will trigger another 30s loading cycle
6. **Test keyboard navigation** with arrow up/down keys

## Switching Back to Production

1. Set the environment variable in `.env.local`:
   ```
   DEBUG_MODE=false
   ```
   or remove the line entirely

2. Restart the development server

## Benefits

- 💰 **Zero API costs** during development and testing
- 🔄 **Same behavior** as production (delays, loading states, scrolling logic)
- 🧪 **Easy testing** of edge cases like slow networks or API timeouts
- 📊 **Database testing** - placeholder content is still stored in the database
- 🐛 **Debug logging** - all the same console output for debugging

## Debug Content Format

Each debug scroll contains:
```
🧪 DEBUG MODE - Scroll #1: [Your Scroller Title]

This is placeholder content for testing the scrolling and loading behavior without using GPT.

Content details:
- Scroll number: 1
- Generated at: 5:30:45 PM
- Random ID: abc123
- Status: Simulated content ready!

This content simulates the same structure as real generated content but saves on API costs during development and testing.
```

The 30-second delay per batch simulates real-world API response times and allows you to test the user experience during content generation.