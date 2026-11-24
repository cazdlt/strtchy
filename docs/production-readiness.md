# Production & Deployment Readiness

This document tracks the security hardening, infrastructure architecture, backup strategy, and post-launch roadmap for **Strtchy**.

---

## Hardened & Implemented

The core multi-tenancy, authentication, onboarding, and container persistence blockers are resolved:

- **Multi-Tenancy & Ownership Isolation**: User queries and mutations (`routines`, `movements`, `practices`) are scoped by `userId` with ownership verification, protecting built-in seed data (`isCustom: false`).
- **Server Route Guards**: `src/hooks.server.ts` enforces authenticated access on protected routes (`/practices`, `/routine/create`, `/movement/create`, `/profile`, and edit routes).
- **Guest Practice Mode (Option A)**: Unauthenticated visitors can browse and practice built-in routines via an HttpOnly `strtchy_guest_id` cookie (`practice_logs.guest_id`) without seeing `/practices`. On sign-up or login, guest practices are automatically claimed by the authenticated account.
- **Public Landing & Legal Pages**: `/` renders the English Zen Athletic 80s landing page for unauthenticated visitors, with `/terms` and `/privacy` linked from the footer and auth forms. No cookie banner is required because only strictly necessary session/guest cookies are used.
- **Rate Limiting**: Auth and API endpoints are protected against brute-force and abuse.
- **CSRF & Secure Cookies**: BetterAuth (`src/lib/auth.ts`) enforces `disableCSRFCheck: false` and `useSecureCookies: process.env.NODE_ENV === "production"`.
- **`BETTER_AUTH_SECRET` Runtime Check**: `src/lib/auth.ts` reads `process.env.BETTER_AUTH_SECRET` and throws an error on startup if missing in production (`NODE_ENV === "production"` and `!building`), keeping the dev fallback only for non-production environments.
- **Persistent Uploads Volume**: `docker-compose.yml` mounts `./uploads:/app/static/uploads` alongside `./data:/app/data` so uploaded movement illustrations survive container restarts.
- **Healthcheck Endpoint**: `GET /api/health` (`src/routes/api/health/+server.ts`) runs `SELECT 1` against SQLite via Drizzle and returns `200 { status: "ok", db: "connected", timestamp }` or `503` on failure.

---

## GCP Compute Engine Provisioning & VM Security

### Phase 1 Infrastructure (Single-VM + Dokploy)

- **Compute**: GCP Compute Engine `e2-small` (Ubuntu 24.04 LTS, 30 GB `pd-balanced` disk, static external IP).
- **Provisioning**: Reproducible one-shot script at [`scripts/gcp/provision-vm.sh`](../scripts/gcp/provision-vm.sh) using `gcloud` CLI + startup script to configure `unattended-upgrades`, `ufw`, and install **Dokploy**.
- **App Deployment & TLS**: **Dokploy** runs on the VM (Docker + Traefik) to handle GitHub auto-deploys, `.env` secrets, multi-app Docker Compose stacks, and automatic Let's Encrypt HTTPS certificates. **Cloudflare** sits in front for DNS and optional CDN/WAF.

### VM Security Checklist

- [ ] **GCP Firewall + UFW**: Only ports `80` and `443` exposed publicly; port `4173` is never exposed directly.
- [ ] **Close Dokploy Setup Port**: Delete `allow-strtchy-dokploy-setup` (port `3000`) immediately after binding Dokploy to an HTTPS domain.
- [ ] **SSH via IAP Only**: Port `22` is restricted to Google Cloud IAP (`35.235.240.0/20`) — not open to `0.0.0.0/0`.
- [ ] **Automatic OS Patching**: `unattended-upgrades` enabled automatically by `provision-vm.sh`.
- [ ] **Secrets**: Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `LITESTREAM_B2_*` in Dokploy's environment settings (never committed to git).

---

## Continuous SQLite Backups (Backblaze B2 + Litestream)

Strtchy uses SQLite (`better-sqlite3` in WAL mode) stored at `/app/data/prod/local.db`.

- **Replication**: `docker-compose.yml` includes a `litestream` sidecar (`litestream/litestream:0.3`) under `profiles: ["backup"]`, configured by `litestream.yml` to continuously stream WAL changes to **Backblaze B2** (S3-compatible API).
- **Enabling in Production**:
  1. Create a private Backblaze B2 bucket and an Application Key restricted to that bucket (read/write).
  2. Set `LITESTREAM_B2_BUCKET`, `LITESTREAM_B2_ENDPOINT`, `LITESTREAM_B2_ACCESS_KEY_ID`, and `LITESTREAM_B2_SECRET_ACCESS_KEY` in Dokploy / `.env.production`.
  3. Start the stack with the backup profile:
     ```bash
     docker compose --profile backup up -d
     ```
- **Restore**: Run `litestream restore -o /app/data/prod/local.db s3://$LITESTREAM_B2_BUCKET/strtchy/local.db` (with `-config /etc/litestream.yml`) before starting the app container on a fresh host.

---

## Immediate Post-Launch Roadmap

Ordered by priority after initial production launch:

1. **Brevo Transactional Email + Google OAuth**
   - Migrate password reset and email verification transport in `src/lib/auth.ts` to **Brevo** (`BREVO_API_KEY`, `BREVO_FROM_EMAIL`).
   - Add **Google OAuth** provider in BetterAuth for frictionless sign-up/login.
2. **Cookieless Analytics + Observability**
   - Add privacy-friendly, cookieless analytics (**Plausible** or **Umami**).
   - Integrate **Sentry** (or GlitchTip) and structured server logging for runtime error tracking and latency visibility.
3. **Hevy-Style Freemium Monetization**
   - Keep core stretching routines, practice player, and basic tracking free.
   - Introduce a Pro tier for unlimited custom routines/movements, full history/analytics, and API/MCP access.

---

## Long-Term Architecture Evolution

- **Vertical Scale (2 minutes)**: Stop the GCP VM, resize from `e2-small` to `e2-medium` or `e2-standard-2`, and restart — disk, Dokploy, and containers remain intact.
- **Phase 2 (Decoupled Backend & Cloud Run)**: Triggered before mobile store launch — migrate SQLite (`better-sqlite3`) to managed PostgreSQL (Supabase, Neon, or GCP Cloud SQL) and move the container to stateless **GCP Cloud Run**.
- **Phase 3 (Mobile App via Capacitor)**: Package the SvelteKit app with Capacitor for **Google Play Store** distribution, using bearer token auth against `/api/*` and native hardware APIs (haptics, background audio, local notifications).
