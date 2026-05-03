#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables from .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env not found${NC}"
    exit 1
fi

export $(grep -v '^#' ".env" | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in .env${NC}"
    exit 1
fi

mkdir -p "$(dirname "$DATABASE_URL")"

echo -e "${GREEN}Setting up database at ${DATABASE_URL}${NC}"

echo -e "${GREEN}→ Syncing database schema...${NC}"
npx drizzle-kit push

echo -e "${GREEN}→ Seeding database...${NC}"
npx tsx scripts/db/seed.ts

echo -e "${GREEN}✅ Setup complete${NC}"
