# eDissertation - Dissertation Application Management System

![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-16+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📋 Project Description

**eDissertation** is a comprehensive web-based system designed to streamline the dissertation application and approval process in academic institutions. The platform facilitates efficient communication between students and professors, enabling seamless management of dissertation submissions, document approvals, and feedback exchanges.

### ✨ Key Features

- 👨‍🎓 **Student Dashboard**: Browse sessions, submit applications, upload signed documents, track approval status
- 👨‍🏫 **Professor Dashboard**: Manage sessions, review applications, approve/reject submissions, upload responses
- ⚡ **Real-Time Updates**: Live enrollment counts and status updates without page refreshes
- 📄 **File Management**: Secure PDF upload/download for dissertations and feedback documents
- 🎯 **Session Management**: Create, view, and terminate dissertation enrollment sessions with capacity limits
- 🔐 **Authentication**: Role-based JWT token authentication with secure password hashing
- 🔄 **Multi-Stage Workflow**:
  - Student applies to session
  - Professor approves/rejects application
  - Student uploads signed dissertation (if approved)
  - Professor reviews and uploads response document

---

## 🛠 Technologies Used

### Frontend Stack
- **React 18+** - Modern UI library with Hooks
- **Chakra UI** - Component library for accessible, consistent design
- **React Router** - Client-side routing and navigation
- **Axios** - Promise-based HTTP client
- **Vite** - Fast build tool with HMR
- **JavaScript (ES6+)** - Modern JavaScript with async/await

### Backend Stack
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework for REST APIs
- **Prisma ORM** - Type-safe database access
- **MySQL 8.0+** - Relational database
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Database
- **MySQL** - Primary data store
- **Prisma Migrations** - Database version control

---

## 🚀 Quick Start

### Prerequisites

Ensure you have installed:
- **Node.js** (v16 or higher)
- **npm** (v7+)
- **MySQL Server** (v8.0+)
- **Git** (optional, for cloning)

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cat > .env << EOF
PORT=3000
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/edissertation_db"
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRE=7d
EOF

# 4. Setup database
npx prisma migrate dev --name init

# 5. Create uploads directory
mkdir -p uploads

# 6. Start server
npm start
# Server runs on http://localhost:3000
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### First Login

1. Go to `http://localhost:5173`
2. Click **Register**
3. Choose role: **Student** or **Profesor**
4. Fill in details and submit
5. Login with your credentials

---

## 📁 Project Structure

```
eDissertation/
├── backend/
│   ├── routes/              # API endpoints
│   │   ├── auth.js         # Authentication
│   │   ├── profesor.js     # Professor endpoints
│   │   ├── student.js      # Student endpoints
│   │   └── applications.js # Application management
│   ├── middleware/
│   │   └── auth.js         # JWT verification
│   ├── utils/
│   │   └── auth.js         # Crypto utilities
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.js         # Test data
│   ├── uploads/            # User-uploaded files
│   ├── server.js           # Express app setup
│   ├── db.js              # Prisma initialization
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProfesorDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API calls
│   │   ├── utils/         # Helpers
│   │   ├── App.jsx        # Main component
│   │   └── main.jsx       # Entry point
│   ├── dist/              # Production build
│   ├── vite.config.js
│   └── package.json
│
├── database.sql           # SQL schema (optional)
└── README.md             # This file
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/me` | Get current user (requires token) |

### Professor Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/profesor/sessions` | Create session |
| GET | `/api/profesor/sessions` | List sessions |
| DELETE | `/api/profesor/sessions/:id` | Delete session |
| GET | `/api/profesor/sessions/:id/enrolled-students` | Get enrolled students |
| GET | `/api/profesor/applications?status=pending` | Get pending applications |
| PATCH | `/api/profesor/applications/:id/approve` | Approve application |
| PATCH | `/api/profesor/applications/:id/reject` | Reject application |
| PATCH | `/api/profesor/applications/:id/un-approve` | Un-approve application |
| POST | `/api/profesor/applications/:id/upload-response` | Upload response PDF |

### Student Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/sessions` | Get available sessions |
| POST | `/api/student/applications` | Submit application |
| GET | `/api/student/applications` | List applications |
| POST | `/api/student/applications/:id/upload-signed` | Upload signed file |

---

## 🌐 Deployment

### Heroku (Recommended for Quick Start)

```bash
# Install Heroku CLI
# Backend deployment
heroku create edissertation-api
heroku addons:create jawsdb:kitefin
heroku config:set JWT_SECRET=your_secret
git subtree push --prefix backend heroku main

# Run migrations
heroku run "npx prisma migrate deploy"

# Frontend deployment
heroku create edissertation-web
git subtree push --prefix frontend heroku main
```

### Azure

```bash
# Create resource group
az group create --name edissertation --location eastus

# Create App Service
az appservice plan create --name edissertation-plan \
  --resource-group edissertation --sku B1 --is-linux

# Create web app
az webapp create --resource-group edissertation \
  --plan edissertation-plan --name edissertation-backend \
  --runtime "node|16-lts"

# Configure database
az webapp config appsettings set \
  --resource-group edissertation \
  --name edissertation-backend \
  --settings DATABASE_URL="mysql://..." JWT_SECRET="..."
```

### AWS (EC2 + RDS)

```bash
# Launch EC2 instance (Ubuntu 20.04+)
# Create RDS MySQL database
# Install Node.js and dependencies

ssh ec2-user@your-instance
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs

# Clone and setup
git clone <repo>
cd eDissertation/backend
npm install
echo "DATABASE_URL=..." > .env
npx prisma migrate deploy
npm start

# Install PM2 for process management
sudo npm install -g pm2
pm2 start server.js --name api
pm2 startup
pm2 save
```

### Self-Hosted (VPS/Dedicated Server)

```bash
# SSH to server
ssh root@your-server-ip

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt update && sudo apt install nodejs mysql-server nginx -y

# Clone repository
cd /var/www
git clone <repo>

# Setup backend
cd eDissertation/backend
npm install
echo "DATABASE_URL=..." > .env
npx prisma migrate deploy

# Setup frontend
cd ../frontend
npm install
npm run build

# Configure Nginx as reverse proxy
sudo systemctl enable nginx
sudo systemctl start nginx

# Start backend with PM2
sudo npm install -g pm2
pm2 start server.js --name api
pm2 save
```

### Environment Variables

**Backend .env**
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=mysql://user:pass@db-host:3306/db_name
JWT_SECRET=very_long_secure_random_string
JWT_EXPIRE=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

**Frontend .env** (if needed)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Production Checklist

- [ ] Use HTTPS (SSL certificates)
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configure CORS properly
- [ ] Enable database backups
- [ ] Setup monitoring (e.g., PM2 Plus, Datadog)
- [ ] Configure logging
- [ ] Set rate limiting on endpoints
- [ ] Regular security updates
- [ ] Setup automated deployments (GitHub Actions)

---

## 📖 Development Guide

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Test locally: `npm run dev` (both backend and frontend)
4. Commit: `git commit -m "Add: description"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

### Database Changes

1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Test locally
4. Commit schema and migration files
5. Deploy: `npx prisma migrate deploy`

### Code Quality

```bash
# Backend linting (if configured)
npm run lint

# Frontend linting (if configured)
npm run lint

# Run tests (if configured)
npm test
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Check database connection
mysql -u root -p edissertation_db
```

### Database Connection Error

```bash
# Verify MySQL is running
sudo systemctl status mysql

# Check .env DATABASE_URL
cat .env

# Test connection
npx prisma db push
```

### Frontend Can't Connect to Backend

```bash
# Verify backend is running
curl http://localhost:3000

# Check browser console for CORS errors
# Verify VITE_API_BASE_URL in .env (frontend)
```

### Clear Node Cache

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules dist package-lock.json
npm install
```

---

## 📚 Useful Commands

```bash
# Backend
npm start              # Start production server
npm run dev            # Start with nodemon (auto-reload)
npx prisma studio    # Open Prisma database viewer
npx prisma migrate dev --name <name>  # Create migration
npx prisma db seed   # Seed test data

# Frontend
npm run dev           # Start dev server with HMR
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run linter (if configured)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

This project is provided for educational and institutional use.

---

## 📞 Support

- 📧 For issues: Create an issue in the repository
- 📖 Check existing documentation in backend/ and frontend/
- 🔗 Refer to framework docs:
  - [React Documentation](https://react.dev)
  - [Express.js Guide](https://expressjs.com)
  - [Prisma Documentation](https://www.prisma.io/docs)
  - [Chakra UI Components](https://chakra-ui.com)

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintainer**: eDissertation Team
