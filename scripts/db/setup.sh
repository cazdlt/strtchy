#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: $0 <env>"
    echo "  env           Environment: dev or prod"
    echo ""
    echo "Examples:"
    echo "  $0 dev              # Setup dev database and seed"
    exit 1
}

ENV=""

for arg in "$@"; do
    case $arg in
        dev|prod)
            ENV="$arg"
            shift
            ;;
        *)
            echo "Unknown argument: $arg"
            usage
            ;;
    esac
done

if [ -z "$ENV" ]; then
    echo -e "${RED}Error: Environment not specified${NC}"
    usage
fi

if [ "$ENV" = "dev" ]; then
    ENV_FILE=".env"
    DB_PATH="./data/dev/local.db"
    echo -e "${GREEN}Setting up Development Database${NC}"
    PUSH_CMD="npx drizzle-kit push"
else
    ENV_FILE=".env.production"
    DB_PATH="./data/prod/local.db"
    echo -e "${BLUE}Setting up Production Database${NC}"
    PUSH_CMD="DATABASE_URL=\"$DB_PATH\" npx drizzle-kit push"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  $ENV_FILE not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example "$ENV_FILE"
        echo -e "${GREEN}✅ Created $ENV_FILE${NC}"
        echo -e "${YELLOW}⚠️  Please review and update DATABASE_URL in $ENV_FILE${NC}"
    else
        echo -e "${RED}❌ Error: .env.example not found${NC}"
        exit 1
    fi
fi

export $(grep -v '^#' "$ENV_FILE" | xargs)

mkdir -p "$(dirname "$DB_PATH")"

echo -e "${GREEN}→ Syncing database schema...${NC}"
DATABASE_URL="$DB_PATH" $PUSH_CMD

echo -e "${GREEN}→ Seeding database...${NC}"
DATABASE_URL="$DB_PATH" npx tsx scripts/db/seed.ts
