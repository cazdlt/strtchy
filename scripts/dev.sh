#!/bin/bash
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Development Environment${NC}"

# Load .env if it exists
if [ -f .env ]; then
  set -a
  source .env
  echo -e "${BLUE}→ Using .env${NC}"
  set +a
fi

echo -e "${GREEN}→ Starting server...${NC}"
npm run dev
