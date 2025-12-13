# eDissertation - Dissertation Application Management System

## Project Description

**eDissertation** is a comprehensive web-based system designed to streamline the dissertation application and approval process in academic institutions. The platform facilitates communication between students and professors, enabling efficient management of dissertation submissions, approvals, and document exchanges.

### Key Features

- **Student Dashboard**: Browse available dissertation sessions, submit applications, and upload signed documents
- **Professor Dashboard**: Manage sessions, review applications, approve/reject submissions, and upload feedback documents
- **Real-Time Status Tracking**: Applications display live enrollment counts and status updates without page refreshes
- **File Management**: Secure upload and download of PDF documents (unsigned templates, signed dissertations, professor responses)
- **Session Management**: Create, view, and terminate dissertation enrollment sessions with capacity limits
- **Authentication**: Role-based access control with JWT token authentication
- **Multi-Stage Workflow**: 
  - Student applies to session
  - Professor approves/rejects application
  - Student uploads signed dissertation (if approved)
  - Professor reviews and uploads response document

### Target Users

- **Students**: Submit dissertation applications and track approval status
- **Professors**: Manage multiple dissertation sessions and student applications

---

## Technologies Used

### Frontend
- **React 18+** - UI library for building interactive user interfaces
- **Chakra UI** - Component library for consistent, accessible design
- **React Router** - Client-side routing and navigation
- **Axios** - HTTP client for API communication
- **Vite** - Fast build tool and development server
- **JavaScript (ES6+)** - Modern JavaScript with async/await support

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework for REST API development
- **Prisma ORM** - Modern database ORM for type-safe queries
- **MySQL** - Relational database for data persistence
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcrypt** - Password hashing and security
- **Multer** - File upload middleware
- **CORS** - Cross-origin resource sharing configuration

### Database
- **MySQL 8.0+** - Relational database
- **Prisma Schema** - Database schema definition and migrations

### Development Tools
- **npm** - Package manager
- **Git** - Version control
- **Prisma Client** - Database access layer

---

## Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14+ recommended, preferably v16 or higher)
- **npm** (v6+)
- **MySQL Server** (v8.0+)
- **Git** (for version control)

### Backend Installation & Setup

#### 1. Clone Repository

```bash
git clone https://github.com/porcescostanislav/eDissertation.git
cd eDissertation/backend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/edissertation_db"

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

**Important**: Replace `username`, `password`, and `your_super_secret_jwt_key_change_this_in_production` with your actual MySQL credentials and a secure secret.

#### 4. Database Setup & Migrations

**Option A: Using Prisma Migrations**

```bash
# Generate migration files based on schema
npx prisma migrate dev --name init

# This will:
# - Create the database (if it doesn't exist)
# - Create all tables defined in schema.prisma
# - Generate Prisma Client
```

**Option B: Manual Database Creation**

```bash
# Create database manually
mysql -u root -p

# In MySQL:
CREATE DATABASE edissertation_db;
USE edissertation_db;

# Then run migrations
npx prisma migrate dev --name init
```

#### 5. Seed Database (Optional)

To populate the database with test data:

```bash
npx prisma db seed
```

This runs the seed script defined in `prisma/seed.js` (if available).

#### 6. Create Upload Directory

```bash
mkdir -p uploads
```

#### 7. Start Backend Server

```bash
npm start
```

Expected output:
```
✓ Database connection successful!
Server running on http://localhost:3000
```

The backend API will be available at `http://localhost:3000`

### Frontend Installation & Setup

#### 1. Navigate to Frontend Directory

```bash
cd ../frontend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `frontend/` directory (optional - default uses localhost):

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

#### 4. Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

The frontend will be available at `http://localhost:5173`

#### 5. Build for Production

```bash
npm run build
```

This generates an optimized production build in the `dist/` directory.

### Verify Installation

#### Backend Health Check

```bash
curl http://localhost:3000/api/me
# Should return 401 (no token) but indicates server is running
```

#### Frontend Access

Open `http://localhost:5173` in your browser. You should see the login page.

### First-Time Usage

1. **Register as a Student**:
   - Click "Register" on login page
   - Select "Student" role
   - Fill in name, email, and password
   - Click register

2. **Register as a Professor**:
   - Click "Register" on login page
   - Select "Profesor" role
   - Fill in name, email, password, and student limit
   - Click register

3. **Login**:
   - Use registered email and password
   - You'll be redirected to appropriate dashboard (student or professor)

---

## Project Structure

### Backend Structure

