# Agent Notes for Strtchy

## Project Overview
Strtchy is a SvelteKit app for tracking stretching and recovery routines. It's built with Svelte 5 (runes), SQLite (Drizzle ORM), Tailwind CSS v4, and BetterAuth v1 for auth.

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
npm run db:setup     # Setup dev database (migrations + seed)
npm run db:reset     # Reset dev database (delete and reinitialize)
npm run db:backup    # Backup dev database to SQL file
npm run db:push      # Push schema changes to dev DB
npm run db:generate  # Generate migration from dev DB
npm run db:migrate   # Run migrations
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
- Local dev database: `./data/dev/local.db` (SQLite)
- Local prod database: `./data/prod/local.db` (SQLite)
- Seed data: 27 movements, 3 built-in routines

### Database Scripts (scripts/db/)
| Script | Purpose |
|--------|---------|
| `setup.sh [env]` | Run migrations + seed for dev or prod |
| `reset.sh [env]` | Delete database and run fresh setup |
| `backup.sh [env]` | Export database to SQL file |

### Migration Workflow

**Important Note**: `drizzle-kit generate` fails with `TypeError: Cannot read properties of undefined (reading 'length')`. Use the working workflow below.

**Working Workflow** (for schema changes):
1. **Development**: Make schema changes in `src/lib/db/schema.ts`
2. **Sync to dev DB**: Run `npm run db:push` to sync schema changes to dev database
3. **Generate migration**: Run `npm run db:generate` to create migration file
4. **Review migration**: Check the generated migration file in `drizzle/migrations/`
5. **Deploy**: Run migrations on production with `npm run db:migrate`

**When to use db:push vs db:generate**:
- `db:push`: Use during development to quickly sync schema changes to dev database without creating migration files
- `db:generate`: Use when ready to create a formal migration for production deployment

**Manual Migration Creation** (alternative approach):
1. Make schema changes in `src/lib/db/schema.ts`
2. Run `npm run db:push` to sync to dev database
3. Run `drizzle-kit introspect` to update `drizzle/schema.ts`
4. Run `npm run db:generate` to create migration file in `drizzle/migrations/`
5. Verify migration file is created in `drizzle/migrations/<timestamp>_<random>.sql`

### Quick Reference
| npm script | Shell script | Purpose |
|-----------|--------------|---------|
| `npm run db:setup` | `./scripts/db/setup.sh dev` | Setup dev DB (migrations + seed) |
| `npm run db:setup:prod` | `./scripts/db/setup.sh prod` | Setup prod DB |
| `npm run db:reset` | `./scripts/db/reset.sh dev` | Reset dev DB |
| `npm run db:reset:prod` | `./scripts/db/reset.sh prod` | Reset prod DB |
| `npm run db:backup` | `./scripts/db/backup.sh dev` | Backup dev DB to SQL |
| `npm run db:backup:prod` | `./scripts/db/backup.sh prod` | Backup prod DB |
| - | `./scripts/db/migrate.ts` | Run migrations only |
| - | `./scripts/db/seed.ts` | Seed data only |

## PWA
- Configured with VitePWA plugin
- Works offline after first load
- Installable as mobile app
