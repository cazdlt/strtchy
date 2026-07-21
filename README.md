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
# 1. Install dependencies
npm install

# 2. Copy .env and set DATABASE_URL
cp .env.example .env

# 3. Initialize database (run migrations + seed data)
npm run db:setup

# 4. Start dev server
npm run dev
```

### Production (Docker)

```bash
# 1. Set up .env.production
cp .env.example .env.production
# Edit .env.production with production values

# 2. Deploy
./scripts/docker/start.sh
```

### Production (Node.js)

```bash
npm run build              # Build the application
DATABASE_URL=./data/prod/local.db npm run db:migrate  # Apply migrations
DATABASE_URL=./data/prod/local.db npm run db:setup   # Seed if fresh
npm run preview            # Start production preview server
```

## Database Structure

The app uses separate databases for different environments:

- **Development**: `./data/dev/local.db`
- **Production**: `./data/prod/local.db`

Both databases are automatically initialized with seed data on first run (27 movements, 3 built-in routines).

## Database Operations

All commands read `DATABASE_URL` from `.env`:

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Reset + push schema + seed data (use for fresh dev DBs) |
| `npm run db:reset` | Delete database and re-run setup |
| `npm run db:backup` | Export database to `./backups/<timestamp>.sql` |
| `npm run db:migrate` | **Run pending migrations** (safe, idempotent, tracks state) |
| `npm run db:generate` | Generate a new migration from current schema diff |
| `npm run db:push` | ⚠️ Directly push schema (dev only, **not for prod**) |

### Migration System (Production Safe)

The project uses Drizzle migrations with a custom runner that handles edge cases:

- **Migrations live in**: `drizzle/*.sql`
- **Journal tracked in**: `drizzle/meta/_journal.json`
- **Applied state stored in DB table**: `__drizzle_migrations`

**Typical schema change workflow:**

```bash
# 1. Edit src/lib/db/schema.ts
# 2. Generate migration from schema diff
npm run db:generate       # Creates drizzle/000X_*.sql + snapshot + journal entry

# 3. Test locally
npm run db:migrate        # Applies pending migrations safely

# 4. Deploy to production
#    Run npm run db:migrate on the production environment
```

**Why not `db:push` for production?**
`db:push` syncs schema directly and drops/recreates tables. It does **not** migrate data. Use `db:migrate` on production, which runs SQL migrations that can transform existing data (like the `practice_data` column rename + data backfill in `0001_update_practice_data.sql`).

## Usage

- Browse built-in movements and routines as a guest
- Create an account to save custom movements and routines
- Build routines with movement ordering, targets, and sets
- Run practices with guided timers and audio cues
- View practice history and session summaries
