const express = require('express');
const { initializePrisma, testDatabaseConnection } = require('./db');
const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const profesorRoutes = require('./routes/profesor');
const studentRoutes = require('./routes/student');

const app = express();
const PORT = 3000;

app.use(express.json());

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Professor routes (protected)
app.use('/api/profesor', profesorRoutes);

// Student routes (protected)
app.use('/api/student', studentRoutes);

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
      console.log(`✓ Student endpoints (protected):`);
      console.log(`  - POST /api/student/applications (submit application)`);
      console.log(`  - GET /api/student/applications (list applications)`);
      console.log(`  - GET /api/student/applications/:id (get application)`);
      console.log(`  - GET /api/student/sessions (list available sessions)`);
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
