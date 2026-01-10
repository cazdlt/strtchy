# Agent Notes for Strtchy

## Project Overview
Strtchy is a SvelteKit app for tracking stretching and recovery routines. It's built with Svelte 5 (runes), SQLite (Drizzle ORM), Tailwind CSS v4, and Lucia v3 for auth.

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

## Database Setup
- Local dev database: `./data/dev/local.db` (SQLite)
- Local prod database: `./data/prod/local.db` (SQLite)
- Seed data: 28 movements, 6 built-in routines

### Database Scripts (scripts/db/)
| Script | Purpose |
|--------|---------|
| `setup.sh [env]` | Run migrations + seed for dev or prod |
| `reset.sh [env]` | Delete database and run fresh setup |
| `backup.sh [env]` | Export database to SQL file |
| `migrate.ts` | Run migrations only |
| `generate-migration.ts` | Generate migration from current database state |
| `seed.ts` | Seed data only |

### Quick Commands
```bash
# Fresh dev setup (creates DB, runs migrations, seeds data)
./scripts/db/setup.sh dev

# Fresh prod setup
./scripts/db/setup.sh prod

# Reset dev database
./scripts/db/reset.sh dev

# Backup dev database
./scripts/db/backup.sh dev

# Sync schema changes to dev database (development workflow)
npm run db:push

# Generate migration from current database state
npm run db:generate

# Run migrations
npm run db:migrate
```

### Migration Workflow
**DrizzleKit Generate Issue**: `drizzle-kit generate` fails with `TypeError: Cannot read properties of undefined (reading 'length')`.

**Working Workflow**:
1. **Development**: Make schema changes in `src/lib/db/schema.ts`
2. **Sync to dev DB**: Run `npm run db:push` to sync schema changes
3. **Generate migration**: Run `npm run db:generate` to create migration file
4. **Deploy**: Run migrations on production with `npm run db:migrate`

**Manual Migration Creation** (alternative):
1. Make schema changes in `src/lib/db/schema.ts`
2. Run `npm run db:push` to sync to dev database
3. Run `drizzle-kit introspect` to update `drizzle/schema.ts`
4. Run `npm run db:generate` to create migration file in `drizzle/migrations/`
5. Verify migration file is created in `drizzle/migrations/<timestamp>_<random>.sql`

## PWA
- Configured with VitePWA plugin
- Works offline after first load
- Installable as mobile app
