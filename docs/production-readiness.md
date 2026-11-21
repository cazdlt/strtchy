# Production & Deployment Readiness Diagnostic

This document outlines the technical and architectural requirements for deploying **Strtchy** to public cloud platforms (Vercel, Cloudflare Pages/Workers, Netlify, GCP Cloud Run/Compute Engine).

The application currently operates with a **single-user, local-filesystem architecture**. Deploying it publicly in its current state will result in critical security vulnerabilities (data leaks between users) and runtime failures on serverless/ephemeral platforms.

---

## Priority Matrix

| Priority | Category | Issues | Impact |
| :--- | :--- | :--- | :--- |
| **P0** | **Security & IAM** | Global data leaks, IDOR in mutations, missing route guards | Users can see, edit, or delete each other's data |
| **P0** | **Platform Runtime** | `better-sqlite3` local file, local file upload storage | Runtime crashes on Vercel/Cloudflare/Netlify |
| **P1** | **Auth & API Security** | CSRF disabled, secure cookies off, API key in URL, no password reset | Credential theft, account takeover, brute-force |
| **P2** | **App Resiliency** | PWA lacks offline session caching, no rate limiting | Data loss on network drop, DDoS/scraping risks |
| **P3** | **Compliance & Ops** | Missing observability, health checks, legal pages, GDPR export | Operational blindness, non-compliance |

---

## P0: Critical Blockers (Security & Multi-Tenancy)

### 1. Insecure Direct Object References (IDOR) & Global Data Leaks
* **Problem**: Queries in both page servers and API endpoints fetch records globally without filtering by the authenticated user.
  * `/routines` and `/api/routines`: Load all routines across all users (`db.select().from(routines)`).
  * `/practices` and `/api/practices`: Load all practice logs across all users (`db.select().from(practiceLogs)`).
* **Fix**:
  * Scope private routines and practices to the authenticated user: `where(eq(table.userId, locals.user.id))`.
  * Define explicit visibility flags (`isPublic: boolean`) for routines intended to be discoverable or shared.

### 2. Missing Ownership Checks in Database Mutation Helpers
* **Problem**: The mutation functions in `src/lib/db/helpers/` accept `userId` as an argument but never check it against the record being modified:
  * `updateRoutine` (`routines.ts`): Updates any routine matching `routineId`.
  * `deleteRoutine` (`routines.ts`): Deletes any routine matching `routineId`.
  * `deleteMovement` (`movements.ts`): Deletes any movement matching `movementId`.
  * `deletePractice` (`practices.ts`): Deletes any practice matching `practiceLogId`.
* **Fix**:
  * Verify ownership before executing mutations:
    ```ts
    if (existing.userId !== userId) {
      throw new Error("Forbidden");
    }
    ```
  * Protect built-in seed routines and movements (`isCustom: false`) from being edited or deleted by normal users.

### 3. Unauthenticated Session Hijacking on Practice Player
* **Problem**:
  * `/practice/[id]` (`src/routes/practice/[id]/+page.server.ts`) loads any session by ID without verifying if `practice.userId === locals.user.id`.
  * The `completePractice` action accepts form updates and completes any practice log without requiring authentication.
* **Fix**: Restrict session access and updates strictly to the owning user.

### 4. Missing Server Route Guards
* **Problem**: `src/hooks.server.ts` populates `event.locals.user` from BetterAuth, but does not enforce authentication on protected paths. Pages like `/routine/create` and `/practice/[id]` allow anonymous access.
* **Fix**: Add a route guard in `src/hooks.server.ts`:
  ```ts
  const protectedRoutes = ["/routine/create", "/practice", "/practices", "/profile"];
  if (protectedRoutes.some(path => event.url.pathname.startsWith(path)) && !event.locals.user) {
    throw redirect(302, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
  }
  ```

---

## P0: Platform & Runtime Incompatibilities

### 1. SQLite Engine (`better-sqlite3`)
* **Problem**:
  * `better-sqlite3` uses native C++ addons and operates on a local file (`local.db`).
  * **Vercel / Netlify / Cloudflare Workers**: Read-only or ephemeral filesystems cause runtime errors or erase the database on every cold restart. Cloudflare Workers (V8 isolates) cannot run Node native binaries.
  * **GCP Cloud Run**: Requires a persistent network volume mount (e.g., Cloud Storage FUSE) and must be pinned to `--max-instances 1` to prevent SQLite write lock conflicts.
* **Remediation Paths**:
  * **Option A (Preserve SQLite dialect)**: Switch from `better-sqlite3` to `@libsql/client` (Turso). Drizzle supports Turso seamlessly via `drizzle-orm/libsql`.
  * **Option B (Serverless PostgreSQL)**: Switch to Postgres via Neon or Supabase using `drizzle-orm/neon-http` or `drizzle-orm/postgres-js`.
  * **Option C (Dedicated Container - Selected for Phase 1)**: Deploy as a persistent container via Docker on a VM (GCP Compute Engine) with a persistent disk volume.

---

## Deployment & Mobile Roadmap