```
backend/
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── profesor.js          # Professor endpoints (sessions, approvals)
│   ├── student.js           # Student endpoints (applications, uploads)
│   └── applications.js      # Application management endpoints
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── utils/
│   └── auth.js              # Password hashing, token generation
├── prisma/
│   ├── schema.prisma        # Database schema definition
│   └── seed.js              # Database seeding script
├── server.js                # Express server setup
├── db.js                    # Prisma client initialization
└── package.json             # Backend dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx        # Login/Register page
│   │   ├── ProfesorDashboard.jsx # Professor interface
│   │   └── StudentDashboard.jsx  # Student interface
│   ├── components/
│   │   ├── InputField.jsx        # Reusable input component
│   │   ├── PrimaryButton.jsx     # Reusable button component
│   │   └── index.js              # Component exports
│   ├── services/
│   │   ├── authService.js        # Authentication API calls
│   │   ├── profesorService.js    # Professor API calls
│   │   └── studentService.js     # Student API calls
│   ├── utils/
│   │   └── validation.js         # Form validation utilities
│   ├── App.jsx                   # Main app component
│   └── main.jsx                  # React entry point
└── package.json                  # Frontend dependencies
```

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/me` - Get current user info (requires auth)

### Professor Routes
- `POST /api/profesor/sessions` - Create new session
- `GET /api/profesor/sessions` - List professor's sessions
- `DELETE /api/profesor/sessions/:id` - Delete session
- `GET /api/profesor/sessions/:id/enrolled-students` - Get enrolled students
- `GET /api/profesor/applications?status=pending` - Get pending applications
- `PATCH /api/profesor/applications/:id/approve` - Approve application
- `PATCH /api/profesor/applications/:id/reject` - Reject application
- `PATCH /api/profesor/applications/:id/un-approve` - Reject approved application
- `POST /api/profesor/applications/:id/upload-response` - Upload response document

### Student Routes
- `GET /api/student/sessions` - Get available sessions
- `POST /api/student/applications` - Submit application
- `GET /api/student/applications` - List student's applications
- `POST /api/student/applications/:id/upload-signed` - Upload signed dissertation

### Applications Routes
- `GET /api/applications/:id/unsigned-template` - Download template for signing

---

## Deployment

### General Deployment Steps

#### 1. Prepare for Deployment

```bash
# Ensure all tests pass
npm test  # (if tests are configured)

# Build frontend
cd frontend
npm run build
cd ..

# Update environment variables for production
# Edit .env files with production database and secrets
```

#### 2. Choose Deployment Platform

### Option A: Heroku Deployment

#### Prerequisites
- Heroku CLI installed
- Heroku account
- Git initialized

#### Backend Deployment

```bash
# 1. Create Heroku app
heroku create edissertation-backend

# 2. Add MySQL database (using JawsDB or ClearDB)
heroku addons:create jawsdb:kitefin

# 3. Set environment variables
heroku config:set JWT_SECRET=your_production_secret
heroku config:set NODE_ENV=production

# 4. Deploy backend
git subtree push --prefix backend heroku main

# 5. Run migrations on Heroku
heroku run "npx prisma migrate deploy"

# 6. Check logs
heroku logs --tail
```

#### Frontend Deployment (with Backend Proxy)

```bash
# 1. Create Heroku app
heroku create edissertation-frontend

# 2. Deploy frontend
git subtree push --prefix frontend heroku main

# 3. Set API URL
heroku config:set VITE_API_BASE_URL=https://edissertation-backend.herokuapp.com/api
```

### Option B: Azure Deployment

#### Prerequisites
- Azure CLI installed
- Azure account
- Resource group created

#### Backend Deployment

```bash
# 1. Create App Service
az appservice plan create \
  --name edissertation-plan \
  --resource-group your-resource-group \
  --sku B1 --is-linux

# 2. Create web app
az webapp create \
  --resource-group your-resource-group \
  --plan edissertation-plan \
  --name edissertation-backend \
  --runtime "node|16-lts"

# 3. Configure database connection
az webapp config appsettings set \
  --resource-group your-resource-group \
  --name edissertation-backend \
  --settings DATABASE_URL="mysql://..." JWT_SECRET="your_secret"

# 4. Deploy using Git
az webapp deployment source config-local-git \
  --resource-group your-resource-group \
  --name edissertation-backend

git remote add azure <deployment-url>
git subtree push --prefix backend azure main
```

#### Frontend Deployment (Azure Static Web Apps)

```bash
# 1. Create static web app
az staticwebapp create \
  --name edissertation-frontend \
  --resource-group your-resource-group \
  --source https://github.com/your-repo \
  --branch main \
  --location "westus2"

# 2. Configure build settings in GitHub Actions (auto-generated)
# The frontend will build automatically from GitHub
```

### Option C: AWS Deployment

#### Prerequisites
- AWS CLI configured
- AWS account with EC2/Elastic Beanstalk access

#### Backend Deployment (Elastic Beanstalk)

```bash
# 1. Initialize Elastic Beanstalk
eb init -p node.js edissertation-backend

# 2. Create environment
eb create edissertation-backend-env

# 3. Configure environment variables
eb setenv DATABASE_URL="mysql://..." JWT_SECRET="your_secret"

