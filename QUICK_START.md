# 🚀 Quick Start Guide - Hafalan STG

## 🌐 Application URL
```
https://hafalan-next.humahub.my.id
```

---

## 📚 Demo Accounts (Already Seeded)

| Role | Email | Password |
|------|-------|----------|
| 👨‍💼 Admin | admin@hafalan.com | admin123 |
| 👨‍🏫 Teacher | teacher@hafalan.com | teacher123 |
| 👨‍👧‍👦 Wali | wali@hafalan.com | wali123 |
| 👦 Santri | santri@hafalan.com | santri123 |

---

## ⚡ Essential Commands

### Start/Stop Services
```bash
cd /home/robby/stacks/stg/hafalan

# Start all services
podman-compose up -d

# Stop all services
podman-compose down

# Restart app
podman-compose restart app

# Check status
podman-compose ps
```

### View Logs
```bash
# All services
podman-compose logs -f

# Only app
podman-compose logs -f app

# Only database
podman-compose logs -f postgres
```

### Database Management

#### Seed Data (Fill with demo data)
```bash
# Method 1: Interactive helper (RECOMMENDED)
./seed-helper.sh

# Method 2: Direct seed
podman exec hafalan-stg-app sh -c "npx --yes tsx@4.20.3 prisma/seed.ts"

# Method 3: Reset everything & seed
podman exec hafalan-stg-app npx --yes prisma@6.11.1 migrate reset --force
```

#### Run Migrations
```bash
podman exec hafalan-stg-app npx --yes prisma@6.11.1 migrate deploy
```

#### Database Shell (PostgreSQL)
```bash
# Access PostgreSQL
podman-compose exec postgres psql -U hafalan -d hafalan_stg

# Some useful queries:
\dt                                    # List all tables
\d users                               # Describe 'users' table
SELECT * FROM users;                   # Show all users
SELECT COUNT(*) FROM kaca;             # Count kaca pages
\q                                     # Exit
```

---

## 🔍 Monitoring & Debugging

### Check if containers are running
```bash
podman ps | grep hafalan-stg
```

### View detailed container info
```bash
podman inspect hafalan-stg-app
```

### Check database connection
```bash
podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT 1;"
```

### Test HTTP connection
```bash
curl -I https://hafalan-next.humahub.my.id
```

### View full app logs
```bash
podman logs hafalan-stg-app --tail 100
```

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Build configuration for Next.js app |
| `podman-compose.yml` | Container orchestration |
| `.env` | Environment variables (secrets) |
| `DEPLOYMENT.md` | Detailed deployment guide |
| `SEEDING_GUIDE.md` | Database seeding guide |
| `deploy.sh` | Automated deployment script |
| `seed-helper.sh` | Interactive seed helper |

---

## 🚨 Troubleshooting

### App won't start
```bash
# Check logs
podman logs hafalan-stg-app

# Verify database connection
podman exec hafalan-stg-app env | grep DATABASE_URL
```

### Database connection error
```bash
# Check if database is running
podman ps | grep hafalan-stg-postgres

# Test connection
podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "\dt"
```

### Port 3000 already in use (shouldn't happen - internal network)
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### SSL certificate issues
- Ensure Traefik is running on the host
- Check `/home/robby/stacks/prod/traefik/.env` for Cloudflare credentials
- Verify domain DNS is pointing to server

### Need to reset everything
```bash
# ⚠️ DANGEROUS - Deletes all data!
podman-compose down
podman-compose up -d
podman exec hafalan-stg-app npx --yes prisma@6.11.1 migrate reset --force
```

---

## 📊 Database Backup & Restore

### Backup
```bash
# Create backup file
podman exec hafalan-stg-postgres pg_dump -U hafalan hafalan_stg > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
podman exec hafalan-stg-postgres pg_dump -U hafalan hafalan_stg | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore
```bash
# From SQL file
cat backup_20231126.sql | podman exec -T hafalan-stg-postgres psql -U hafalan -d hafalan_stg

# From compressed file
zcat backup_20231126.sql.gz | podman exec -T hafalan-stg-postgres psql -U hafalan -d hafalan_stg
```

---

## 📝 Adding New Users

### Via Database (Direct)
```bash
# Access database
podman-compose exec postgres psql -U hafalan -d hafalan_stg

# Insert user
INSERT INTO users (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'user_id_here',
  'newuser@hafalan.com',
  'New User',
  '$2b$12$HASHED_PASSWORD_HERE',
  'SANTRI',
  NOW(),
  NOW()
);
```

### Via Seed Script (Recommended)
Edit `prisma/seed.ts` and add to `seedUsers()` function, then run:
```bash
./seed-helper.sh
```

---

## 🔐 Changing Passwords

### Generate Password Hash
```bash
./seed-helper.sh
# Select option 7 to generate hash

# Or manually:
podman exec hafalan-stg-app node -e "
const bcryptjs = require('bcryptjs');
const hashed = bcryptjs.hashSync('newpassword', 12);
console.log(hashed);
"
```

### Update User Password
```bash
# In database
podman-compose exec postgres psql -U hafalan -d hafalan_stg

UPDATE users SET password = '$2b$12$HASHED_PASSWORD_HERE' WHERE email = 'user@email.com';
\q
```

---

## 📖 Full Documentation

- **Deployment Guide**: `DEPLOYMENT.md`
- **Seeding Guide**: `SEEDING_GUIDE.md`
- **This Quick Start**: `QUICK_START.md`

---

## ✨ Useful One-Liners

```bash
# Check all containers
podman ps -a

# Remove all stopped containers
podman container prune

# View disk usage
podman system df

# Check network
podman network ls

# View environment variables
podman exec hafalan-stg-app env | sort

# Restart app and follow logs
podman-compose restart app && podman-compose logs -f app

# Check last 50 lines of log
podman logs --tail 50 hafalan-stg-app
```

---

**Last Updated**: 2025-11-26
**Status**: ✅ Production Ready
