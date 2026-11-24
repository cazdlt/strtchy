#!/usr/bin/env bash
set -euo pipefail

# Provision a single GCP Compute Engine VM for Strtchy + Dokploy.
#
# Usage:
#   PROJECT_ID=my-gcp-project ./scripts/gcp/provision-vm.sh
#
# Optional overrides:
#   REGION=us-central1
#   ZONE=us-central1-a
#   INSTANCE_NAME=strtchy-prod
#   MACHINE_TYPE=e2-small
#   DISK_SIZE_GB=30

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-strtchy-prod}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-small}"
DISK_SIZE_GB="${DISK_SIZE_GB:-30}"
NETWORK_TAG="strtchy-web"
STATIC_IP_NAME="${INSTANCE_NAME}-ip"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Error: PROJECT_ID is not set and no default gcloud project is configured."
  echo "Run: PROJECT_ID=your-project-id ./scripts/gcp/provision-vm.sh"
  exit 1
fi

echo "==> Using GCP project: ${PROJECT_ID} (${ZONE}, ${MACHINE_TYPE}, ${DISK_SIZE_GB}GB)"

# 1. Reserve static external IP (idempotent)
if ! gcloud compute addresses describe "$STATIC_IP_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" >/dev/null 2>&1; then
  echo "==> Reserving static IP: ${STATIC_IP_NAME}"
  gcloud compute addresses create "$STATIC_IP_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION"
else
  echo "==> Static IP already exists: ${STATIC_IP_NAME}"
fi

STATIC_IP="$(gcloud compute addresses describe "$STATIC_IP_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format='get(address)')"

# 2. Firewall rules (idempotent)
ensure_firewall() {
  local name="$1"
  shift
  if ! gcloud compute firewall-rules describe "$name" \
    --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "==> Creating firewall rule: ${name}"
    gcloud compute firewall-rules create "$name" \
      --project="$PROJECT_ID" \
      --target-tags="$NETWORK_TAG" \
      "$@"
  else
    echo "==> Firewall rule already exists: ${name}"
  fi
}

# Public HTTP/HTTPS (Traefik inside Dokploy handles Let's Encrypt TLS)
ensure_firewall "allow-strtchy-http-https" \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:80,tcp:443 \
  --source-ranges=0.0.0.0/0

# SSH only via Google Cloud IAP (port 22 is NOT exposed to the public internet)
ensure_firewall "allow-strtchy-iap-ssh" \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:22 \
  --source-ranges=35.235.240.0/20

# Temporary port 3000 for initial Dokploy admin setup (delete after binding an HTTPS domain)
ensure_firewall "allow-strtchy-dokploy-setup" \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:3000 \
  --source-ranges=0.0.0.0/0

# 3. Cloud-init startup script: security updates + UFW + Dokploy
STARTUP_SCRIPT="$(cat <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# Enable automatic security updates
apt-get update -y
apt-get install -y unattended-upgrades ufw curl ca-certificates
dpkg-reconfigure -f noninteractive unattended-upgrades

# Configure host firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow from 35.235.240.0/20 to any port 22 proto tcp
ufw --force enable

# Install Dokploy (includes Docker + Traefik) if not already installed
if ! command -v docker >/dev/null 2>&1; then
  curl -sSL https://dokploy.com/install.sh | sh
fi
EOF
)"

# 4. Create the VM (idempotent)
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
    --boot-disk-type=pd-balanced \
    --address="$STATIC_IP" \
    --tags="$NETWORK_TAG" \
    --metadata="startup-script=${STARTUP_SCRIPT}"
else
  echo "==> VM already exists: ${INSTANCE_NAME}"
fi

cat <<EOF

Provisioning complete.

  VM:        ${INSTANCE_NAME} (${ZONE}, ${MACHINE_TYPE})
  Static IP: ${STATIC_IP}

Next steps:
  1. Wait ~2-3 minutes for Dokploy installation to finish.
     Check progress via IAP SSH:
       gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --tunnel-through-iap --command="sudo journalctl -u google-startup-scripts.service -n 50 --no-pager"

  2. Open Dokploy setup in your browser:
       http://${STATIC_IP}:3000

  3. Point your domain DNS (A record) to ${STATIC_IP} and configure HTTPS in Dokploy.

  4. Once Dokploy is accessible via HTTPS on your domain, close port 3000:
       gcloud compute firewall-rules delete allow-strtchy-dokploy-setup --project=${PROJECT_ID}
EOF
