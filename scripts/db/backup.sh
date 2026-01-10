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
    echo "Examples:"
    echo "  $0 dev              # Backup dev database"
    echo "  $0 prod             # Backup prod database"
    exit 1
}

if [ -z "$1" ]; then
    echo -e "${RED}Error: Environment not specified${NC}"
    usage
fi

ENV="$1"

if [ "$ENV" = "dev" ]; then
    DB_PATH="./data/dev/local.db"
    BACKUP_DIR="./backups/dev"
    echo -e "${GREEN}Backing up Development Database${NC}"
elif [ "$ENV" = "prod" ]; then
    DB_PATH="./data/prod/local.db"
    BACKUP_DIR="./backups/prod"
    echo -e "${GREEN}Backing up Production Database${NC}"
else
    echo -e "${RED}Invalid environment: $ENV${NC}"
    usage
fi

if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}Error: Database not found at $DB_PATH${NC}"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/local_${TIMESTAMP}.sql"

echo -e "${GREEN}→ Exporting database to $BACKUP_FILE${NC}"
sqlite3 "$DB_PATH" .dump > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE ($FILE_SIZE)${NC}"
