const express = require('express');
const { initializePrisma, testDatabaseConnection } = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Start server
async function startServer() {
  try {
    console.log('Starting server...');
    
    app.listen(PORT, () => {
      console.log(`✓ Server is running on http://localhost:${PORT}`);
      console.log(`✓ API Status endpoint: http://localhost:${PORT}/api/status`);
      console.log(`✓ Health endpoint: http://localhost:${PORT}/health`);
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
