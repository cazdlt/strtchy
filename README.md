# Strtchy

A stretching and recovery routine tracker inspired by Hevy. Create custom movements, build routines, and track your practice sessions.

## Features

- Create custom stretching and recovery movements
- Build personalized routines with movements, ordering, targets, and sets
- Practice player with:
  - Timed and rep-based exercises
  - Bilateral exercise handling (left/right side completion)
  - Rest periods between exercises and sets
  - Initial "Get Ready" rest at practice start
  - Audio cues and visual feedback
- Track practice history and session summaries
- User accounts for personalized content
- PWA support for offline use

## Tech Stack

- SvelteKit (Svelte 5 with runes)
- SQLite + Drizzle ORM
- Tailwind CSS v4
- BetterAuth v1 for authentication
- Vite PWA

## Quick Start

### Development

```bash
./scripts/dev.sh
```

This script will:

- Check/create `.env` file
- Initialize development database if needed (migrations + seeding)
- Start the development server

### Production

```bash
./scripts/prod.sh
```

This script will:

- Check/create `.env.production` file
- Initialize production database if needed (migrations + seeding)
- Build the application
- Start the production preview server

## Database Structure

The app uses separate databases for different environments:

- **Development**: `./data/dev/local.db`
- **Production**: `./data/prod/local.db`

Both databases are automatically initialized with seed data on first run (27 movements, 3 built-in routines).

## Manual Database Operations

If you need to manually work with databases:

```bash
# Database Setup
npm run db:setup          # Setup dev database (migrations + seed)
npm run db:setup:prod     # Setup prod database

# Database Reset
npm run db:reset          # Reset dev database (delete and reinitialize)
npm run db:reset:prod     # Reset prod database

# Database Backup
npm run db:backup         # Backup dev database to SQL file
npm run db:backup:prod    # Backup prod database

# Schema Management (Development Workflow)
npm run db:push           # Push schema changes to dev DB
npm run db:generate       # Generate migration from dev DB
npm run db:migrate        # Run migrations
```

## Usage

- Browse built-in movements and routines as a guest
- Create an account to save custom movements and routines
- Build routines with movement ordering, targets, and sets
- Run practices with guided timers and audio cues
- View practice history and session summaries
