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

Both databases will be automatically initialized with sample movements and routines on first run.

## Manual Database Operations

If you need to manually work with databases:

```bash
# Seed development database
npm run db:seed

# Seed production database
npm run db:seed:prod

# Migrate development database
npm run db:migrate

# Migrate production database
npm run db:migrate:prod
```

## Usage

- Browse built-in movements and routines as a guest
- Create an account to save custom movements and routines
- Build routines with movement ordering, targets, and sets
- Run practices with guided timers and audio cues
- View practice history and session summaries
