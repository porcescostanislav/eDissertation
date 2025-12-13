# Deployment Infrastructure Quick Reference

Quick lookup reference for all deployment configurations and commands.

## File Locations

### Backend Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| Procfile | `/backend/Procfile` | Heroku process definition |
| Dockerfile | `/backend/Dockerfile` | Container configuration (multi-stage build) |
| .dockerignore | `/backend/.dockerignore` | Docker build optimization |
| heroku.yml | `/backend/heroku.yml` | Heroku Docker-based deployment |
| .env.example | `/backend/.env.example` | Environment variables template |
| package.json | `/backend/package.json` | Dependencies and build scripts |
| server.js | `/backend/server.js` | Express app with env variable support |

### Frontend Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| Dockerfile | `/frontend/Dockerfile` | Container configuration |
| .dockerignore | `/frontend/.dockerignore` | Docker build optimization |
| .env.example | `/frontend/.env.example` | Environment variables template |
| vite.config.js | `/frontend/vite.config.js` | Build and dev server configuration |
| package.json | `/frontend/package.json` | Dependencies and build scripts |

### Root Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| docker-compose.yml | `/docker-compose.yml` | Complete local dev stack |
| render.yaml | `/render.yaml` | Render deployment configuration |
| vercel.json | `/vercel.json` | Vercel deployment configuration |
| DEPLOYMENT.md | `/DEPLOYMENT.md` | Backend deployment guide (5 platforms) |
| FRONTEND_DEPLOYMENT.md | `/FRONTEND_DEPLOYMENT.md` | Frontend deployment guide (7 platforms) |
| DOCKER_COMPOSE_GUIDE.md | `/DOCKER_COMPOSE_GUIDE.md` | Docker Compose development guide |
| DEPLOYMENT_CHECKLIST.md | `/DEPLOYMENT_CHECKLIST.md` | Pre-deployment verification checklist |

## Environment Variables

### Backend (Required for Production)

```bash
# Server Configuration
PORT=3000                                        # Optional, defaults to 3000
NODE_ENV=production                              # development or production

# Database Configuration
DATABASE_URL=mysql://user:pass@host:port/db     # REQUIRED - MySQL connection string

# Authentication
JWT_SECRET=your_32_character_random_string      # REQUIRED - Min 32 characters

# CORS Configuration
FRONTEND_URL=https://yourdomain.com             # Frontend URL for CORS

# File Upload Configuration
UPLOAD_DIR=./uploads                            # Upload directory path
MAX_FILE_SIZE=5242880                           # 5MB in bytes
```

### Frontend (Required for Browser Access)

```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com/api     # Backend API endpoint (must include /api)

# Application Configuration
VITE_NODE_ENV=production                        # development or production
```

## Quick Deploy Commands

### Heroku (Backend + Frontend)

```bash
# Backend
heroku login
heroku create edissertation-api
heroku addons:create jawsdb:kitefin
heroku config:set NODE_ENV=production JWT_SECRET=your_secret FRONTEND_URL=https://frontend.herokuapp.com
git push heroku main:main

# Frontend
heroku create edissertation-web
heroku config:set VITE_API_URL=https://edissertation-api.herokuapp.com/api
cd frontend && git push heroku main:main

# Verify
heroku logs --tail
```

### Render (Backend + Frontend)

```bash
# Backend (using render.yaml):
# Push to GitHub and Render auto-deploys

# Frontend:
# Dashboard → Static Site → Connect GitHub
# Build: npm run build
# Publish: dist
# Env: VITE_API_URL=https://api.onrender.com/api
```

### Docker Compose (Local Development)

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec backend npm run prisma:migrate

# Stop
docker-compose down

# Cleanup
docker-compose down -v
```

### Docker (Production)

```bash
# Build
docker build -t edissertation-api:1.0.0 ./backend
docker build -t edissertation-web:1.0.0 ./frontend

# Run locally to test
docker run -p 3000:3000 edissertation-api:1.0.0
docker run -p 5173:3000 edissertation-web:1.0.0