### Phase 1: Web MVP on GCP Compute Engine (Immediate / Side-Project)
* **Infrastructure**: GCP Compute Engine (VM `e2-micro` o `e2-small` cubierta con créditos mensuales).
* **Stack**: Docker Compose (`Dockerfile` multi-stage existente) + persistencia en disco de `local.db` (`./data/prod`).
* **Reverse Proxy / Edge**: Cloudflare (plan gratuito) manejando DNS, certificados SSL automáticos y CDN/WAF.
* **Objective**: Salir a producción web rápido sin refactorizar la base de datos, resolviendo primero los P0 de seguridad y aislamiento de datos.

### Phase 2: Decoupled Backend & Cloud Run (Mid-Term Trigger)
* **Trigger**: Prerrequisito para el lanzamiento de la app en **Google Play Store**.
* **Database**: Desacoplar SQLite local hacia PostgreSQL gestionado (Supabase o GCP Cloud SQL) para garantizar respaldos automatizados, alta disponibilidad y eliminar el riesgo de corrupción del archivo `.db`.
* **Driver**: Migrar `drizzle-orm/better-sqlite3` a `drizzle-orm/postgres-js` en `src/lib/db/`.
* **Compute**: Migrar el contenedor a **GCP Cloud Run** (100% *stateless*, autoescalado a cero, menor costo operativo y sin administración ni parches de SO).

### Phase 3: Mobile App with Capacitor (Google Play Store Launch)
* **Target**: Publicación en Google Play Store a mediano plazo.
* **Prerequisite**: Backend desacoplado y desplegado en Cloud Run vía HTTPS (Phase 2).
* **Framework**: Capacitor encapsulando la aplicación SvelteKit.
* **Auth & API**: Consumo de endpoints `/api/*` y BetterAuth mediante tokens (`Authorization: Bearer <token>`).
* **Hardware access**: Integración de hápticos, audio en segundo plano y notificaciones locales para los temporizadores de las rutinas.

### 2. File Uploads on Ephemeral Storage
* **Problem**:
  * `handleIllustrationUpload` in `src/lib/db/helpers/files.ts` writes files directly to `process.cwd()/static/uploads/movements`.
  * Uploaded files are lost when containers restart and will throw `EROFS` (read-only filesystem) errors on Vercel and Cloudflare.
* **Fix**: Replace local filesystem writes with an S3-compatible object storage SDK (Cloudflare R2, AWS S3, or Google Cloud Storage) using presigned upload URLs.

---

## P1: Auth & API Security Hardening

### 1. Insecure BetterAuth Configuration (`src/lib/auth.ts`)
* **Problem**:
  * `disableCSRFCheck: true` disables cross-site request forgery protection.
  * `useSecureCookies: false` transmits session cookies over unencrypted HTTP.
* **Fix**: Enable CSRF checks and use secure cookies in production:
  ```ts
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    disableCSRFCheck: false,
  }
  ```

### 2. Missing Email Service & Password Recovery
* **Problem**:
  * BetterAuth has `requireEmailVerification: false`.
  * No email transport provider (Resend, Postmark, AWS SES) is configured.
  * There is no password recovery/reset flow. Users who forget passwords are permanently locked out.
* **Fix**: Configure an email provider in BetterAuth and implement the forgot/reset password flows.

### 3. API Key Leakage via URL Query String
* **Problem**:
  * In `src/routes/register/+page.server.ts`, newly generated API keys are passed in the redirect query string:
    `/login?registered=true&apiKey=${encodeURIComponent(plaintext)}`
  * This exposes the secret key in browser history, server access logs, and referrer headers.
* **Fix**: Display the generated API key on a one-time authenticated post-registration screen or within `/profile`.

### 4. Lack of Rate Limiting
* **Problem**: `/login`, `/register`, and `/api/*` endpoints have no rate limiting, allowing brute-force password guessing and spam registration.
* **Fix**: Implement rate limiting (e.g., using `@upstash/ratelimit` with Redis or an in-memory/edge bucket limiter).

---

## P2: Product Resiliency & Core Features

### 1. Offline Practice Resiliency (PWA)
* **Problem**: The app installs as a PWA, but completing a practice writes synchronously to the server database. If a user loses connection during a workout, practice submission fails.
* **Fix**: Buffer practice events in browser IndexedDB (or localStorage) and sync with the backend when network connectivity resumes.

### 2. Routine Sharing & Community Visibility
* **Problem**: Routines lack visibility controls (`isPublic`, `authorName`, `forkCount`).
* **Fix**: Add a sharing mechanism: users keep routines private by default, but can mark them public or share via unique read-only links.

---

## P3: Compliance & Observability

1. **Observability**: Integrate structured logging and an error monitoring service (Sentry, GlitchTip, or Datadog).
2. **Health Check Route**: Add `GET /api/health` returning database connectivity status for uptime monitoring.
3. **Legal & Compliance**: Add standard Terms of Service and Privacy Policy pages. Add full data export (JSON dump of user movements, routines, and logs) to comply with data privacy regulations (GDPR).
