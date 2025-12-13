/**
 * Job Scheduler
 * Initializes and manages scheduled background tasks
 * 
 * Manages:
 * - File cleanup job (daily at midnight)
 * - Job start/stop lifecycle
 * - Error handling and recovery
 */

const cron = require('node-cron');
const { executeCleanupJob, getCleanupJobStatus } = require('./cleanupJob');

/**
 * Scheduler instance and configuration
 */
class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize all scheduled jobs
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('[SCHEDULER] Initializing job scheduler...');

      // Schedule cleanup job to run daily at midnight (00:00)
      this.scheduleCleanupJob();

      this.isRunning = true;
      console.log('[SCHEDULER] Job scheduler initialized successfully');
      
      return {
        status: 'initialized',
        jobs: Array.from(this.jobs.keys()),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[SCHEDULER] Failed to initialize job scheduler', error);
      throw error;
    }
  }

  /**
   * Schedule the file cleanup job
   * Runs daily at 00:00 (midnight)
   */
  scheduleCleanupJob() {
    try {
      // Schedule to run at 00:00 (midnight) every day
      // Cron pattern: "0 0 * * *" = midnight daily
      const cleanupJob = cron.schedule('0 0 * * *', async () => {
        console.log('[SCHEDULER] Starting scheduled cleanup job...');
        
        try {
          const result = await executeCleanupJob();
          console.log('[SCHEDULER] Cleanup job completed', {
            status: result.status,
            filesDeleted: result.totalFilesDeleted,
            duration: `${result.duration}ms`
          });
        } catch (error) {
          console.error('[SCHEDULER] Cleanup job failed', error);
        }
      });

      // Store job reference
      this.jobs.set('cleanup', {
        task: cleanupJob,
        schedule: '0 0 * * * (midnight daily)',
        description: 'Cleanup old dissertation files',
        createdAt: new Date()
      });

      console.log('[SCHEDULER] Cleanup job scheduled to run daily at 00:00 (midnight)');
    } catch (error) {
      console.error('[SCHEDULER] Failed to schedule cleanup job', error);
      throw error;
    }
  }

  /**
   * Manually trigger cleanup job (for testing/maintenance)
   * @returns {Promise<Object>} Cleanup job result
   */
  async triggerCleanupJob() {
    try {
      console.log('[SCHEDULER] Manually triggering cleanup job...');
      const result = await executeCleanupJob();
      console.log('[SCHEDULER] Manual cleanup job completed', {
        status: result.status,
        filesDeleted: result.totalFilesDeleted
      });
      return result;
    } catch (error) {
      console.error('[SCHEDULER] Manual cleanup job failed', error);
      throw error;
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    try {
      console.log('[SCHEDULER] Stopping job scheduler...');
      
      for (const [jobName, jobData] of this.jobs.entries()) {
        jobData.task.stop();
        console.log(`[SCHEDULER] Job stopped: ${jobName}`);
      }

      this.isRunning = false;
      console.log('[SCHEDULER] Job scheduler stopped');
    } catch (error) {
      console.error('[SCHEDULER] Error stopping job scheduler', error);
      throw error;
    }
  }

  /**
   * Get scheduler status and job information
   * @returns {Object} Scheduler status and active jobs
   */
  getStatus() {
    const jobsList = [];
    
    for (const [name, job] of this.jobs.entries()) {
      jobsList.push({
        name,
        schedule: job.schedule,
        description: job.description,
        createdAt: job.createdAt,
        running: this.isRunning
      });
    }

    return {
      schedulerRunning: this.isRunning,
      jobsCount: this.jobs.size,
      jobs: jobsList,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const scheduler = new JobScheduler();

// Export the scheduler instance and utilities
module.exports = {
  scheduler,
  initializeScheduler: () => scheduler.initialize(),
  stopScheduler: () => scheduler.stop(),
  getSchedulerStatus: () => scheduler.getStatus(),
  triggerCleanupJobManually: () => scheduler.triggerCleanupJob()
};
