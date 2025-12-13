/**
 * Admin Jobs API Routes
 * 
 * Protected endpoints for managing background jobs
 * Only accessible to authenticated users (can be extended to admin role)
 * 
 * Endpoints:
 * - GET /api/admin/jobs/status - Get scheduler status
 * - POST /api/admin/jobs/cleanup/trigger - Manually trigger cleanup
 * - GET /api/admin/jobs/cleanup/status - Get cleanup job configuration
 * - GET /api/admin/jobs/cleanup/validate - Validate cleanup configuration
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  initializeScheduler,
  getSchedulerStatus,
  triggerCleanupJobManually,
  getCleanupJobStatus,
  validateCleanupConfig,
  executeCleanupJob
} = require('../jobs');

/**
 * Middleware: Optional admin role check (can be extended based on requirements)
 * For now, just require authentication
 */
const adminCheck = (req, res, next) => {
  // TODO: Add role-based access control
  // For now, any authenticated user can access these endpoints
  // You can extend this to check for an 'admin' or 'profesor' role
  next();
};

/**
 * GET /api/admin/jobs/status
 * Get overall scheduler status
 */
router.get('/status', authMiddleware, adminCheck, (req, res) => {
  try {
    const status = getSchedulerStatus();
    
    res.json({
      success: true,
      message: 'Scheduler status retrieved',
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/jobs/cleanup/status
 * Get cleanup job configuration and status
 */
router.get('/cleanup/status', authMiddleware, adminCheck, (req, res) => {
  try {
    const status = getCleanupJobStatus();
    
    res.json({
      success: true,
      message: 'Cleanup job status retrieved',
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cleanup job status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/jobs/cleanup/validate
 * Validate cleanup job configuration
 */
router.get('/cleanup/validate', authMiddleware, adminCheck, (req, res) => {
  try {
    const validation = validateCleanupConfig();
    
    res.json({
      success: true,
      message: 'Cleanup configuration validated',
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate cleanup configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/admin/jobs/cleanup/trigger
 * Manually trigger cleanup job (for testing/maintenance)
 * 
 * Query parameters:
 * - uploadDir: Optional. Override the uploads directory path.
 */
router.post('/cleanup/trigger', authMiddleware, adminCheck, async (req, res) => {
  try {
    const { uploadDir } = req.query;

    console.log('[API] Manual cleanup job triggered', {
      user: req.user?.id,
      uploadDir: uploadDir || 'default'
    });

    // Trigger cleanup job
    const result = await triggerCleanupJobManually();

    res.json({
      success: true,
      message: 'Cleanup job triggered and completed successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Manual cleanup job failed', error);

    res.status(500).json({
      success: false,
      error: 'Failed to trigger cleanup job',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/admin/jobs/initialize
 * Initialize the job scheduler (call on server startup)
 * Mainly for testing - normally called automatically in server.js
 */
router.post('/initialize', authMiddleware, adminCheck, async (req, res) => {
  try {
    console.log('[API] Job scheduler initialization requested');
    
    const result = await initializeScheduler();

    res.json({
      success: true,
      message: 'Job scheduler initialized successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Job scheduler initialization failed', error);

    res.status(500).json({
      success: false,
      error: 'Failed to initialize job scheduler',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
