# Deployment Guide - Hafalan Next.js Staging

## Prerequisites
- Podman and podman-compose installed
- Traefik already running on the server
- Domain `hafalan-next.humahub.my.id` pointed to the server

## Setup Steps

### 1. Configure Environment Variables
Copy the example environment file and configure it:
```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Update the following variables:
- `POSTGRES_PASSWORD`: Set a strong password for PostgreSQL
- `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`
- `NEXTAUTH_URL`: Should be `https://hafalan-next.humahub.my.id`

### 2. Deploy the Application
Run the deployment script:
```bash
./deploy.sh
```

This script will:
- Build the Docker images
- Start PostgreSQL and the Next.js app
- Run database migrations
- Make the app available through Traefik

### 3. Manual Deployment (Alternative)
If you prefer manual control:
```bash
# Build and start services
podman-compose up -d --build

# Run migrations
podman-compose exec app npx prisma migrate deploy

# Optional: Seed database
podman-compose exec app npm run db:seed
```

## Management Commands

### View Logs
```bash
# All services
podman-compose logs -f

# App only
podman-compose logs -f app

# PostgreSQL only
podman-compose logs -f postgres
```

### Check Status
```bash
podman-compose ps
```

### Restart Services
```bash
# Restart all
podman-compose restart

# Restart app only
podman-compose restart app
```

### Stop Services
```bash
podman-compose down
```

### Database Operations
```bash
# Access PostgreSQL shell
podman-compose exec postgres psql -U hafalan -d hafalan_stg

# Run migrations
podman-compose exec app npx prisma migrate deploy

# Generate Prisma client
podman-compose exec app npx prisma generate

# Seed database
podman-compose exec app npm run db:seed
```

### Rebuild After Code Changes
```bash
# Pull latest code
git pull

# Rebuild and restart
podman-compose down
podman-compose up -d --build

# Run any new migrations
podman-compose exec app npx prisma migrate deploy
```

## Architecture

### Services
1. **PostgreSQL** (`hafalan-stg-postgres`)
   - Database server
   - Port: 5432 (internal only)
   - Data volume: `postgres_data`

2. **Next.js App** (`hafalan-stg-app`)
   - Application server
   - Port: 3000 (internal)
   - Exposed through Traefik at `https://hafalan-next.humahub.my.id`

### Networks
- `internal`: Private network for app and database communication
- `traefik-proxy`: Connects to Traefik for external access

### Traefik Configuration
The app is configured with these Traefik labels:
- Route: `hafalan-next.humahub.my.id`
- HTTPS with automatic SSL via Cloudflare DNS challenge
- Internal port: 3000

## Troubleshooting

### App won't start
```bash
# Check logs
podman-compose logs app

# Verify environment variables
podman-compose exec app env | grep -E "DATABASE_URL|NEXTAUTH"
```

### Database connection issues
```bash
# Check PostgreSQL is running
podman-compose ps postgres

# Test database connection
podman-compose exec postgres psql -U hafalan -d hafalan_stg -c "\dt"
```

### SSL certificate issues
Ensure Traefik is properly configured with Cloudflare credentials in `/home/robby/stacks/prod/traefik/.env`

### Port conflicts
Check if port 3000 is already in use on the host (shouldn't be since it's internal to podman network)

## Security Notes
- Database is only accessible within the internal network
- App is only accessible through Traefik with HTTPS
- Keep `.env` file secure and never commit it to git
- Regularly update dependencies and base images

## Backup
To backup the database:
```bash
podman-compose exec postgres pg_dump -U hafalan hafalan_stg > backup_$(date +%Y%m%d).sql
```

To restore:
```bash
cat backup_20231126.sql | podman-compose exec -T postgres psql -U hafalan -d hafalan_stg
```
