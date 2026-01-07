const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { initializePrisma, testDatabaseConnection } = require('./db');
const { authMiddleware } = require('./middleware/auth');
const { initializeScheduler } = require('./src/jobs');

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure CORS based on environment
const corsOrigins = NODE_ENV === 'production' 
  ? FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes - case-sensitive paths
const authRoutes = require('./routes/auth');
const profesorRoutes = require('./routes/profesor');
const studentRoutes = require('./routes/student');
const applicationsRoutes = require('./routes/applications');
const adminJobsRoutes = require('./src/routes/admin-jobs');

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Professor routes (protected)
app.use('/api/profesor', profesorRoutes);

// Student routes (protected)
app.use('/api/student', studentRoutes);

// Applications routes (protected - professor)
app.use('/api/profesor', applicationsRoutes);

// Admin jobs management routes (protected)
app.use('/api/admin/jobs', adminJobsRoutes);

// Database connection test endpoint
app.get('/api/status', async (req, res) => {
  try {
    const isConnected = await testDatabaseConnection();
    res.json({ 
      status: 'Running',
      database: isConnected ? 'Connected' : 'Disconnected',
      environment: NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(200).json({ 
      status: 'Running',
      database: 'Disconnected',
      environment: NODE_ENV,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint (for Heroku router)
app.get('/health', (req, res) => {
  res.json({ health: 'ok', timestamp: new Date().toISOString() });
});

// Protected route example
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    error: NODE_ENV === 'production' ? undefined : err
  });
});

// Start server with graceful shutdown
let server;

async function startServer() {
  try {
    console.log('🚀 Starting server...');
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🔌 Port: ${PORT}`);
    
    // Try to initialize Prisma (non-blocking)
    console.log('\n🗄️  Attempting database connection...');
    try {
      await initializePrisma();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.warn('⚠️  Database connection failed:', error.message);
      console.log('   Server will continue running without database');
    }

    server = app.listen(PORT, '0.0.0.0', async () => {
      console.log(`\n✅ Server is running on http://0.0.0.0:${PORT}`);
      console.log(`📍 Health check: GET http://localhost:${PORT}/health`);
      console.log(`📊 Status endpoint: GET http://localhost:${PORT}/api/status`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`  Auth (public):`);
      console.log(`    - POST /api/auth/register`);
      console.log(`    - POST /api/auth/login`);
      console.log(`  Professor (protected):`);
      console.log(`    - POST /api/profesor/sessions`);
      console.log(`    - GET /api/profesor/sessions`);
      console.log(`    - GET /api/profesor/sessions/:id`);
      console.log(`    - PUT /api/profesor/sessions/:id`);
      console.log(`    - DELETE /api/profesor/sessions/:id`);
      console.log(`  Applications (protected):`);
      console.log(`    - GET /api/profesor/applications`);
      console.log(`    - GET /api/profesor/applications/:id`);
      console.log(`    - PATCH /api/profesor/applications/:id/approve`);
      console.log(`    - PATCH /api/profesor/applications/:id/reject`);
      console.log(`  Student (protected):`);
      console.log(`    - POST /api/student/applications`);
      console.log(`    - GET /api/student/applications`);
      console.log(`    - GET /api/student/applications/:id`);
      console.log(`    - GET /api/student/sessions`);
      console.log(`    - POST /api/student/applications/:id/upload-signed`);
      console.log(`  Admin Jobs (protected):`);
      console.log(`    - GET /api/admin/jobs/status`);
      console.log(`    - GET /api/admin/jobs/cleanup/status`);
      console.log(`    - GET /api/admin/jobs/cleanup/validate`);
      console.log(`    - POST /api/admin/jobs/cleanup/trigger\n`);

      // Initialize background job scheduler after server starts
      try {
        console.log('⏰ Initializing background job scheduler...');
        await initializeScheduler();
        console.log('✅ Background job scheduler initialized successfully\n');
      } catch (error) {
        console.warn('⚠️  Failed to initialize scheduler:', error.message);
        console.log('   Cleanup jobs will not execute automatically\n');
      }
    });
  } catch (error) {
    console.error('❌ Fatal error starting server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('Server closed');
      process.exit(0);
    });
    // Force exit after 30 seconds
    setTimeout(() => {
      console.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();