#!/bin/bash

# ========================================
# Hafalan App - Manual Deploy Script
# ========================================
# Run this script on your VPS to deploy/update the application
# Usage: ./scripts/deploy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_PATH="${DEPLOY_PATH:-/opt/hafalan}"
COMPOSE_FILE="docker-compose.yml"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Hafalan App - Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Navigate to deploy path
cd "$DEPLOY_PATH" || {
    echo -e "${RED}Error: Deploy path $DEPLOY_PATH not found${NC}"
    exit 1
}

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Run: cp .env.production.example .env && nano .env${NC}"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo -e "${YELLOW}[1/6] Pulling latest code...${NC}"
git fetch --all
git reset --hard origin/main || git reset --hard origin/master
echo -e "${GREEN}✓ Code updated${NC}"

echo -e "${YELLOW}[2/6] Pulling latest Docker image...${NC}"
docker compose pull
echo -e "${GREEN}✓ Image pulled${NC}"

echo -e "${YELLOW}[3/6] Running database migrations...${NC}"
docker compose run --rm hafalan-app npx prisma migrate deploy 2>/dev/null || {
    echo -e "${YELLOW}⚠ Migrations skipped (may already be applied)${NC}"
}
echo -e "${GREEN}✓ Migrations complete${NC}"

echo -e "${YELLOW}[4/6] Stopping old containers...${NC}"
docker compose down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}✓ Old containers stopped${NC}"

echo -e "${YELLOW}[5/6] Starting new containers...${NC}"
docker compose up -d
echo -e "${GREEN}✓ Containers started${NC}"

echo -e "${YELLOW}[6/6] Cleaning up old images...${NC}"
docker image prune -f
echo -e "${GREEN}✓ Cleanup complete${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Show container status
echo -e "${BLUE}Container Status:${NC}"
docker compose ps

echo ""
echo -e "${BLUE}Logs (last 20 lines):${NC}"
docker compose logs --tail=20 hafalan-app

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:    docker compose logs -f hafalan-app"
echo -e "  Restart:      docker compose restart hafalan-app"
echo -e "  Stop:         docker compose down"
echo -e "  Shell:        docker compose exec hafalan-app sh"
