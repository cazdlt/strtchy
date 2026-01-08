# Strtchy

A stretching and recovery routine tracker inspired by Hevy. Create custom movements, build routines, and track your practice sessions.

## Features

- Create custom stretching and recovery movements
- Build personalized routines with movements and settings
- Practice player with timers, audio cues, and rest periods
- Track practice history and session summaries
- User accounts for personalized content
- PWA support for offline use

## Tech Stack

- SvelteKit (Svelte 5 with runes)
- SQLite + Drizzle ORM
- Tailwind CSS v4
- Lucia v3 for authentication
- Vite PWA

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will automatically create a local SQLite database (`local.db`) and seed it with sample movements and routines on first run.

## Usage

- Browse built-in movements and routines as a guest
- Create an account to save custom movements and routines
- Build routines with movement ordering, targets, and sets
- Run practices with guided timers and audio cues
- View practice history and session summaries
