/**
 * File Cleanup Job
 * Scheduled task to remove uploaded files associated with outdated dissertation requests
 * 
 * Purpose:
 * - Automatically delete files from disk that are no longer needed
 * - Update database records to remove file references
 * - Manage disk space efficiently
 * 
 * Execution: Daily at midnight (configurable)
 * 
 * Logic:
 * 1. Query database for completed requests (approved/rejected)
 * 2. Filter requests where session end date > 90 days ago
 * 3. Extract file paths from database records
 * 4. Delete files from filesystem with proper error handling
 * 5. Update database records to NULL file references
 * 6. Log results and metrics
 */

const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Configuration for cleanup job
 */
const CLEANUP_CONFIG = {
  GRACE_PERIOD_DAYS: 90,
  TARGET_STATUSES: ['approved', 'rejected'],
  BATCH_SIZE: 100, // Process records in batches to avoid memory issues
  LOG_LEVEL: process.env.CLEANUP_LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
};

/**
 * Logger utility for cleanup job
 */
class CleanupLogger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  shouldLog(level) {
    return this.levels[level] >= this.levels[this.level];
  }

  debug(message, data = {}) {
    if (this.shouldLog('debug')) {
      console.log(`[CLEANUP DEBUG] ${message}`, data);
    }
  }

  info(message, data = {}) {
    if (this.shouldLog('info')) {
      console.log(`[CLEANUP INFO] ${message}`, data);
    }
  }

  warn(message, data = {}) {
    if (this.shouldLog('warn')) {
      console.warn(`[CLEANUP WARN] ${message}`, data);
    }
  }

  error(message, error) {
    if (this.shouldLog('error')) {
      console.error(`[CLEANUP ERROR] ${message}`, error);
    }
  }
}

const logger = new CleanupLogger(CLEANUP_CONFIG.LOG_LEVEL);

/**
 * Calculate grace period cutoff date
 * @returns {Date} Date from 90 days ago
 */
function getGracePeriodCutoff() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CLEANUP_CONFIG.GRACE_PERIOD_DAYS);
  return cutoff;
}

/**
 * Verify if file exists and is readable
 * @param {string} filePath - Full path to file
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safely delete a file with error handling
 * @param {string} filePath - Full path to file to delete
 * @returns {Promise<{success: boolean, error?: string, filePath: string}>}
 */
async function deleteFileFromDisk(filePath) {
  try {
    // Check if file exists
    const exists = await fileExists(filePath);
    
    if (!exists) {
      logger.debug(`File already missing, skipping`, { filePath });
      return {
        success: true,
        filePath,
        status: 'already_missing'
      };
    }

    // Delete the file
    await fs.unlink(filePath);
    
    logger.info(`File deleted successfully`, { filePath });
    return {
      success: true,
      filePath,
      status: 'deleted'
    };
  } catch (error) {
    logger.error(`Failed to delete file`, {
      filePath,
      error: error.message,
      code: error.code
    });

    return {
      success: false,
      filePath,
      error: error.message,
      code: error.code,
      status: 'failed'
    };
  }
}

/**
 * Build full file path from relative URL
 * @param {string} fileUrl - Relative file URL/path from database
 * @param {string} uploadDir - Base uploads directory path
 * @returns {string} Full file system path
 */
function buildFilePath(fileUrl, uploadDir) {
  if (!fileUrl) return null;
  
  // Remove leading slashes and 'uploads/' prefix if present
  const cleanPath = fileUrl.replace(/^\/+/, '').replace(/^uploads\/+/, '');
  return path.join(uploadDir, cleanPath);
}

/**
 * Find dissertation requests eligible for cleanup
 * @param {Date} gracePeriodCutoff - Cutoff date for grace period
 * @returns {Promise<Array>} Array of requests to clean up
 */
async function findRequestsForCleanup(gracePeriodCutoff) {
  try {
    logger.debug(`Querying requests with status in [${CLEANUP_CONFIG.TARGET_STATUSES.join(', ')}]`);
    logger.debug(`Grace period cutoff: ${gracePeriodCutoff.toISOString()}`);

    const requestsToClean = await prisma.cerereDisertatie.findMany({
      where: {
        status: {
          in: CLEANUP_CONFIG.TARGET_STATUSES
        },
        sesiune: {
          dataSfarsit: {
            lt: gracePeriodCutoff
          }
        }
      },
      select: {
        id: true,
        studentId: true,
        sesiuneId: true,
        profesorId: true,
        status: true,
        fisierSemnatUrl: true,
        fisierRaspunsUrl: true,
        sesiune: {
          select: {
            dataSfarsit: true
          }
        },
        student: {
          select: {
            nume: true,
            prenume: true
          }
        }
      }
    });

    logger.info(`Found ${requestsToClean.length} requests eligible for cleanup`, {
      status: CLEANUP_CONFIG.TARGET_STATUSES,
      gracePeriodDays: CLEANUP_CONFIG.GRACE_PERIOD_DAYS
    });

    return requestsToClean;
  } catch (error) {
    logger.error(`Error querying database for cleanup`, error);
    throw error;
  }
}

