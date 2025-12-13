# Deployment Guide for eDissertation

This guide covers deployment options for the eDissertation application.

## Prerequisites

- Git repository pushed to GitHub
- Node.js 16+ and npm 7+
- MySQL database (cloud or self-hosted)
- API key/credentials for chosen platform

---

## 1. Heroku Deployment (Recommended for Beginners)

### Setup

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login
```

### Deploy Backend

```bash
# Create Heroku app
heroku create edissertation-api

# Add MySQL addon (JawsDB)
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_long_secure_secret_here
heroku config:set FRONTEND_URL=https://yourdomain.com

# Deploy
git push heroku main
# Or for subdirectory:
git subtree push --prefix backend heroku main

# Run migrations
heroku run npm run prisma:migrate

# View logs
heroku logs --tail
```

### Deploy Frontend

```bash
# Create Heroku app for frontend (buildpack: create-react-app)
heroku create edissertation-web

# Set API URL
heroku config:set VITE_API_BASE_URL=https://edissertation-api.herokuapp.com/api

# Deploy
git subtree push --prefix frontend heroku main

# View logs
heroku logs --tail
```

### Deploy Frontend

```bash
# Create Heroku app for frontend (buildpack: create-react-app)
heroku create edissertation-web

# Set API URL
heroku config:set VITE_API_URL=https://edissertation-api.herokuapp.com/api

# Deploy
git subtree push --prefix frontend heroku main

# View logs
heroku logs --tail
```

---

## 2. Render Deployment (Free Tier Available)

### Setup

1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Connect GitHub repository

### Deploy Backend

```bash
# Using render.yaml file in root directory
# Render automatically detects and deploys using the config

# Or manually create from dashboard:
# 1. New Web Service
# 2. Connect GitHub repo
# 3. Configuration:
#    - Name: edissertation-api
#    - Environment: Node
#    - Build command: npm install && npm run build
#    - Start command: npm start
#    - Plan: Free
# 4. Add environment variables from dashboard:
#    - NODE_ENV=production
#    - DATABASE_URL=(from PostgreSQL database)
#    - JWT_SECRET=your_secret
#    - FRONTEND_URL=https://yourdomain.com
```

### Create PostgreSQL Database on Render

```bash
# In Render dashboard:
# 1. New PostgreSQL
# 2. Name: edissertation-db
# 3. Region: (your choice)
# 4. Plan: Free
# 5. Connect to backend service

# Update backend DATABASE_URL to use PostgreSQL:
# postgresql://user:password@host:5432/database
```

### Deploy Frontend

1. Create new Static Site
2. Connect GitHub repo (frontend directory)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set environment variable: `VITE_API_BASE_URL=https://edissertation-api.onrender.com/api`

---

## 3. AWS Deployment (EC2 + RDS)

### Setup EC2 Instance

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### Deploy Backend

```bash
# Clone repository
git clone https://github.com/yourusername/eDissertation.git
cd eDissertation/backend

# Install dependencies
npm ci --only=production

# Create .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@rds-host:3306/edissertation_db
JWT_SECRET=your_secret_here
FRONTEND_URL=https://yourdomain.com
EOF

# Run migrations
npm run prisma:migrate

# Start with PM2
pm2 start server.js --name "edissertation-api"
pm2 startup
pm2 save
```

### Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/edissertation

# Paste (update yourdomain.com):
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /home/ubuntu/eDissertation/frontend/dist;
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        alias /home/ubuntu/eDissertation/backend/uploads/;
    }
}
```

```bash
# Enable config
sudo ln -s /etc/nginx/sites-available/edissertation /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 4. Docker Deployment

### Build Docker Image

```bash
# Build backend image
cd backend
docker build -t edissertation-backend:latest .

# Build frontend image
cd ../frontend
docker build -t edissertation-frontend:latest .
```

### Local Testing with Docker Compose

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Tear down
docker-compose down
```

### Deploy to Docker Registry

```bash
# Login to Docker Hub
docker login

