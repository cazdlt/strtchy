# Production & Deployment Readiness

This document tracks the security hardening, infrastructure architecture, backup strategy, and post-launch roadmap for **Strtchy**.

---

## Hardened & Implemented

The core multi-tenancy, authentication, and container persistence blockers are resolved:

- **Multi-Tenancy & Ownership Isolation**: User queries and mutations (`routines`, `movements`, `practices`) are scoped by `userId` with ownership verification, protecting built-in seed data (`isCustom: false`).
- **Server Route Guards**: `src/hooks.server.ts` enforces authenticated access on protected routes and redirects unauthenticated requests.
- **Rate Limiting**: Auth and API endpoints are protected against brute-force and abuse.
- **CSRF & Secure Cookies**: BetterAuth (`src/lib/auth.ts`) enforces `disableCSRFCheck: false` and `useSecureCookies: process.env.NODE_ENV === "production"`.
- **`BETTER_AUTH_SECRET` Runtime Check**: `src/lib/auth.ts` reads `process.env.BETTER_AUTH_SECRET` and throws an error on startup if missing in production (`NODE_ENV === "production"`), keeping the dev fallback only for non-production environments.
- **Persistent Uploads Volume**: `docker-compose.yml` mounts `./uploads:/app/static/uploads` alongside `./data:/app/data` so uploaded movement illustrations survive container restarts.
- **Healthcheck Endpoint**: `GET /api/health` (`src/routes/api/health/+server.ts`) runs `SELECT 1` against SQLite via Drizzle and returns `200 { status: "ok", db: "connected", timestamp }` or `503` on failure.

---

## GCP Compute Engine Provisioning & VM Security

### Phase 1 Infrastructure (Single-VM Container)

- **Compute**: GCP Compute Engine (`e2-micro` or `e2-small`) with a persistent disk.
- **Provisioning**: Reproducible VM setup via **Terraform + `cloud-init`** (or **`gcloud` CLI + `cloud-init`**) to install Docker, Docker Compose, Caddy, and UFW automatically on first boot.
- **Edge & TLS**: **Cloudflare** (DNS, CDN/WAF, DDoS protection) in front of **Caddy** on the VM, proxying HTTPS traffic to the Strtchy container (`127.0.0.1:4173`).

### VM Security Checklist

- [ ] **UFW Firewall**: Deny all incoming by default; allow only ports `80` and `443` (and restrict to Cloudflare IP ranges if desired).
- [ ] **SSH Access**: Disable password authentication and root login; use **GCP IAP (Identity-Aware Proxy)** tunneling or **SSH key-only** authentication.
- [ ] **Automatic OS Patching**: Enable `unattended-upgrades` for automatic security updates.
- [ ] **Reverse Proxy**: Run **Caddy** for automatic TLS and security headers; do not expose port `4173` directly to the public internet.
- [ ] **Secrets**: Store `.env.production` on the VM with `chmod 600`, never committed to git.

---

## Continuous SQLite Backups (Backblaze B2 + Litestream)

Strtchy uses SQLite (`better-sqlite3` in WAL mode) stored at `/app/data/prod/local.db`.

- **Replication**: `docker-compose.yml` includes a `litestream` sidecar (`litestream/litestream:0.3`) under `profiles: ["backup"]`, configured by `litestream.yml` to continuously stream WAL changes to **Backblaze B2** (S3-compatible API).
- **Enabling in Production**:
  1. Set `LITESTREAM_B2_BUCKET`, `LITESTREAM_B2_ENDPOINT`, `LITESTREAM_B2_ACCESS_KEY_ID`, and `LITESTREAM_B2_SECRET_ACCESS_KEY` in `.env.production`.
  2. Start the stack with the backup profile:
     ```bash
     docker compose --profile backup up -d
     ```
- **Restore**: Run `litestream restore -o /app/data/prod/local.db s3://$LITESTREAM_B2_BUCKET/strtchy/local.db` (with `-config /etc/litestream.yml`) before starting the app container on a fresh host.

---

## Immediate Post-Launch Roadmap

Ordered by priority after initial production launch:

1. **Brevo Transactional Email + Google OAuth**
   - Migrate password reset and email verification transport to **Brevo** (`BREVO_API_KEY`, `BREVO_FROM_EMAIL`).
   - Add **Google OAuth** provider in BetterAuth for frictionless sign-up/login.
2. **Cookieless Analytics + Observability**
   - Add privacy-friendly, cookieless analytics (**Plausible** or **Umami**).
   - Integrate **Sentry** (or GlitchTip) and structured server logging for runtime error tracking and latency visibility.
3. **Hevy-Style Freemium Monetization**
   - Keep core stretching routines, practice player, and basic tracking free.
   - Introduce a Pro tier for advanced analytics/history, custom routine limits/sharing, or premium program packs.

---

## Long-Term Architecture Evolution

- **Phase 2 (Decoupled Backend & Cloud Run)**: Triggered before mobile store launch — migrate SQLite (`better-sqlite3`) to managed PostgreSQL (Supabase or GCP Cloud SQL) and move the container to stateless **GCP Cloud Run**.
- **Phase 3 (Mobile App via Capacitor)**: Package the SvelteKit app with Capacitor for **Google Play Store** distribution, using bearer token auth against `/api/*` and native hardware APIs (haptics, background audio, local notifications).