/**
 * Process a single dissertation request for file cleanup
 * @param {Object} request - CerereDisertatie record
 * @param {string} uploadDir - Base uploads directory
 * @returns {Promise<Object>} Cleanup result for this request
 */
async function processRequestForCleanup(request, uploadDir) {
  const result = {
    requestId: request.id,
    studentName: `${request.student.prenume} ${request.student.nume}`,
    status: request.status,
    sessionEndDate: request.sesiune.dataSfarsit,
    filesAttempted: 0,
    filesDeleted: 0,
    filesAlreadyMissing: 0,
    filesFailed: 0,
    errors: [],
    filesProcessed: []
  };

  // Array of file URLs to process
  const filesToDelete = [];

  // Collect files to delete
  if (request.fisierSemnatUrl) {
    filesToDelete.push({
      type: 'fisier_semnat',
      url: request.fisierSemnatUrl,
      fullPath: buildFilePath(request.fisierSemnatUrl, uploadDir)
    });
  }

  if (request.fisierRaspunsUrl) {
    filesToDelete.push({
      type: 'fisier_raspuns',
      url: request.fisierRaspunsUrl,
      fullPath: buildFilePath(request.fisierRaspunsUrl, uploadDir)
    });
  }

  result.filesAttempted = filesToDelete.length;

  // Delete each file
  for (const file of filesToDelete) {
    logger.debug(`Processing file for request ${request.id}`, {
      type: file.type,
      path: file.fullPath
    });

    const deleteResult = await deleteFileFromDisk(file.fullPath);

    result.filesProcessed.push({
      type: file.type,
      path: file.fullPath,
      status: deleteResult.status,
      error: deleteResult.error
    });

    if (deleteResult.success) {
      if (deleteResult.status === 'deleted') {
        result.filesDeleted++;
      } else if (deleteResult.status === 'already_missing') {
        result.filesAlreadyMissing++;
      }
    } else {
      result.filesFailed++;
      result.errors.push({
        file: file.fullPath,
        error: deleteResult.error
      });
    }
  }

  // Update database to NULL out file references after successful deletion
  if (result.filesDeleted > 0 || result.filesAlreadyMissing > 0) {
    try {
      await prisma.cerereDisertatie.update({
        where: { id: request.id },
        data: {
          fisierSemnatUrl: null,
          fisierRaspunsUrl: null,
          updatedAt: new Date()
        }
      });

      result.databaseUpdated = true;
      logger.debug(`Database updated for request ${request.id}`, {
        fisierSemnatUrl: 'NULL',
        fisierRaspunsUrl: 'NULL'
      });
    } catch (error) {
      result.databaseUpdated = false;
      result.errors.push({
        type: 'database',
        error: `Failed to update database: ${error.message}`
      });
      logger.error(`Failed to update database for request ${request.id}`, error);
    }
  } else {
    result.databaseUpdated = false;
  }

  return result;
}

/**
 * Execute the cleanup job
 * Main entry point for the scheduled task
 * 
 * @param {string} uploadDir - Base uploads directory path (defaults to UPLOAD_DIR env var)
 * @returns {Promise<Object>} Summary statistics of cleanup operation
 */
