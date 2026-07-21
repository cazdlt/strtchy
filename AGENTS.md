# Agent Notes for Strtchy

## Project Overview

Strtchy is a SvelteKit app for tracking stretching and recovery routines. It's built with Svelte 5 (runes), SQLite (Drizzle ORM), Tailwind CSS v4, and BetterAuth v1 for auth.

## Design System

**Critical**: Always consult `design-system.md` for visual direction. The design philosophy is **"Zen Athletic 80s"** - warm, geometric, retro athletic aesthetics inspired by 80s gymnasiums and Nike campaigns. See `design-system.md` for complete specs including color variables, typography scale, component patterns, and motion guidelines.

## Tech Stack & Versions

- **SvelteKit**: Latest with Svelte 5 runes mode
- **Runtime**: Node.js (server-side rendering)
- **Database**: SQLite with better-sqlite3 driver
- **ORM**: Drizzle ORM v0.45.1 (stable)
- **Auth**: BetterAuth v1
- **Styling**: Tailwind CSS v4 via @tailwindcss/postcss
- **PWA**: VitePWA plugin

## Important Agent Instructions

- **NEVER start dev servers automatically** - Only start `npm run dev` if explicitly requested by the user
- **NEVER run any server commands** - Assume dev server is already running, do not run any npm run dev commands

## Important Architecture Notes

### Authentication

- Custom Drizzle adapter in `src/lib/db/adapter.ts`
- BetterAuth v1 uses standard initialization
- Session management in `src/hooks.server.ts`
- Password hashing uses `@oslojs/crypto/sha2` (sha256)

### Svelte 5 Runes

- Use `$state()` for reactive state
- Use `$derived()` for computed values
- Use `$props()` for component props
- Use `onclick` instead of `on:click` for events
- Avoid `$:` reactive statements

### Database Schema

Key tables:

- `users`, `sessions` (auth)
- `movements` - individual exercises (timed, reps, count, distance types)
- `routines` - collections of movements with settings
- `routine_movements` - join table with order, targets, sets
- `practice_logs` - completed sessions
- `practice_data` - per-movement/set data

### Naming Conventions

