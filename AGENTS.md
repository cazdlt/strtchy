# Agent Notes for Strtchy

## Project Overview
Strtchy is a SvelteKit app for tracking stretching and recovery routines. It's built with Svelte 5 (runes), SQLite (Drizzle ORM), Tailwind CSS v4, and Lucia v3 for auth.

## Tech Stack & Versions
- **SvelteKit**: Latest with Svelte 5 runes mode
- **Runtime**: Node.js (server-side rendering)
- **Database**: SQLite with better-sqlite3 driver
- **ORM**: Drizzle ORM
- **Auth**: Lucia v3 (class-based API, requires custom adapter)
- **Styling**: Tailwind CSS v4 via @tailwindcss/postcss
- **PWA**: VitePWA plugin

## Important Architecture Notes

### Authentication
- Custom Drizzle adapter in `src/lib/db/adapter.ts` (official adapter is deprecated)
- Lucia v3 uses class-based initialization, NOT function-based
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
- Local dev database: `./local.db` (SQLite)
- Seed data: 11 movements, 3 built-in routines
- Run seed script to populate database

## PWA
- Configured with VitePWA plugin
- Works offline after first load
- Installable as mobile app
