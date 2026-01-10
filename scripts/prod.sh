#!/bin/bash
set -e  # Strict error handling

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Building Production Environment${NC}"

# Configuration
PROD_DB="./data/prod/local.db"
ENV_FILE=".env.production"

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  $ENV_FILE not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example "$ENV_FILE"
        echo -e "${GREEN}✅ Created $ENV_FILE${NC}"
        echo -e "${YELLOW}⚠️  Please review and update DATABASE_URL and BETTER_AUTH_SECRET in $ENV_FILE${NC}"
    else
        echo -e "${RED}❌ Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Load environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Check if database exists
if [ ! -f "$PROD_DB" ]; then
    echo -e "${YELLOW}📦 Production database not found. Initializing...${NC}"

    # Ensure data directory exists
    mkdir -p "$(dirname "$PROD_DB")"

    # Push schema
    echo -e "${GREEN}→ Pushing schema to database...${NC}"
    DATABASE_URL="$PROD_DB" npx drizzle-kit push

    # Seed database
    echo -e "${GREEN}→ Seeding database...${NC}"
    DATABASE_URL="$PROD_DB" npx tsx scripts/init-db.ts

    echo -e "${GREEN}✅ Production database initialized successfully${NC}"
else
    echo -e "${GREEN}✅ Production database found at $PROD_DB${NC}"
fi

# Build application
echo -e "${GREEN}→ Building application...${NC}"
DATABASE_URL="$PROD_DB" npm run build

# Start production server
echo -e "${BLUE}→ Starting production server...${NC}"
echo -e "${BLUE}🌐 Server will be available at http://localhost:4173${NC}"
DATABASE_URL="$PROD_DB" npm run preview
