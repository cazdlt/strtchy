#!/usr/bin/env bash
set -euo pipefail

# Provision a $0/mo GCP Always Free e2-micro VM for Strtchy.
#
# Always Free eligibility requires:
#   - MACHINE_TYPE=e2-micro
#   - REGION in {us-east1, us-central1, us-west1} (us-east1 has lowest latency from Colombia)
#   - DISK_TYPE=pd-standard and DISK_SIZE_GB<=30
#   - Ephemeral external IP (no static IP reservation)
#
# Usage:
#   PROJECT_ID=my-gcp-project ./scripts/gcp/provision-vm.sh

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
ZONE="${ZONE:-us-east1-b}"
INSTANCE_NAME="${INSTANCE_NAME:-strtchy-free}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-micro}"
DISK_SIZE_GB="${DISK_SIZE_GB:-30}"
DISK_TYPE="${DISK_TYPE:-pd-standard}"
NETWORK_TAG="strtchy-tunnel"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Error: PROJECT_ID is not set and no default gcloud project is configured."
  echo "Run: PROJECT_ID=your-project-id ./scripts/gcp/provision-vm.sh"
  exit 1
fi

echo "==> Provisioning Always Free VM in ${PROJECT_ID}: ${INSTANCE_NAME} (${ZONE}, ${MACHINE_TYPE}, ${DISK_SIZE_GB}GB ${DISK_TYPE})"

# 1. Firewall: allow SSH only via Google Cloud IAP (zero public inbound ports; traffic enters via Cloudflare Tunnel)
if ! gcloud compute firewall-rules describe "allow-strtchy-iap-ssh" \
  --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "==> Creating IAP SSH firewall rule: allow-strtchy-iap-ssh"
  gcloud compute firewall-rules create "allow-strtchy-iap-ssh" \
    --project="$PROJECT_ID" \
    --target-tags="$NETWORK_TAG" \
    --direction=INGRESS \
    --action=ALLOW \
    --rules=tcp:22 \
    --source-ranges=35.235.240.0/20
else
  echo "==> Firewall rule already exists: allow-strtchy-iap-ssh"
fi

# 2. Startup script: 2GB swap, automatic security updates, UFW (IAP SSH only), Docker + Compose
STARTUP_SCRIPT="$(cat <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# Add 2GB swap for 1GB RAM e2-micro headroom
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

# Security updates & base tools
apt-get update -y
apt-get install -y unattended-upgrades ufw curl ca-certificates
dpkg-reconfigure -f noninteractive unattended-upgrades

# Host firewall: deny all public inbound; allow SSH only from GCP IAP
ufw default deny incoming
ufw default allow outgoing
ufw allow from 35.235.240.0/20 to any port 22 proto tcp
ufw --force enable

# Install Docker Engine + Compose plugin
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
EOF
)"

# 3. Create VM (idempotent)
if ! gcloud compute instances describe "$INSTANCE_NAME" \
  --project="$PROJECT_ID" \
  --zone="$ZONE" >/dev/null 2>&1; then
  echo "==> Creating VM: ${INSTANCE_NAME}"
  gcloud compute instances create "$INSTANCE_NAME" \
    --project="$PROJECT_ID" \
    --zone="$ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --image-family=ubuntu-2404-lts-amd64 \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size="${DISK_SIZE_GB}GB" \
    --boot-disk-type="$DISK_TYPE" \
    --tags="$NETWORK_TAG" \
    --metadata="startup-script=${STARTUP_SCRIPT}"
else
  echo "==> VM already exists: ${INSTANCE_NAME}"
fi

cat <<EOF

Provisioning complete.

  VM:   ${INSTANCE_NAME} (${ZONE}, ${MACHINE_TYPE}, ${DISK_SIZE_GB}GB ${DISK_TYPE})

Next steps:
  1. Connect via IAP SSH (wait ~2 min for startup script to finish):
       gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --tunnel-through-iap

  2. On the VM, clone the repo (or copy docker-compose.yml + litestream.yml) and create .env.production:
       git clone https://github.com/cazdlt/strtchy.git && cd strtchy
       cp .env.example .env.production && chmod 600 .env.production

  3. Pull prebuilt image from GHCR, start stack, run migrations + initial seed:
       ./scripts/docker/deploy.sh --seed

  4. Subsequent upgrades:
       git pull && ./scripts/docker/deploy.sh
EOF
