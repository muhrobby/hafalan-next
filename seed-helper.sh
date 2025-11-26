#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Database Seeding Helper for Hafalan STG             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if containers are running
echo -e "${YELLOW}🔍 Checking if containers are running...${NC}"
if ! podman ps | grep -q hafalan-stg-postgres; then
    echo -e "${RED}❌ PostgreSQL container not running!${NC}"
    echo "   Run: podman-compose up -d"
    exit 1
fi

if ! podman ps | grep -q hafalan-stg-app; then
    echo -e "${RED}❌ App container not running!${NC}"
    echo "   Run: podman-compose up -d"
    exit 1
fi

echo -e "${GREEN}✅ Containers are running${NC}"
echo ""

# Menu
echo -e "${BLUE}📋 Choose an option:${NC}"
echo ""
echo "1️⃣  Run seed (fill database with demo data)"
echo "2️⃣  Reset database & seed (DANGEROUS - deletes all data)"
echo "3️⃣  Check users count"
echo "4️⃣  Check kaca count"
echo "5️⃣  List all users"
echo "6️⃣  List kaca pages"
echo "7️⃣  Generate password hash"
echo "8️⃣  Exit"
echo ""

read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}🌱 Running seed...${NC}"
        podman exec hafalan-stg-app sh -c "npx --yes tsx@4.20.3 prisma/seed.ts"
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Seeding completed successfully!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Seeding failed!${NC}"
            exit 1
        fi
        ;;
    2)
        echo ""
        echo -e "${YELLOW}⚠️  This will DELETE ALL DATA from the database!${NC}"
        read -p "Are you sure? Type 'yes' to continue: " confirm
        if [ "$confirm" != "yes" ]; then
            echo -e "${YELLOW}❌ Cancelled${NC}"
            exit 0
        fi
        echo ""
        echo -e "${YELLOW}🔄 Resetting database...${NC}"
        podman exec hafalan-stg-app npx --yes prisma@6.11.1 migrate reset --force
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Database reset and seeded successfully!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Reset failed!${NC}"
            exit 1
        fi
        ;;
    3)
        echo ""
        echo -e "${BLUE}📊 Checking users count...${NC}"
        podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT COUNT(*) as total_users FROM users;"
        ;;
    4)
        echo ""
        echo -e "${BLUE}📊 Checking kaca count...${NC}"
        podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT COUNT(*) as total_kaca FROM kaca;"
        ;;
    5)
        echo ""
        echo -e "${BLUE}👥 List of all users:${NC}"
        podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT id, email, role, name FROM users ORDER BY id;"
        ;;
    6)
        echo ""
        echo -e "${BLUE}📖 List of kaca pages (first 10):${NC}"
        podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT page_number, surah_name, juz, description FROM kaca ORDER BY page_number LIMIT 10;"
        ;;
    7)
        echo ""
        read -p "Enter password to hash: " password
        echo ""
        echo -e "${YELLOW}🔐 Generating hash...${NC}"
        podman exec hafalan-stg-app sh << 'EOF'
node -e "
const bcryptjs = require('bcryptjs');
const password = process.argv[1];
const hashed = bcryptjs.hashSync(password, 12);
console.log('Hashed password:');
console.log(hashed);
" "$password"
EOF
        ;;
    8)
        echo -e "${GREEN}Goodbye! 👋${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid option!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
