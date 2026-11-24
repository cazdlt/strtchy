# Internal: Infrastructure & Cost Estimates

Working notes for Strtchy hosting costs, credits, and scaling thresholds.

---

## Monthly Cost Breakdown — Phase 1 (Single GCP VM + Dokploy)

Region assumption: `us-central1`.

| Component | Spec / Plan | Est. Monthly Cost (USD) | Notes |
| :--- | :--- | ---: | :--- |
| **GCP Compute Engine** | `e2-small` (2 vCPU shared, 2 GB RAM) | ~$12.23 | Covered by GCP / Google AI Pro credits while available |
| **GCP Boot Disk** | 30 GB `pd-balanced` | ~$3.00 | OS + Docker images + SQLite + uploads |
| **GCP Static External IP** | 1 in-use IPv4 | ~$3.60 | Charged while attached to running VM |
| **GCP Network Egress** | ~5–20 GB/mo (behind Cloudflare) | ~$0.00 – $1.50 | First 1 GB/mo free; Cloudflare caches static assets & 3D art |
| **Backblaze B2 (Litestream)** | Private bucket, <10 GB | ~$0.00 – $0.10 | First 10 GB storage free; ~$0.006/GB after |
| **Brevo (Transactional Email)** | Free plan (300 emails/day) | $0.00 | Password resets & account emails |
| **Cloudflare** | Free plan | $0.00 | DNS, CDN, basic WAF/DDoS |
| **Dokploy** | Self-hosted open source | $0.00 | Runs on the same VM |
| **Domain** | Annual (~$10–$15/yr) | ~$1.00 | Amortized monthly |
| **Total (before credits)** | | **~$20 / mo** | **~$1 / mo out-of-pocket** while GCP credits cover compute/disk/IP |

---

## Cost-Cutting Option (If Credits Run Out)

| Option | Spec | Est. Monthly Cost (USD) | Trade-off |
| :--- | :--- | ---: | :--- |
| **Hetzner Cloud `CX22`** | 2 vCPU, 4 GB RAM, 40 GB SSD, 20 TB traffic | ~$4.50 – $5.50 | Same Dokploy + Litestream setup, half the price of GCP |
| **GCP `e2-micro`** | 2 vCPU shared, 1 GB RAM | ~$6.11 (or free tier in `us-west1`/`us-central1`/`us-east1`) | Tight RAM for Dokploy + Docker builds; better with plain Docker Compose + Caddy |

---

## Scaling Triggers & Upgrade Costs

1. **RAM pressure (multiple apps or frequent Docker builds on the VM)**
   - Resize VM in-place: `e2-small` (2 GB) → `e2-medium` (4 GB, ~$24.50/mo) or move to Hetzner `CX22` (4 GB, ~$5/mo).
2. **Database concurrency / multi-instance requirement**
   - Move from SQLite (`better-sqlite3`) to managed Postgres:
     - **Neon / Supabase Free Tier**: $0/mo (good for early migration).
     - **Managed Paid Tier**: ~$19–$25/mo.
3. **Observability & Analytics (Post-Launch)**
   - **Sentry Developer**: $0/mo (5k errors/mo).
   - **Umami** (self-hosted on the same Dokploy VM): $0/mo.
   - **Plausible Cloud**: ~$9/mo (if preferring managed).