- **Movements**: Individual exercises (e.g., "Hamstring Stretch")
- **Routines**: Collections of movements with settings
- **Practices**: Completed sessions (instances of doing a routine)
- **Sessions**: Authentication sessions (don't confuse with practices!)

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run check        # Type checking with svelte-check

# Database Operations
npm run db:setup     # Push schema + seed data (uses DATABASE_URL from .env)
npm run db:reset     # Delete database and run fresh setup
npm run db:backup    # Export database to SQL file
npm run db:migrate   # Run pending migrations (safe, idempotent, tracks state)
npm run db:generate  # Generate migration from schema diff
npm run db:push      # Push schema changes without wiping data (dev only!)
```

### Scripts Directory Layout

```
scripts/
  dev.sh              # Sources .env, runs npm run dev (thin wrapper)
  db/
    setup.sh          # Fresh dev setup: drizzle-kit push + seed
    reset.sh          # Delete DB + re-run setup
    backup.sh         # Export DB to ./backups/<timestamp>.sql
    seed.ts           # Seed data (37 movements, 6 built-in routines)
    run-migrations.ts # Canonical migration runner (production-safe)
  docker/
    start.sh          # Fresh Docker deploy (build + migrate + seed)
    upgrade.sh        # Docker upgrade (pull + rebuild + migrate)
  test/
    api.sh            # API endpoint tests (requires running server + API key)
```

## Known Issues

- TypeScript errors in auth files (adapter.ts, auth.ts) don't prevent build
- Svelte 5 rune mode deprecation warnings for `on:click` - use `onclick`
- PostCSS warnings appear but don't affect functionality

## Code Style

- Dark theme with gradient backgrounds
- Emerald accents for success/actions
- Blue/purple gradients for primary actions
- Rounded corners, backdrop blur
- Fixed bottom buttons on mobile

## Practice Player Logic

### Flow Overview

The practice player guides users through routines with the following flow:

1. **Get Ready**: Initial rest period (3s) to prepare
2. **Exercise Execution**: Timed exercise or rep-based counting
3. **Between Sets**: Rest period (if multiple sets)
4. **Switch Sides**: For bilateral exercises, prompts to switch sides
5. **Next Exercise**: Rest period showing upcoming exercise info
6. **Completion**: Rating modal for session feedback

### Bilateral Exercise Handling

- Bilateral exercises track left/right side completion separately
- Set completion requires both sides to be completed
- For rep-based bilateral exercises: after completing one side, user is prompted to switch sides
- For timed bilateral exercises: timer runs for specified duration, then prompts to switch sides
- Rest is taken between sets for all exercise types, including bilateral

### Set Completion Logic

- **Timed exercises**: Set completes when timer reaches duration
- **Rep-based unilateral**: Set completes when target reps reached
- **Rep-based bilateral**: Set completes when both sides reach target reps
- After final set of final movement: show rating modal
- After final set of other movements: rest period, then next exercise
- Between sets (not final): rest period, then continue with same exercise

### Rest Periods

- **Get Ready**: 3s rest at practice start
- **Between sets**: Configurable rest duration from movement settings
- **Between exercises**: Configurable rest from movement settings
- Rest modal displays: countdown timer, next exercise name/type, optional rest skip button

### State Management (Practice Page)

Key reactive states in `/src/routes/practice/[id]/+page.svelte`:

- `currentMovementIndex`: Current movement in routine (0-based)
- `currentSet`: Current set number (1-based)
- `currentSide`: 'left' | 'right' (for bilateral exercises)
- `remainingTime`: Countdown timer for timed exercises/rest
- `repsCompleted`: Rep counter for rep-based exercises

## Database Setup

- Local dev database: `./data/dev/local.db` (SQLite, via `DATABASE_URL` in `.env`)
- Prod database path is set in `docker-compose.yml` (`/app/data/prod/local.db`)
- Seed data: 37 movements, 6 built-in routines

### Database Scripts

All scripts read `DATABASE_URL` from `.env`:

| npm script           | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `npm run db:setup`   | Push schema + seed data (idempotent, uses `drizzle-kit push`) |
| `npm run db:reset`   | Delete DB and run fresh setup                         |
| `npm run db:backup`  | Export DB to `./backups/local_<timestamp>.sql`         |
| `npm run db:migrate` | Run pending migrations (safe, idempotent, tracks state in `__drizzle_migrations` table) |
| `npm run db:generate`| Generate migration from schema diff (creates SQL + snapshot + journal entry) |
| `npm run db:push`    | ⚠️ Sync schema without wiping data (dev only, not for prod) |

### Migration System

Migrations are stored in `drizzle/*.sql` with metadata in `drizzle/meta/`:

- `drizzle/0000_nervous_slipstream.sql` — Baseline schema (creates all tables)
- `drizzle/0001_update_practice_data.sql` — Data migration example (column rename + data backfill)
- `drizzle/meta/_journal.json` — Lists migrations and their order
- `drizzle/meta/000X_snapshot.json` — Schema state after each migration

**Custom runner**: `scripts/db/run-migrations.ts` handles edge cases:
- **Fresh DB**: Applies baseline, skips data migrations for tables that don't exist yet
- **Production upgrade**: Skips baseline if tables exist, applies data migrations
- **Already migrated**: Skips if hash exists in `__drizzle_migrations` table

### Schema Changes Workflow

**For development (quick iteration):**
1. Edit `src/lib/db/schema.ts`
2. Run `npm run db:push` to sync to dev database
3. Test the app
4. If you need to start fresh: `npm run db:reset`

**For production (tracked migrations):**
1. Edit `src/lib/db/schema.ts`
2. Run `npm run db:generate` to create a new migration file
3. Test the migration locally: `npm run db:migrate`
4. Commit the new `drizzle/000X_*.sql`, `drizzle/meta/` files
5. Deploy and run `npm run db:migrate` on production

**Important**: `db:push` is for development only. It can drop columns and recreate tables, which destroys data. Always use `db:migrate` on production.

## PWA

- Configured with VitePWA plugin
- Works offline after first load
- Installable as mobile app