# 4. Deploy
eb deploy

# 5. Check logs
eb logs
```

#### RDS Database Setup

```bash
# 1. Create RDS MySQL instance via AWS Console
# 2. Note the endpoint, username, password
# 3. Update DATABASE_URL in Elastic Beanstalk environment

# 4. Run migrations
eb ssh
cd /var/app/current
npx prisma migrate deploy
```

#### Frontend Deployment (S3 + CloudFront)

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Create S3 bucket
aws s3 mb s3://edissertation-frontend

# 3. Upload build files
aws s3 sync dist/ s3://edissertation-frontend --delete

# 4. Create CloudFront distribution (via AWS Console)
# Point to S3 bucket as origin
```

### Option D: Self-Hosted (VPS/Dedicated Server)

#### Prerequisites
- VPS with Ubuntu 20.04+
- SSH access
- Domain name (optional)

#### Setup Steps

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MySQL
sudo apt-get install -y mysql-server

# 4. Install Nginx (reverse proxy)
sudo apt-get install -y nginx

# 5. Clone repository
cd /var/www
git clone https://github.com/your-repo/eDissertation.git
cd eDissertation

# 6. Setup backend
cd backend
npm install
echo "DATABASE_URL=mysql://..." > .env
echo "JWT_SECRET=..." >> .env
npx prisma migrate deploy

# 7. Setup frontend
cd ../frontend
npm install
npm run build

# 8. Configure Nginx
# Copy Nginx config (example below)
sudo systemctl restart nginx

# 9. Start backend with PM2
sudo npm install -g pm2
cd ../backend
pm2 start index.js --name "edissertation-api"
pm2 startup
pm2 save
```

#### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (React app)
    location / {
        root /var/www/eDissertation/frontend/dist;
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
        alias /var/www/eDissertation/backend/uploads/;
    }
}
```

### Environment Variables for Production

Create production `.env` files:

**Backend Production .env**
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=mysql://produser:securepass@prod-db-host:3306/edissertation_prod
JWT_SECRET=long_secure_random_string_min_32_chars
JWT_EXPIRE=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

**Frontend Production .env**
```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

### Security Checklist for Production

- [ ] Change all default passwords
- [ ] Use HTTPS (SSL certificates via Let's Encrypt)
- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configure CORS properly (restrict origins)
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules
- [ ] Use environment-specific variables
- [ ] Enable rate limiting on API endpoints
- [ ] Implement request validation
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Regular security updates for dependencies

### Post-Deployment

```bash
# Verify backend is running
curl https://yourdomain.com/api/me

# Check frontend loads
# Open https://yourdomain.com in browser

# Monitor logs
# Set up log aggregation (e.g., CloudWatch, Datadog, LogRocket)

# Database backups
# Schedule automated backups of MySQL database
```

---

## Troubleshooting

### Backend Issues

**Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
- Verify MySQL is running: `sudo systemctl status mysql`
- Check DATABASE_URL in .env
- Ensure database exists: `mysql -u root -p edissertation_db`

**Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
- Change PORT in .env or kill process: `lsof -ti:3000 | xargs kill -9`

**Prisma Migration Issues**
```
Prisma error during migration
```
- Check database connection
- Drop and recreate database: `npx prisma migrate reset`
- Ensure schema.prisma is valid

### Frontend Issues

**Cannot Connect to Backend**
- Check backend is running: `curl http://localhost:3000`
- Verify API_BASE_URL in .env
- Check browser console for CORS errors
- Verify backend CORS settings

**Build Fails**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf dist node_modules/.vite`
- Check Node version: `node --version` (should be v14+)

---

## Development Workflow

### Creating New Features

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes in backend/frontend
3. Test locally with `npm run dev` (both)
4. Commit: `git commit -am "description"`
5. Push: `git push origin feature/feature-name`
6. Create Pull Request

### Database Changes

1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Test migration locally
4. Commit schema and migration files
5. On deployment: `npx prisma migrate deploy`

---

## Performance Optimization Tips

- **Frontend**: 
  - Enable code splitting in Vite
  - Use React.memo for expensive components
  - Implement lazy loading for routes

- **Backend**:
  - Add database indexes on frequently queried fields
  - Implement API response caching
  - Use connection pooling for database

- **Database**:
  - Regular VACUUM and ANALYZE commands
  - Optimize slow queries
  - Archive old application records

---

## Support & Documentation

For more information:
- Backend routes documentation: See `backend/` folder README files
- Frontend components: Check JSDoc comments in component files
- Prisma docs: https://www.prisma.io/docs/
- React docs: https://react.dev
- Chakra UI docs: https://chakra-ui.com/docs

---

## License

This project is provided as-is for educational and institutional use.

---

## Contact

For issues or questions:
- Create an issue in the repository
- Contact development team
- Check existing documentation

---

**Last Updated**: December 2025
**Version**: 1.0.0
