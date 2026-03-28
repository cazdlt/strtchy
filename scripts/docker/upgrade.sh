#!/bin/bash
# Upgrade script for Strtchy on Docker
# Run this on your home server to pull latest changes and update

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🔄 Strtchy Upgrade${NC}"
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

echo -e "${BLUE}→ Pulling latest changes from GitHub...${NC}"
git pull origin main || git pull origin master
echo ""

echo -e "${BLUE}→ Stopping current containers...${NC}"
docker-compose down
echo ""

echo -e "${BLUE}→ Rebuilding Docker image with latest code...${NC}"
docker-compose build --no-cache
echo ""

echo -e "${BLUE}→ Starting updated containers...${NC}"
docker-compose up -d
echo ""

echo -e "${BLUE}→ Running database migrations...${NC}"
# Run migrations only (no seed for existing database)
docker-compose exec -T strtchy sh -c "DATABASE_URL=./data/prod/local.db npx tsx scripts/db/migrate.ts"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Strtchy upgraded successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Your updated app is running at: ${BLUE}http://localhost:4173${NC}"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f    # View logs"
echo "  docker-compose down       # Stop the app"
