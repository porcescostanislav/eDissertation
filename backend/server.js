const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { initializePrisma, testDatabaseConnection } = require('./db');
const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const profesorRoutes = require('./routes/profesor');
const studentRoutes = require('./routes/student');
const applicationsRoutes = require('./routes/applications');

// Load environment variables from .env file
dotenv.config();

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
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? FRONTEND_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Professor routes (protected)
app.use('/api/profesor', profesorRoutes);

// Student routes (protected)
app.use('/api/student', studentRoutes);

// Applications routes (protected - professor)
app.use('/api/profesor', applicationsRoutes);

// Database connection test endpoint
app.get('/api/status', async (req, res) => {
  try {
    const isConnected = await testDatabaseConnection();
    res.json({ 
      status: 'Running',
      database: isConnected ? 'Connected' : 'Disconnected'
    });
  } catch (error) {
    res.status(200).json({ 
      status: 'Running',
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ health: 'ok' });
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

// Start server
async function startServer() {
  try {
    console.log('Starting server...');
    
    app.listen(PORT, () => {
      console.log(`✓ Server is running on http://localhost:${PORT}`);
      console.log(`✓ Health endpoint: http://localhost:${PORT}/health`);
      console.log(`✓ Auth endpoints:`);
      console.log(`  - POST /api/auth/register`);
      console.log(`  - POST /api/auth/login`);
      console.log(`✓ Professor endpoints (protected):`);
      console.log(`  - POST /api/profesor/sessions (create session)`);
      console.log(`  - GET /api/profesor/sessions (list sessions)`);
      console.log(`  - GET /api/profesor/sessions/:id (get session)`);
      console.log(`  - PUT /api/profesor/sessions/:id (update session)`);
      console.log(`  - DELETE /api/profesor/sessions/:id (delete session)`);
      console.log(`✓ Professor application endpoints (protected):`);
      console.log(`  - GET /api/profesor/applications (list applications)`);
      console.log(`  - GET /api/profesor/applications/:id (get application)`);
      console.log(`  - PATCH /api/profesor/applications/:id/approve (approve)`);
      console.log(`  - PATCH /api/profesor/applications/:id/reject (reject)`);
      console.log(`✓ Student endpoints (protected):`);
      console.log(`  - POST /api/student/applications (submit application)`);
      console.log(`  - GET /api/student/applications (list applications)`);
      console.log(`  - GET /api/student/applications/:id (get application)`);
      console.log(`  - GET /api/student/sessions (list available sessions)`);
      console.log(`  - POST /api/student/applications/:id/upload-signed (upload signed file)`);
      console.log(`✓ Protected endpoint: GET /api/me (requires auth)`);
    });

    // Try to initialize Prisma (non-blocking)
    console.log('\nAttempting database connection...');
    await initializePrisma();
  } catch (error) {
    console.log('⚠ Database connection failed (server will run without database)');
    console.log('Error:', error.message);
  }
}

startServer();
