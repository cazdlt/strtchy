#!/bin/bash
set -e  # Strict error handling

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Development Environment${NC}"

# Configuration
DEV_DB="./data/dev/local.db"
ENV_FILE=".env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  $ENV_FILE not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example "$ENV_FILE"
        echo -e "${GREEN}✅ Created $ENV_FILE${NC}"
    else
        echo -e "${RED}❌ Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Load environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Check if database exists
if [ ! -f "$DEV_DB" ]; then
    echo -e "${YELLOW}📦 Database not found. Initializing...${NC}"

    # Ensure data directory exists
    mkdir -p "$(dirname "$DEV_DB")"

    # Push schema
    echo -e "${GREEN}→ Pushing schema to database...${NC}"
    DATABASE_URL="$DEV_DB" npx drizzle-kit push

    # Seed database
    echo -e "${GREEN}→ Seeding database...${NC}"
    DATABASE_URL="$DEV_DB" npx tsx scripts/init-db.ts

    echo -e "${GREEN}✅ Database initialized successfully${NC}"
else
    echo -e "${GREEN}✅ Development database found at $DEV_DB${NC}"
fi

# Start dev server
echo -e "${GREEN}→ Starting development server...${NC}"
DATABASE_URL="$DEV_DB" npm run dev
