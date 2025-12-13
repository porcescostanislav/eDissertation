# Docker Compose Development Guide

Quick start guide for setting up the complete eDissertation development environment with Docker Compose.

## Prerequisites

- Docker Desktop installed ([download](https://www.docker.com/products/docker-desktop))
- Docker Compose v2.0+ (included with Docker Desktop)
- Git installed
- Terminal/Command prompt

## Quick Start (30 seconds)

```bash
# 1. Clone repository
git clone https://github.com/your-username/eDissertation.git
cd eDissertation

# 2. Start everything
docker-compose up -d

# 3. Wait for MySQL to be healthy (about 10 seconds)
docker-compose ps

# 4. Run database migrations
docker-compose exec backend npm run prisma:migrate

# 5. Open applications
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

## What Gets Installed?

When you run `docker-compose up -d`, the following services are created:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| MySQL | 3306 | `mysql://edissertation:edissertation_password@mysql:3306/edissertation_db` | Database |
| Backend | 3000 | `http://localhost:3000` | Node.js/Express API server |
| Frontend | 5173 | `http://localhost:5173` | React development server |

## Common Commands

### Start Services

```bash
# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up -d backend
docker-compose up -d frontend

# View logs (all services)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Live log streaming
docker-compose logs -f --tail=100 backend
```

### Stop Services

```bash
# Stop all services (containers remain)
docker-compose stop

# Stop specific service
docker-compose stop backend

# Remove all containers (data persists in volumes)
docker-compose down

# Remove everything including data volumes
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Full rebuild and restart
docker-compose up -d --build
```

### View Status

```bash
# Show running containers
docker-compose ps

# Show detailed container info
docker-compose ps -a

# Show resource usage
docker stats
```

## Database Management

### Connect to MySQL

```bash
# Option 1: Using docker-compose
docker-compose exec mysql mysql -u edissertation -p edissertation_db
# Password: edissertation_password

# Option 2: From host (requires MySQL client)
mysql -h localhost -u edissertation -p edissertation_db
# Password: edissertation_password

# Option 3: Using MySQL GUI (MySQL Workbench, DBeaver)
# Host: localhost
# Port: 3306
# User: edissertation
# Password: edissertation_password
# Database: edissertation_db
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npm run prisma:migrate

# Generate Prisma client
docker-compose exec backend npm run prisma:generate

# Reset database (WARNING: deletes all data)
docker-compose exec backend npx prisma migrate reset

# Seed initial data
docker-compose exec backend npm run prisma:seed

# View database schema
docker-compose exec backend npx prisma studio
# Opens at http://localhost:5555
```

### Backup Database

```bash
# Create backup
docker-compose exec mysql mysqldump -u edissertation -pedissertation_password edissertation_db > backup.sql

# Restore from backup
docker-compose exec -T mysql mysql -u edissertation -pedissertation_password edissertation_db < backup.sql
```

## Application Management

### Backend Commands

```bash
# Install dependencies
docker-compose exec backend npm install

# Run development server
docker-compose exec backend npm run dev

# Build application
docker-compose exec backend npm run build

# Run tests
docker-compose exec backend npm test

# Check for security vulnerabilities
docker-compose exec backend npm audit

# Update package.json
# Edit package.json, then:
docker-compose exec backend npm install
docker-compose restart backend
```

### Frontend Commands

```bash
# Install dependencies
docker-compose exec frontend npm install

# Build for production
docker-compose exec frontend npm run build

# Preview production build
docker-compose exec frontend npm run preview

# Check for security vulnerabilities
docker-compose exec frontend npm audit

# Update package.json
# Edit package.json, then:
docker-compose exec frontend npm install
docker-compose restart frontend
```

## Development Workflow

### Hot Reload Development

Both frontend and backend support hot reload during development:

```bash
# Start everything
docker-compose up -d

# Backend: Changes in backend/ auto-reload
# Frontend: Changes in frontend/src/ auto-reload

# View logs to see changes being picked up
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Making Code Changes

The code directories are mounted as volumes, so:

1. Edit files in `backend/` or `frontend/` on your local machine
2. Changes are reflected in running containers
3. Applications auto-reload
4. No need to rebuild or restart

### Adding Dependencies

```bash
# Add package to backend
docker-compose exec backend npm install package-name

# Add package to frontend
docker-compose exec frontend npm install package-name

# These update package-lock.json automatically
```

### Using Node Modules

```bash
# Execute npm scripts
docker-compose exec backend npm run start
docker-compose exec frontend npm run build

# Run arbitrary node command
docker-compose exec backend node script.js

# Open shell in container
docker-compose exec backend sh
# Then run any bash command
npm --version
node --version
ls -la
```

## Environment Variables

### Backend Environment Variables

File: `docker-compose.yml` under `backend.environment`

Default values for development:

```yaml
NODE_ENV: development
PORT: 3000
DATABASE_URL: mysql://edissertation:edissertation_password@mysql:3306/edissertation_db
JWT_SECRET: local_development_secret_change_in_production
FRONTEND_URL: http://localhost:5173
```

### Frontend Environment Variables

File: `frontend/.env.local`

```bash
# Create this file if not present
VITE_API_URL=http://localhost:3000/api
VITE_NODE_ENV=development
```

### Modifying Environment Variables

```bash
# For docker-compose services
# Edit docker-compose.yml under services.backend.environment
# Then restart:
docker-compose restart backend

# For frontend
# Create/edit frontend/.env.local
# Changes auto-reload in browser
```

## Troubleshooting

### Services Won't Start

```bash
# Check for port conflicts
# On Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :3306
netstat -ano | findstr :5173

# On macOS/Linux:
lsof -i :3000
lsof -i :3306
lsof -i :5173

# Solution: Stop conflicting service or use different port
# Edit docker-compose.yml ports section
```

### Database Connection Failed

```bash
# Check if MySQL is healthy
docker-compose ps mysql

# View MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Wait for health check to pass
# Check 'STATUS' column shows 'healthy'
```

### Backend Crashes on Startup

```bash
# View detailed logs
docker-compose logs backend

# Common issues:
# 1. Database not ready
#    Solution: Wait longer, check MySQL is healthy
# 2. Prisma client not generated
#    Solution: docker-compose exec backend npm run prisma:generate
# 3. Missing dependencies
#    Solution: docker-compose exec backend npm install
```

### Frontend Blank Page / API Errors

```bash
# Check frontend logs
docker-compose logs -f frontend

# Check if backend is accessible
curl http://localhost:3000/health

# Verify API URL in frontend/.env.local
# Should be: VITE_API_URL=http://localhost:3000/api

# Clear browser cache (Ctrl+Shift+Delete)
# Hard refresh page (Ctrl+Shift+R)
```

### Volume/Persistence Issues

```bash
# Data not persisting between restarts?
# Check volumes exist:
docker volume ls | grep edissertation

# Reset volumes (WARNING: loses all data)
docker-compose down -v

# Recreate everything
docker-compose up -d
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a

# Or specifically:
docker image prune -a          # Remove unused images
docker container prune         # Remove stopped containers
docker volume prune            # Remove unused volumes
```

## Testing

### Run Backend Tests

```bash
# Run all tests
docker-compose exec backend npm test

# Run specific test file
docker-compose exec backend npm test -- test/auth.test.js

# Watch mode
docker-compose exec backend npm test -- --watch
```

### Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# List students
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Frontend Testing

```bash
# Run frontend tests
docker-compose exec frontend npm test

# Build and test for production
docker-compose exec frontend npm run build
docker-compose exec frontend npm run preview
# Then visit http://localhost:4173
```

## Performance Tuning

### Increase Resource Limits

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

Then restart:

```bash
docker-compose up -d --force-recreate
```

### Check Resource Usage

```bash
# Real-time stats
docker stats

# Detailed container info
docker inspect container-name
```

## Advanced Usage

### Custom Dockerfile Builds

```bash
# Rebuild images with fresh layers
docker-compose build --no-cache

# Build specific service
docker-compose build --no-cache backend

# View build output
docker-compose build --verbose backend
```

### Network Inspection

```bash
# List networks
docker network ls

# Inspect network
docker network inspect edissertation_edissertation

# Test connectivity between containers
docker-compose exec backend ping mysql
docker-compose exec backend curl http://localhost:3000
```

### Container Shell Access

```bash
# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Access MySQL shell
docker-compose exec mysql bash

# From shell, run any command
npm list
git status
whoami
```

### View Container Info

```bash
# Container details
docker inspect edissertation-backend

# Mounted volumes
docker inspect edissertation-backend | grep -A 20 Mounts

# Network settings
docker inspect edissertation-backend | grep -A 10 NetworkSettings
```

## Production Readiness Check

Before deploying to production, verify:

```bash
# 1. All tests pass
docker-compose exec backend npm test
docker-compose exec frontend npm test

# 2. No vulnerabilities
docker-compose exec backend npm audit
docker-compose exec frontend npm audit

# 3. Build succeeds
docker-compose exec backend npm run build
docker-compose exec frontend npm run build

# 4. Migrations work
docker-compose exec backend npm run prisma:migrate

# 5. Application starts cleanly
docker-compose restart
docker-compose ps
docker-compose logs backend | head -20
```

## Migration from Docker to Production

When ready to deploy:

1. Build images for production:
```bash
docker-compose build --prod
```

2. Tag images:
```bash
docker tag edissertation-backend:latest your-registry/edissertation-backend:1.0.0
docker tag edissertation-frontend:latest your-registry/edissertation-frontend:1.0.0
```

3. Push to registry:
```bash
docker push your-registry/edissertation-backend:1.0.0
docker push your-registry/edissertation-frontend:1.0.0
```

4. Deploy using production docker-compose or Kubernetes

## Getting Help

```bash
# Docker documentation
docker-compose --help

# Specific command help
docker-compose up --help

# View system logs
docker system events --follow

# Clean rebuild everything
docker-compose down -v
docker-compose up -d
```

## Useful Aliases

Add to `.bashrc` or `.zshrc`:

```bash
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'
alias dcexec='docker-compose exec'

# Usage:
# dcup
# dclogs backend
# dcexec backend npm test
```

## Best Practices

1. **Regular backups**: `docker-compose exec mysql mysqldump ... > backup.sql`
2. **Keep volumes**: Don't use `docker-compose down -v` without backing up data
3. **Update images**: `docker-compose pull` periodically
4. **Monitor logs**: Check `docker-compose logs` regularly
5. **Security**: Change JWT_SECRET for production
6. **Testing**: Always test locally before pushing
7. **Documentation**: Keep docker-compose.yml documented
8. **Version control**: Commit docker-compose.yml to Git

---

**Last Updated**: December 2025
**Tested With**: Docker 24.0+, Docker Compose 2.20+
