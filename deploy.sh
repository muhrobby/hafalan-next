#!/bin/bash
set -e

echo "🚀 Deploying Hafalan Next.js to Staging..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please copy .env.example to .env and configure it."
    exit 1
fi

# Build and start containers
echo "📦 Building and starting containers..."
podman-compose down
podman-compose build --no-cache
podman-compose up -d

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
podman-compose exec app npx prisma migrate deploy

# Optional: Seed database (uncomment if needed)
# echo "🌱 Seeding database..."
# podman-compose exec app npm run db:seed

echo "✅ Deployment complete!"
echo "🌐 Application should be available at: https://hafalan-next.humahub.my.id"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: podman-compose logs -f app"
echo "  - Check status: podman-compose ps"
echo "  - Stop: podman-compose down"
echo "  - Restart: podman-compose restart app"
