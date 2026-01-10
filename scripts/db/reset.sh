#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

usage() {
    echo "Usage: $0 <env>"
    echo "  env    Environment: dev or prod"
    echo ""
    echo "This will DELETE the existing database and recreate it."
    exit 1
}

if [ -z "$1" ]; then
    echo -e "${RED}Error: Environment not specified${NC}"
    usage
fi

ENV="$1"

if [ "$ENV" = "dev" ]; then
    DB_PATH="./data/dev/local.db"
    echo -e "${YELLOW}Resetting Development Database${NC}"
elif [ "$ENV" = "prod" ]; then
    DB_PATH="./data/prod/local.db"
    echo -e "${YELLOW}Resetting Production Database${NC}"
else
    echo -e "${RED}Invalid environment: $ENV${NC}"
    usage
fi

if [ -f "$DB_PATH" ]; then
    echo -e "${YELLOW}→ Deleting existing database at $DB_PATH${NC}"
    rm -f "$DB_PATH"
    echo -e "${GREEN}✅ Database deleted${NC}"
else
    echo -e "${YELLOW}→ No existing database found at $DB_PATH${NC}"
fi

echo -e "${GREEN}→ Running fresh setup...${NC}"
exec scripts/db/setup.sh "$ENV"
