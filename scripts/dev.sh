#!/bin/bash
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Development Environment${NC}"

echo -e "${GREEN}→ Starting server...${NC}"
DATABASE_URL="./data/dev/local.db" npm run dev
