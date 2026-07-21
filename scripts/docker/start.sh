#!/bin/bash
# Fresh deployment script for Strtchy on Docker
# Run this on your home server for initial setup

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🚀 Strtchy Docker Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}⚠️  Error: docker-compose.yml not found${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Error: .env.production not found${NC}"
    echo "Please create .env.production from .env.example"
    exit 1
fi

echo -e "${BLUE}→ Building Docker image...${NC}"
docker compose build --no-cache

echo ""
echo -e "${BLUE}→ Starting containers...${NC}"
docker compose up -d

echo ""
echo -e "${BLUE}→ Running database migrations...${NC}"
docker compose exec -T -e DATABASE_URL=/app/data/prod/local.db strtchy npx tsx scripts/db/run-migrations.ts

echo ""
echo -e "${BLUE}→ Seeding database...${NC}"
docker compose exec -T -e DATABASE_URL=/app/data/prod/local.db strtchy npx tsx scripts/db/seed.ts

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Strtchy is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Access your app at: ${BLUE}http://localhost:4173${NC}"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f    # View logs"
echo "  docker compose down       # Stop the app"
echo "  ./scripts/docker/upgrade.sh  # Update to latest version"
