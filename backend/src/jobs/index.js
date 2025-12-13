/**
 * Jobs Module
 * Exports all background job functionality
 */

const { 
  executeCleanupJob, 
  getCleanupJobStatus, 
  validateCleanupConfig 
} = require('./cleanupJob');

const { 
  scheduler, 
  initializeScheduler, 
  stopScheduler, 
  getSchedulerStatus,
  triggerCleanupJobManually 
} = require('./scheduler');

module.exports = {
  // Cleanup job functions
  executeCleanupJob,
  getCleanupJobStatus,
  validateCleanupConfig,
  
  // Scheduler functions
  scheduler,
  initializeScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerCleanupJobManually
};