# Push to registry
docker push your-registry/edissertation-api:1.0.0
docker push your-registry/edissertation-web:1.0.0
```

### AWS EC2 + RDS

```bash
# SSH to server
ssh -i key.pem ubuntu@instance-ip

# Setup (one-time)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs nginx -y
sudo npm install -g pm2

# Deploy
git clone your-repo
cd eDissertation/backend
npm install
NODE_ENV=production npm start  # Or use PM2

# Nginx setup
sudo nano /etc/nginx/sites-available/edissertation  # Copy config from DEPLOYMENT.md
sudo ln -s /etc/nginx/sites-available/edissertation /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## Port Mappings

| Service | Local Port | Container Port | URL |
|---------|-----------|---|-----|
| Frontend Dev | 5173 | 5173 | http://localhost:5173 |
| Frontend Prod | 3000 | 3000 | http://localhost:3000 |
| Backend | 3000 | 3000 | http://localhost:3000 |
| MySQL | 3306 | 3306 | localhost:3306 |
| Prisma Studio | 5555 | N/A | http://localhost:5555 |

## Database Connection Strings

### Local Development

```
mysql://edissertation:edissertation_password@localhost:3306/edissertation_db
```

### Docker Compose

```
mysql://edissertation:edissertation_password@mysql:3306/edissertation_db
```

### Remote Examples

#### Heroku JawsDB
```
mysql://user:password@host.jawsdb.com:port/database
```

#### AWS RDS
```
mysql://admin:password@rds-instance.region.rds.amazonaws.com:3306/edissertation_db
```

#### Azure Database for MySQL
```
mysql://admin@server:password@server.mysql.database.azure.com:3306/edissertation_db
```

## Health Checks

### Backend Health Endpoint

```bash
# Local
curl http://localhost:3000/health

# Production
curl https://api.yourdomain.com/health

# In CI/CD pipeline
curl -f http://localhost:3000/health || exit 1
```

### Database Health Check

```bash
# Docker Compose
docker-compose exec mysql mysqladmin ping -h localhost

# Remote (from server)
mysqladmin ping -h rds-instance.rds.amazonaws.com -u admin -p
```

### Frontend Health Check

```bash
# Local development
curl http://localhost:5173

# Docker container
curl http://localhost:3000

# Production
curl https://yourdomain.com
```

## Common Issues & Solutions

### Issue: Port Already in Use

```bash
# Find what's using port 3000
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000

# Solution: Stop the service or use different port
```

### Issue: Database Connection Failed

```bash
# Check if MySQL is accessible
mysql -h localhost -u edissertation -p -e "SELECT 1;"

# Check connection string
echo $DATABASE_URL

# For Docker Compose
docker-compose logs mysql
docker-compose ps mysql  # Should show "healthy"
```

### Issue: Blank Frontend / API 404

```bash
# 1. Verify backend is running
curl http://localhost:3000/health

# 2. Check VITE_API_URL in frontend/.env.local
# Must be: http://localhost:3000/api (development)
#       or https://api.yourdomain.com/api (production)

# 3. Check browser console for errors
# Open DevTools → Console tab

# 4. Hard refresh browser
# Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Issue: Docker Compose Won't Start

```bash
# Check Docker is running
docker ps

# Check for errors
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Start with verbose output
docker-compose up -d --verbose
```

### Issue: Migrations Failed

```bash
# Check migrations are available
docker-compose exec backend ls -la prisma/migrations

# Run specific migration
docker-compose exec backend npx prisma migrate deploy

# Reset database (WARNING: lose all data)
docker-compose exec backend npx prisma migrate reset --force
```

## Key Commands by Scenario

### Scenario: Start Fresh Development

```bash
# Clean everything and restart
docker-compose down -v
docker-compose build
docker-compose up -d
docker-compose exec backend npm run prisma:migrate
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Scenario: Deploy to Heroku

