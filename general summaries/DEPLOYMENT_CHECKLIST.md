# Deployment Configuration Checklist

Complete this checklist before deploying to production.

## Environment Variables

### Backend Environment Variables

- [ ] `PORT` - Set to 3000 or your desired port (optional, defaults to 3000)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `DATABASE_URL` - MySQL connection string (e.g., `mysql://user:password@host:port/database`)
- [ ] `JWT_SECRET` - Min 32 characters, strong random string (generate: `openssl rand -base64 32`)
- [ ] `FRONTEND_URL` - Full URL of frontend (e.g., `https://yourdomain.com`)
- [ ] `UPLOAD_DIR` - Directory for file uploads (e.g., `./uploads`)
- [ ] `MAX_FILE_SIZE` - Max file size in bytes (e.g., `5242880` for 5MB)

### Frontend Environment Variables

- [ ] `VITE_API_URL` - Full backend API URL (e.g., `https://api.yourdomain.com/api`)
- [ ] `VITE_NODE_ENV` - Set to `production`

## Backend Configuration Files

### Required Files

- [ ] `.env` or `.env.production` - Environment variables file (DO NOT commit)
- [ ] `.env.example` - Template with all required variables (commit this)
- [ ] `Procfile` - Process definition (for Heroku)
- [ ] `package.json` - Updated with engines and scripts

### Optional Files (by platform)

- [ ] `Dockerfile` - Container configuration
- [ ] `.dockerignore` - Docker build optimization
- [ ] `heroku.yml` - Heroku container configuration
- [ ] `render.yaml` - Render deployment configuration
- [ ] `vercel.json` - Vercel configuration

## Frontend Configuration Files

### Required Files

- [ ] `.env.local` - Frontend environment variables (DO NOT commit)
- [ ] `.env.example` - Template with variables (commit this)
- [ ] `vite.config.js` - Updated with build configuration
- [ ] `package.json` - Updated with build scripts

### Optional Files (by platform)

- [ ] `Dockerfile` - Container configuration
- [ ] `.dockerignore` - Docker build optimization
- [ ] `vercel.json` - Vercel configuration

## Database Configuration

### MySQL Database

- [ ] Database created with name `edissertation_db`
- [ ] User created with limited permissions (not root)
- [ ] Connection string verified: `mysql://user:password@host:port/database`
- [ ] Test connection from application server
- [ ] Database backups configured
- [ ] Replication enabled (optional, for HA)

### Migrations

- [ ] Initial schema applied with `npm run prisma:migrate`
- [ ] All seed data loaded
- [ ] Test queries run successfully
- [ ] Rollback procedure documented

## Server/Platform Configuration

### Heroku

- [ ] App created: `heroku create edissertation-api`
- [ ] MySQL addon added: `heroku addons:create jawsdb:kitefin`
- [ ] Environment variables set with `heroku config:set`
- [ ] Procfile committed to repository
- [ ] Deployment tested: `git push heroku main`
- [ ] Logs verified: `heroku logs --tail`

### Render

- [ ] Web service created with Node environment
- [ ] PostgreSQL database provisioned
- [ ] Environment variables set in dashboard
- [ ] Build command configured: `npm install && npm run build`
- [ ] Start command configured: `npm start`
- [ ] Health check configured: `GET /health`
- [ ] Deploy button triggered from dashboard

### AWS (EC2 + RDS)