# Tag images
docker tag edissertation-backend:latest yourusername/edissertation-backend:latest
docker tag edissertation-frontend:latest yourusername/edissertation-frontend:latest

# Push images
docker push yourusername/edissertation-backend:latest
docker push yourusername/edissertation-frontend:latest

# Deploy using docker-compose on server
# (Pull images and run docker-compose up -d)
```

---

## 5. Azure App Service

### Deploy Backend

```bash
# Create resource group
az group create --name edissertation --location eastus

# Create App Service plan
az appservice plan create \
  --name edissertation-plan \
  --resource-group edissertation \
  --sku B1 --is-linux

# Create web app
az webapp create \
  --resource-group edissertation \
  --plan edissertation-plan \
  --name edissertation-api \
  --runtime "node|16-lts"

# Set environment variables
az webapp config appsettings set \
  --resource-group edissertation \
  --name edissertation-api \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="mysql://..." \
    JWT_SECRET="your_secret" \
    FRONTEND_URL="https://yourdomain.com"

# Deploy from Git
az webapp deployment source config-local-git \
  --resource-group edissertation \
  --name edissertation-api

# Add remote and push
git remote add azure <deployment-url>
git push azure main
```

---

## Environment Variables Checklist

For all deployments, ensure these variables are set:

```
NODE_ENV=production
PORT=3000 (or leave empty for auto-assignment)
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=long_random_string_minimum_32_characters
FRONTEND_URL=https://yourdomain.com
```

---

## Post-Deployment

### 1. Verify Health Endpoint

```bash
curl https://api.yourdomain.com/health
# Should return: {"health":"ok"}
```

### 2. Test API Endpoint

```bash
curl https://api.yourdomain.com/api/status
# Should return database and server status
```

### 3. Database Backups

- **Heroku**: Automatic with JawsDB addon
- **Render**: Manual backup from dashboard
- **AWS**: Configure automated RDS snapshots
- **Azure**: Enable Point-in-time restore

### 4. Monitoring & Logs

- **Heroku**: `heroku logs --tail`
- **Render**: View logs in dashboard
- **AWS**: CloudWatch logs
- **Azure**: Application Insights

### 5. SSL Certificates

- **Heroku/Render**: Automatic HTTPS provided
- **AWS EC2**: Use Let's Encrypt (certbot)
- **Azure**: Managed certificate available

---

## Troubleshooting Deployment

### Database Connection Error

```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Verify database is accessible
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -D $DB_NAME
```

### Build Failures

```bash
# Check Node version matches
node --version

# Rebuild dependencies
rm -rf node_modules package-lock.json
npm ci --only=production

# Run build script
npm run build
```

### API Not Responding

```bash
# Check health endpoint
curl https://api.yourdomain.com/health

# View server logs (platform-specific)
heroku logs --tail  # Heroku
```

### CORS Errors

```bash
# Verify FRONTEND_URL is set correctly
# Update CORS configuration in server.js if needed
# Restart application
```

---

## Security Best Practices

1. **Never commit .env file** - Use .env.example instead
2. **Rotate JWT_SECRET** regularly
3. **Enable HTTPS** for all connections
4. **Use strong passwords** for database
5. **Limit database access** to application only
6. **Regular backups** of database
7. **Monitor logs** for suspicious activity
8. **Keep dependencies updated** - Run `npm audit` regularly
9. **Use environment-specific variables**
10. **Enable firewall rules** on database

---

## Scaling Considerations

- Use CDN for static files (Cloudflare, CloudFront)
- Implement database connection pooling
- Cache frequently accessed data
- Use load balancer for multiple instances
- Monitor resource usage and scale as needed
- Implement request rate limiting

---

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review application logs
3. Verify environment variables
4. Test locally with `npm run dev`
5. Check database connectivity
6. Review CORS configuration

---

**Last Updated**: December 2025
**Supported Platforms**: Heroku, Render, AWS, Azure, Docker