```bash
# Prerequisites: Heroku CLI, GitHub repo

# Backend
heroku create app-name-api
heroku addons:create jawsdb:kitefin
heroku config:set NODE_ENV=production JWT_SECRET="..."
git push heroku main

# Frontend
heroku create app-name-web
git subtree push --prefix frontend heroku main

# Verify
heroku logs --tail
heroku open
```

### Scenario: Deploy to Docker Registry

```bash
# Build
docker build -t myrepo/api:1.0.0 ./backend
docker build -t myrepo/web:1.0.0 ./frontend

# Test locally
docker run -p 3000:3000 myrepo/api:1.0.0
docker run -p 5173:3000 myrepo/web:1.0.0

# Push
docker push myrepo/api:1.0.0
docker push myrepo/web:1.0.0

# Pull and run elsewhere
docker pull myrepo/api:1.0.0
docker run -p 3000:3000 myrepo/api:1.0.0
```

### Scenario: Backup Database

```bash
# Docker Compose
docker-compose exec mysql mysqldump -u edissertation -pedissertation_password edissertation_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Remote (Heroku)
heroku addons:open jawsdb  # Open in browser and export

# Remote (AWS RDS)
mysqldump -h rds.amazonaws.com -u admin -p edissertation_db > backup.sql
```

### Scenario: Restore Database

```bash
# From backup file
docker-compose exec -T mysql mysql -u edissertation -pedissertation_password edissertation_db < backup.sql

# Or with Prisma
# Edit data in backup, then run migrations again
```

## Build Scripts Reference

### Backend

```bash
npm start                  # Production: node server.js
npm run dev               # Development: node --watch server.js
npm run build             # Generate Prisma client
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Apply migrations (production-safe)
npm run prisma:seed       # Seed initial data
npm test                  # Run tests
npm audit                 # Check for vulnerabilities
```

### Frontend

```bash
npm run dev               # Development server with HMR
npm run build             # Build for production (creates dist/)
npm run preview           # Preview production build locally
npm test                  # Run tests
npm audit                 # Check for vulnerabilities
```

## Deployment Platform Comparison

| Platform | Cost | Ease | Scalability | Free Tier | Best For |
|----------|------|------|--|--|--|
| Heroku | $ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Limited | Quick deployment |
| Render | Free → $ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Yes | Full stack |
| Vercel | Free → $ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Yes | Frontend |
| AWS | $$ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 1 year | Enterprise |
| Azure | $$ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $200 credit | Enterprise |
| Docker | Flexible | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Free | Any platform |
| Self-hosted | Server cost | ⭐⭐ | ⭐⭐⭐ | Free | Full control |

## Performance Targets

| Metric | Target | Tool to Measure |
|--------|--------|---|
| Initial Load | < 3 seconds | Google Lighthouse |
| Time to Interactive | < 5 seconds | Google Lighthouse |
| API Response Time | < 200ms | Network tab in DevTools |
| Database Query | < 100ms | Database monitoring |
| Bundle Size | < 500KB gzipped | `webpack-bundle-analyzer` |
| Lighthouse Score | > 90 | Google Lighthouse |

## Security Checklist (Pre-Production)

- [ ] `JWT_SECRET` is min 32 characters
- [ ] `DATABASE_URL` is never hardcoded
- [ ] `.env` file is in `.gitignore`
- [ ] HTTPS/SSL enabled
- [ ] CORS configured for correct origin
- [ ] Database backups configured
- [ ] Error logs don't expose sensitive info
- [ ] Dependencies audited (`npm audit`)
- [ ] Security headers set (helmet.js)
- [ ] Rate limiting implemented

## Support Links

- **Docker**: https://docs.docker.com
- **Docker Compose**: https://docs.docker.com/compose
- **Heroku**: https://devcenter.heroku.com
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **AWS**: https://aws.amazon.com/documentation
- **Azure**: https://docs.microsoft.com/azure
- **Nginx**: https://nginx.org/en/docs
- **Prisma**: https://www.prisma.io/docs
- **React**: https://react.dev
- **Express**: https://expressjs.com

---

**Last Updated**: December 2025
**Supported**: Node 16+, npm 7+, Docker 20+
