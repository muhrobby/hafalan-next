#!/bin/bash

# ========================================
# Hafalan App - VPS Setup Script
# ========================================
# Run this script on your VPS to set up the deployment environment
# Usage: curl -sSL https://raw.githubusercontent.com/muhrobby/hafalan/main/scripts/setup-vps.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Hafalan App - VPS Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
DEPLOY_PATH="${DEPLOY_PATH:-/opt/hafalan}"
REPO_URL="https://github.com/muhrobby/hafalan.git"
TRAEFIK_NETWORK="traefik-network"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# 1. Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully!${NC}"
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# 2. Create Traefik network if not exists
if ! docker network ls | grep -q "$TRAEFIK_NETWORK"; then
    echo -e "${YELLOW}Creating Traefik network...${NC}"
    docker network create "$TRAEFIK_NETWORK"
    echo -e "${GREEN}Traefik network created!${NC}"
else
    echo -e "${GREEN}Traefik network already exists${NC}"
fi

# 3. Create deployment directory
echo -e "${YELLOW}Creating deployment directory...${NC}"
mkdir -p "$DEPLOY_PATH"
cd "$DEPLOY_PATH"

# 4. Clone or pull repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull origin main || git pull origin master
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone "$REPO_URL" .
fi

# 5. Create .env file if not exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.production.example .env
    echo -e "${RED}⚠️  IMPORTANT: Edit .env file with your production values!${NC}"
    echo -e "${RED}   nano $DEPLOY_PATH/.env${NC}"
fi

# 6. Set permissions
echo -e "${YELLOW}Setting permissions...${NC}"
chown -R 1001:1001 "$DEPLOY_PATH" 2>/dev/null || true

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. ${YELLOW}Edit your .env file:${NC}"
echo -e "   nano $DEPLOY_PATH/.env"
echo ""
echo -e "2. ${YELLOW}Add GitHub Secrets to your repository:${NC}"
echo -e "   - VPS_HOST: Your VPS IP address"
echo -e "   - VPS_USERNAME: SSH username (usually 'root')"
echo -e "   - VPS_SSH_KEY: Your SSH private key"
echo -e "   - VPS_PORT: SSH port (default 22)"
echo ""
echo -e "3. ${YELLOW}Add GitHub Variables to your repository:${NC}"
echo -e "   - DOMAIN: Your domain name"
echo -e "   - DEPLOY_PATH: $DEPLOY_PATH"
echo ""
echo -e "4. ${YELLOW}Push to main branch to trigger deployment!${NC}"
echo ""
echo -e "${GREEN}Manual deployment:${NC}"
echo -e "   cd $DEPLOY_PATH"
echo -e "   docker compose pull"
echo -e "   docker compose up -d"