async function executeCleanupJob(uploadDir = null) {
  const startTime = Date.now();
  
  // Use provided uploadDir or fall back to environment variable
  uploadDir = uploadDir || process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

  const summary = {
    startTime: new Date().toISOString(),
    uploadDir,
    gracePeriodDays: CLEANUP_CONFIG.GRACE_PERIOD_DAYS,
    totalRequestsFound: 0,
    totalRequestsProcessed: 0,
    totalFilesAttempted: 0,
    totalFilesDeleted: 0,
    totalFilesAlreadyMissing: 0,
    totalFilesFailed: 0,
    totalDatabaseUpdates: 0,
    totalErrors: [],
    requestResults: [],
    duration: 0,
    status: 'pending'
  };

  try {
    logger.info(`Starting cleanup job execution`, { uploadDir });

    // Verify uploads directory exists
    try {
      await fs.access(uploadDir);
      logger.debug(`Uploads directory verified`, { uploadDir });
    } catch (error) {
      logger.warn(`Uploads directory not accessible`, { uploadDir, error: error.message });
    }

    // Calculate grace period cutoff
    const gracePeriodCutoff = getGracePeriodCutoff();
    logger.info(`Grace period cutoff calculated`, {
      cutoffDate: gracePeriodCutoff.toISOString(),
      daysAgo: CLEANUP_CONFIG.GRACE_PERIOD_DAYS
    });

    // Find requests eligible for cleanup
    const requestsToClean = await findRequestsForCleanup(gracePeriodCutoff);
    summary.totalRequestsFound = requestsToClean.length;

    if (requestsToClean.length === 0) {
      logger.info(`No requests found for cleanup`);
      summary.status = 'completed_no_action';
      summary.duration = Date.now() - startTime;
      return summary;
    }

    // Process requests in batches
    for (let i = 0; i < requestsToClean.length; i += CLEANUP_CONFIG.BATCH_SIZE) {
      const batch = requestsToClean.slice(i, i + CLEANUP_CONFIG.BATCH_SIZE);
      const batchNumber = Math.floor(i / CLEANUP_CONFIG.BATCH_SIZE) + 1;

      logger.debug(`Processing batch ${batchNumber}`, {
        batchSize: batch.length,
        totalBatches: Math.ceil(requestsToClean.length / CLEANUP_CONFIG.BATCH_SIZE)
      });

      // Process each request in batch sequentially
      for (const request of batch) {
        try {
          const requestResult = await processRequestForCleanup(request, uploadDir);
          
          summary.requestResults.push(requestResult);
          summary.totalRequestsProcessed++;
          summary.totalFilesAttempted += requestResult.filesAttempted;
          summary.totalFilesDeleted += requestResult.filesDeleted;
          summary.totalFilesAlreadyMissing += requestResult.filesAlreadyMissing;
          summary.totalFilesFailed += requestResult.filesFailed;

          if (requestResult.databaseUpdated) {
            summary.totalDatabaseUpdates++;
          }

          if (requestResult.errors.length > 0) {
            summary.totalErrors.push(...requestResult.errors);
          }

          logger.debug(`Request processed`, {
            requestId: request.id,
            student: requestResult.studentName,
            filesDeleted: requestResult.filesDeleted,
            filesAlreadyMissing: requestResult.filesAlreadyMissing,
            filesFailed: requestResult.filesFailed
          });
        } catch (error) {
          logger.error(`Error processing request ${request.id}`, error);
          summary.totalErrors.push({
            requestId: request.id,
            error: error.message
          });
        }
      }
    }

    summary.status = 'completed_success';
    logger.info(`Cleanup job completed successfully`, {
      requestsProcessed: summary.totalRequestsProcessed,
      filesDeleted: summary.totalFilesDeleted,
      filesAlreadyMissing: summary.totalFilesAlreadyMissing,
      filesFailed: summary.totalFilesFailed,
      databaseUpdates: summary.totalDatabaseUpdates
    });

  } catch (error) {
    summary.status = 'failed';
    summary.error = error.message;
    logger.error(`Cleanup job failed with error`, error);
  } finally {
    summary.duration = Date.now() - startTime;
    summary.endTime = new Date().toISOString();

    logger.info(`Cleanup job finished`, {
      status: summary.status,
      duration: `${summary.duration}ms`,
      summary: {
        total_processed: summary.totalRequestsProcessed,
        files_deleted: summary.totalFilesDeleted,
        files_failed: summary.totalFilesFailed,
        errors: summary.totalErrors.length
      }
    });

    // Close Prisma connection if this is a standalone execution
    if (process.env.CLEANUP_STANDALONE === 'true') {
      await prisma.$disconnect();
    }
  }

  return summary;
}

/**
 * Validate cleanup job configuration
 * @returns {Object} Validation result with status and any warnings
 */
function validateCleanupConfig() {
  const warnings = [];

  if (CLEANUP_CONFIG.GRACE_PERIOD_DAYS < 30) {
    warnings.push('Grace period is less than 30 days - frequent cleanup may occur');
  }

  if (CLEANUP_CONFIG.GRACE_PERIOD_DAYS > 365) {
    warnings.push('Grace period is greater than 1 year - old files may accumulate');
  }

  if (CLEANUP_CONFIG.BATCH_SIZE < 10) {
    warnings.push('Batch size is very small - processing will be slow');
  }

  if (CLEANUP_CONFIG.BATCH_SIZE > 1000) {
    warnings.push('Batch size is very large - may consume excessive memory');
  }

  return {
    valid: true,
    warnings,
    config: CLEANUP_CONFIG
  };
}

/**
 * Get cleanup job statistics and status
 * @returns {Object} Current job configuration and statistics
 */
function getCleanupJobStatus() {
  const cutoff = getGracePeriodCutoff();
  
  return {
    configured: true,
    configuration: CLEANUP_CONFIG,
    nextCleanupBefore: cutoff.toISOString(),
    validation: validateCleanupConfig()
  };
}

// Export functions for use in scheduler and testing
module.exports = {
  executeCleanupJob,
  getCleanupJobStatus,
  validateCleanupConfig,
  CLEANUP_CONFIG,
  // Internal utilities (for testing)
  _internal: {
    getGracePeriodCutoff,
    fileExists,
    deleteFileFromDisk,
    buildFilePath,
    findRequestsForCleanup,
    processRequestForCleanup,
    CleanupLogger
  }
};
