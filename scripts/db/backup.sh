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

echo -e "${GREEN}Backing up database at ${DATABASE_URL}${NC}"

if [ ! -f "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: Database not found${NC}"
    exit 1
fi

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/local_${TIMESTAMP}.sql"

echo -e "${GREEN}→ Exporting database to $BACKUP_FILE${NC}"
sqlite3 "$DATABASE_URL" .dump > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE ($FILE_SIZE)${NC}"
