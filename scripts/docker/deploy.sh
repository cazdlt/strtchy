#!/usr/bin/env bash
set -euo pipefail

# Deploy or upgrade Strtchy on a production VM (GCP Always Free, Hetzner, etc.)
# Pulls prebuilt images from GHCR (never builds on the VM), reads secrets from
# .env.production, runs DB migrations, and verifies /api/health.
#
# Usage:
#   ./scripts/docker/deploy.sh          # Pull, restart, migrate
#   ./scripts/docker/deploy.sh --seed   # First-time setup (also runs seed)

ENV_FILE=".env.production"
RUN_SEED=false

for arg in "$@"; do
  case "$arg" in
    --seed) RUN_SEED=true ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--seed]"
      exit 1
      ;;
  esac
done

if [[ ! -f "docker-compose.yml" ]]; then
  echo "Error: run this script from the repository root (docker-compose.yml not found)."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found. Create it from .env.example and set chmod 600 $ENV_FILE."
  exit 1
fi

# Enforce owner-only permissions on secrets file
chmod 600 "$ENV_FILE"

# Read configured values from .env.production without exporting to subshells unnecessarily
get_env_val() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- | tr -d '"\r' | xargs || true
}

BETTER_AUTH_SECRET_VAL="$(get_env_val BETTER_AUTH_SECRET)"
if [[ -z "$BETTER_AUTH_SECRET_VAL" || "$BETTER_AUTH_SECRET_VAL" == "dev-secret-change-in-production" ]]; then
  echo "Error: BETTER_AUTH_SECRET in $ENV_FILE must be set to a strong random value (openssl rand -base64 32)."
  exit 1
fi

PROFILES=()
if [[ -n "$(get_env_val TUNNEL_TOKEN)" ]]; then
  PROFILES+=(--profile tunnel)
fi
if [[ -n "$(get_env_val LITESTREAM_B2_BUCKET)" ]]; then
  PROFILES+=(--profile backup)
fi

COMPOSE_CMD=(docker compose --env-file "$ENV_FILE" "${PROFILES[@]}")

echo "==> Pulling latest images (${PROFILES[*]:-core only})..."
"${COMPOSE_CMD[@]}" pull

echo "==> Starting containers..."
"${COMPOSE_CMD[@]}" up -d

echo "==> Running database migrations..."
"${COMPOSE_CMD[@]}" exec -T -e DATABASE_URL=/app/data/prod/local.db strtchy npx tsx scripts/db/run-migrations.ts

if [[ "$RUN_SEED" == "true" ]]; then
  echo "==> Seeding database..."
  "${COMPOSE_CMD[@]}" exec -T -e DATABASE_URL=/app/data/prod/local.db strtchy npx tsx scripts/db/seed.ts
fi

echo "==> Checking health endpoint..."
for i in {1..15}; do
  if curl -fsS http://127.0.0.1:4173/api/health >/dev/null 2>&1; then
    echo "OK: $(curl -fsS http://127.0.0.1:4173/api/health)"
    exit 0
  fi
  sleep 2
done

echo "Error: /api/health did not respond in time. Recent logs:"
"${COMPOSE_CMD[@]}" logs --tail=40 strtchy
exit 1
