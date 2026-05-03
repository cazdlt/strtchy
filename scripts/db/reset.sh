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

echo -e "${YELLOW}Resetting database at ${DATABASE_URL}${NC}"

if [ -f "$DATABASE_URL" ]; then
    echo -e "${YELLOW}→ Deleting existing database${NC}"
    rm -f "$DATABASE_URL"
    echo -e "${GREEN}✅ Database deleted${NC}"
else
    echo -e "${YELLOW}→ No existing database found${NC}"
fi

echo -e "${GREEN}→ Running fresh setup...${NC}"
exec scripts/db/setup.sh