- [ ] EC2 instance launched (t3.micro or larger)
- [ ] Security groups configured (ports 22, 80, 443 open)
- [ ] Key pair created and stored securely
- [ ] RDS MySQL instance created
- [ ] RDS security group allows EC2 access
- [ ] Node.js installed on EC2
- [ ] Application deployed to EC2
- [ ] PM2 process manager configured
- [ ] Nginx reverse proxy configured
- [ ] SSL certificates installed (Let's Encrypt)

### Azure

- [ ] Resource group created
- [ ] App Service Plan created
- [ ] Web App deployed
- [ ] MySQL Database for Azure created
- [ ] Connection string configured
- [ ] Deployment slots configured (optional)
- [ ] Continuous deployment from GitHub enabled
- [ ] Application Insights configured (optional)
- [ ] Custom domain configured
- [ ] SSL certificate installed

### Docker

- [ ] Dockerfile created for backend
- [ ] Dockerfile created for frontend
- [ ] `.dockerignore` files created
- [ ] Images built and tested locally
- [ ] Images tagged with version numbers
- [ ] Images pushed to Docker Hub/registry
- [ ] docker-compose.yml configured for orchestration
- [ ] Local testing with `docker-compose up -d`

## SSL/HTTPS Configuration

- [ ] SSL certificate obtained (Let's Encrypt, AWS Certificate Manager, etc.)
- [ ] Certificate installed on server/platform
- [ ] HTTP traffic redirects to HTTPS
- [ ] Certificate auto-renewal configured
- [ ] Certificate expiration monitoring set up
- [ ] Mixed content warnings resolved

## Monitoring & Logging

### Application Monitoring

- [ ] Health check endpoint configured: `GET /health`
- [ ] Application startup verification
- [ ] Critical path testing (login, create, retrieve, delete)
- [ ] Error tracking configured (Sentry, New Relic, etc.)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured

### Log Configuration

- [ ] Backend logs directed to stdout/file
- [ ] Frontend console errors monitored
- [ ] Database query logs enabled
- [ ] Nginx access/error logs configured
- [ ] Log retention policy set
- [ ] Log analysis tool configured (ELK, Splunk, etc.)

## Security Configuration

### CORS Configuration

- [ ] CORS headers set correctly for frontend domain
- [ ] Credentials allowed if needed (with explicit origin)
- [ ] Preflight requests handled
- [ ] Test CORS with browser tools

### Authentication

- [ ] JWT secret is strong and unique (min 32 chars)
- [ ] JWT expiration time set appropriately
- [ ] Token refresh mechanism working
- [ ] Password hashing algorithm secure (bcrypt)
- [ ] Login endpoint rate limited
- [ ] Session timeout configured

### File Upload Security

- [ ] File upload directory outside web root
- [ ] File type validation implemented
- [ ] File size limits enforced
- [ ] Uploaded files served securely
- [ ] Virus scanning configured (optional)
- [ ] File permissions restricted

### API Security

- [ ] API endpoints require authentication
- [ ] Rate limiting implemented
- [ ] Request validation enabled
- [ ] SQL injection protection (Prisma handles)
- [ ] XSS protection headers set
- [ ] CSRF protection enabled
- [ ] Security headers configured (helmet.js)

### Infrastructure Security

- [ ] Firewall rules configured
- [ ] Database access limited to application only
- [ ] SSH keys secured
- [ ] Admin credentials managed securely (vault/secrets manager)
- [ ] Regular security audits scheduled
- [ ] Dependency vulnerabilities checked (`npm audit`)

## Performance Configuration

### Caching

- [ ] Browser caching headers set for static assets
- [ ] Cache busting configured for versioned files
- [ ] HTTP caching directives optimized
- [ ] CDN configured (Cloudflare, CloudFront, etc.) - optional
- [ ] Database query caching implemented - optional
- [ ] Redis configured for sessions - optional

### Optimization

- [ ] Assets minified (CSS, JavaScript)
- [ ] Images optimized and compressed
- [ ] Code splitting implemented (frontend)
- [ ] Gzip compression enabled
- [ ] Bundle size analyzed and optimized
- [ ] Lazy loading implemented for routes
- [ ] Database indexes created for common queries

### Load Testing

- [ ] Load testing performed with realistic traffic
- [ ] Response times acceptable under load
- [ ] Database connections don't exhaust under load
- [ ] Scaling strategy tested
- [ ] Auto-scaling configured (if applicable)

## Deployment & Rollout

### Pre-Deployment

- [ ] Code review completed
- [ ] All tests passing locally
- [ ] Test environment deployment successful
- [ ] Staging environment matches production
- [ ] Rollback procedure documented
- [ ] Communication plan prepared
- [ ] Maintenance window scheduled if needed

### Deployment Process

- [ ] Database backups taken before deploy
- [ ] Migrations run successfully
- [ ] Application starts without errors
- [ ] Health check passes
- [ ] Smoke tests executed (critical paths)
- [ ] User acceptance testing (UAT) completed
- [ ] Performance verified (no significant degradation)
- [ ] Error rates monitored (should be 0%)

### Post-Deployment

- [ ] All team members notified
- [ ] Documentation updated with new deployment info
- [ ] Monitoring dashboards active
- [ ] Alert notifications configured
- [ ] Support team briefed on changes
- [ ] Logs reviewed for any errors
- [ ] User feedback collected
- [ ] Rollback procedure ready if needed

## Documentation

- [ ] README.md updated with latest setup instructions
- [ ] DEPLOYMENT.md documents all platform-specific steps
- [ ] FRONTEND_DEPLOYMENT.md covers frontend deployment
- [ ] Environment variables documented in .env.example
- [ ] API documentation current
- [ ] Database schema documented
- [ ] Architecture diagram created/updated
- [ ] Runbook created for operational procedures
- [ ] Troubleshooting guide prepared

## Backup & Disaster Recovery

- [ ] Database backups configured (daily minimum)
- [ ] Backup retention policy defined
- [ ] Backup restoration tested
- [ ] Application recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] Disaster recovery plan documented
- [ ] Off-site backup copies maintained
- [ ] Backup encryption enabled

## Team & Handoff

- [ ] Operations team trained on deployment procedures
- [ ] Support team trained on common issues
- [ ] Escalation procedures documented
- [ ] On-call rotation established
- [ ] Contact information updated
- [ ] Emergency procedures defined
- [ ] Knowledge transfer completed
- [ ] Documentation review completed

## Post-Launch Monitoring (First 7 Days)

- [ ] Error rate monitored continuously
- [ ] Performance metrics reviewed
- [ ] User feedback collected
- [ ] Database performance monitored
- [ ] Security logs reviewed for anomalies
- [ ] Server resource utilization checked
- [ ] Backup restoration tested
- [ ] Team debriefing meeting scheduled

---

## Platform-Specific Checklists

### Heroku

```bash
# Verification checklist
heroku logs --tail                          # Check logs
heroku config                               # Verify environment variables
heroku ps                                   # Check processes running
heroku releases                             # View release history
heroku addons                               # Verify add-ons installed
```

### Render

```bash
# Verification checklist
# 1. Check Render dashboard for green status
# 2. View recent deployments in Events
# 3. Check Environment tab for all variables
# 4. Test health endpoint in browser
```

### AWS

```bash
# Verification checklist
curl http://localhost:3000/health          # Test locally
ssh -i key.pem ubuntu@instance-ip           # Connect to instance
pm2 status                                  # Check processes
curl http://localhost/health                # Test through Nginx
```

### Docker

```bash
# Verification checklist
docker ps                                   # Check running containers
docker logs container-id                    # View container logs
docker-compose ps                           # Check docker-compose status
docker-compose logs backend                 # View specific service logs
curl http://localhost:3000/health           # Test health endpoint
```

---

## Sign-Off

- [ ] QA Team: Approved for production
- [ ] Security Team: Security review passed
- [ ] Operations Team: Ready for production
- [ ] Product Owner: Features approved
- [ ] Lead Developer: Code review approved

**Deployment Date**: _______________

**Deployed By**: _______________

**Version**: _______________

**Notes**: _______________________________________________

---

**For assistance, refer to:**
- DEPLOYMENT.md - Backend deployment
- FRONTEND_DEPLOYMENT.md - Frontend deployment
- README.md - General setup
- Platform-specific documentation links provided in respective sections
