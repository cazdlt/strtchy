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

## Phase 1 Infrastructure ($0/mo GCP Always Free `e2-micro`)

- **Compute**: GCP Compute Engine `e2-micro` (1 GB RAM) in **`us-east1`** (South Carolina — lowest latency to Colombia among the 3 Always Free regions `us-east1`, `us-central1`, `us-west1`).
- **Storage & IP**: `30 GB pd-standard` boot disk (included in Always Free) + ephemeral IPv4 (no reserved static IP).
- **Memory Headroom**: `2 GB` swapfile (`vm.swappiness=10`) configured on boot. No Dokploy or in-VM `docker build` so RAM stays free for the runtime containers.
- **CI/CD Container Builds**: [`.github/workflows/docker-ghcr.yml`](../.github/workflows/docker-ghcr.yml) builds the production Docker image on GitHub Actions and pushes `ghcr.io/cazdlt/strtchy:latest` to GHCR (without committing any build artifacts to Git). The VM only runs `docker compose pull && docker compose up -d`.
- **Ingress & TLS**: **Cloudflare Tunnel** (`cloudflared` sidecar via `--profile tunnel`) connects outbound to Cloudflare and routes `https://yourdomain.com` → `http://strtchy:4173`. Zero public inbound ports (`80`, `443`, `3000`) are opened, and ephemeral IP changes never break DNS.
- **Provisioning**: Reproducible one-shot script at [`scripts/gcp/provision-vm.sh`](../scripts/gcp/provision-vm.sh).

### VM Security Checklist

- [ ] **Zero Public Inbound Ports**: `strtchy` binds to `127.0.0.1:4173`; all public traffic enters via Cloudflare Tunnel (`cloudflared`).
- [ ] **SSH via IAP Only**: GCP firewall + UFW restrict port `22` to Google Cloud IAP (`35.235.240.0/20`) — not open to `0.0.0.0/0`.
- [ ] **Automatic OS Patching**: `unattended-upgrades` enabled automatically by `provision-vm.sh`.
- [ ] **Secrets**: Store `.env.production` on the VM with `chmod 600` (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLOUDFLARE_TUNNEL_TOKEN`, `LITESTREAM_B2_*`), never committed to git.

---

## Continuous SQLite Backups (Backblaze B2 + Litestream)

Strtchy uses SQLite (`better-sqlite3` in WAL mode) stored at `/app/data/prod/local.db`.

- **Replication**: `docker-compose.yml` includes a `litestream` sidecar (`litestream/litestream:0.3`) under `profiles: ["backup"]`, configured by `litestream.yml` to continuously stream WAL changes to **Backblaze B2** (S3-compatible API).
- **Enabling in Production**:
  1. Create a private Backblaze B2 bucket and an Application Key restricted to that bucket (read/write).
  2. Set `LITESTREAM_B2_BUCKET`, `LITESTREAM_B2_ENDPOINT`, `LITESTREAM_B2_ACCESS_KEY_ID`, and `LITESTREAM_B2_SECRET_ACCESS_KEY` in `.env.production`.
  3. Start the full production stack:
     ```bash
     docker compose --profile tunnel --profile backup pull
     docker compose --profile tunnel --profile backup up -d
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

- **Multi-App / Higher-RAM Scale-Up**: Move Docker Compose + Litestream + Cloudflare Tunnel to **Hetzner Cloud `CX22`** (2 vCPU, 4 GB RAM, ~\$4.50/mo) with **Dokploy** when running multiple apps or needing more RAM, or resize the GCP VM in-place.
- **Phase 2 (Decoupled Backend & Cloud Run)**: Triggered before mobile store launch — migrate SQLite (`better-sqlite3`) to managed PostgreSQL (Supabase, Neon, or GCP Cloud SQL) and move the container to stateless **GCP Cloud Run**.
- **Phase 3 (Mobile App via Capacitor)**: Package the SvelteKit app with Capacitor for **Google Play Store** distribution, using bearer token auth against `/api/*` and native hardware APIs (haptics, background audio, local notifications).
