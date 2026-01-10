#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏗️  Building Production Environment${NC}"

exec scripts/db/setup.sh prod --start-server
