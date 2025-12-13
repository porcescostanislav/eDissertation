/**
 * Cleanup Job Testing & Demo Script
 * 
 * This script demonstrates and tests the cleanup job functionality
 * Can be run independently for testing and debugging
 * 
 * Usage:
 *   node test-cleanup-job.js [action] [options]
 * 
 * Actions:
 *   help              - Show help message
 *   test              - Run cleanup job in test mode
 *   status            - Check cleanup job status
 *   validate          - Validate cleanup configuration
 *   trigger           - Trigger cleanup job immediately
 */

const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const {
  executeCleanupJob,
  getCleanupJobStatus,
  validateCleanupConfig
} = require('./src/jobs');

/**
 * Utility functions for testing
 */
const testUtils = {
  /**
   * Print formatted output
   */
  print: (message, data = null) => {
    console.log(message);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  },

  /**
   * Print section header
   */
  header: (title) => {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${title}`);
    console.log('='.repeat(60) + '\n');
  },

  /**
   * Print success message
   */
  success: (message) => {
    console.log('\n✓ ' + message);
  },

  /**
   * Print error message
   */
  error: (message) => {
    console.error('\n✗ ' + message);
  },

  /**
   * Print info message
   */
  info: (message) => {
    console.log('\nℹ ' + message);
  }
};

/**
 * Show help message
 */
function showHelp() {
  testUtils.header('Cleanup Job Test Script Help');
  
  console.log(`
Usage: node test-cleanup-job.js [action] [options]

Actions:

  help
    Show this help message

  status
    Display current cleanup job status and configuration
    Example: node test-cleanup-job.js status

  validate
    Validate cleanup job configuration
    Example: node test-cleanup-job.js validate

  trigger
    Manually trigger the cleanup job immediately
    Example: node test-cleanup-job.js trigger

  test [options]
    Run cleanup job in test mode
    Options:
      --upload-dir <path>  Override uploads directory
      --dry-run            Show what would be deleted without deleting
    Examples:
      node test-cleanup-job.js test
      node test-cleanup-job.js test --upload-dir ./uploads
      node test-cleanup-job.js test --dry-run

Examples:

  # Check if cleanup job is properly configured
  node test-cleanup-job.js status

  # Validate the cleanup configuration
  node test-cleanup-job.js validate

  # Trigger cleanup immediately (real execution)
  node test-cleanup-job.js trigger

  # Run cleanup with debug output
  CLEANUP_LOG_LEVEL=debug node test-cleanup-job.js trigger

  `);
}

/**
 * Display cleanup job status
 */
async function showStatus() {
  testUtils.header('Cleanup Job Status');

  try {
    const status = getCleanupJobStatus();
    
    testUtils.print('Configuration:', status.configuration);
    testUtils.print('\nValidation:', status.validation);
    testUtils.print('\nNext cleanup eligible before:', status.nextCleanupBefore);
    
    testUtils.success('Status retrieved successfully');
  } catch (error) {
    testUtils.error('Failed to get status: ' + error.message);
    process.exit(1);
  }
}

/**
 * Validate cleanup configuration
 */
async function validateConfig() {
  testUtils.header('Validate Cleanup Configuration');

  try {
    const validation = validateCleanupConfig();

    if (validation.valid) {
      testUtils.success('Configuration is valid');
    } else {
      testUtils.error('Configuration has issues');
    }

    if (validation.warnings && validation.warnings.length > 0) {
      console.log('\nWarnings:');
      validation.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    testUtils.print('\nConfiguration:', validation.config);
  } catch (error) {
    testUtils.error('Failed to validate configuration: ' + error.message);
    process.exit(1);
  }
}

/**
 * Trigger cleanup job immediately
 */
async function triggerCleanup() {
  testUtils.header('Trigger Cleanup Job');

  try {
    testUtils.info('Starting cleanup job...');
    console.log('');

    const result = await executeCleanupJob();

    console.log('');
    testUtils.header('Cleanup Results Summary');

    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`\nRequests Found: ${result.totalRequestsFound}`);
    console.log(`Requests Processed: ${result.totalRequestsProcessed}`);
    console.log(`\nFiles Attempted: ${result.totalFilesAttempted}`);
    console.log(`Files Deleted: ${result.totalFilesDeleted}`);
    console.log(`Files Already Missing: ${result.totalFilesAlreadyMissing}`);
    console.log(`Files Failed: ${result.totalFilesFailed}`);
    console.log(`\nDatabase Updates: ${result.totalDatabaseUpdates}`);
    console.log(`Total Errors: ${result.totalErrors.length}`);

    if (result.totalErrors.length > 0) {
      console.log('\nErrors encountered:');
      result.totalErrors.slice(0, 5).forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.error || JSON.stringify(err)}`);
      });
      if (result.totalErrors.length > 5) {
        console.log(`  ... and ${result.totalErrors.length - 5} more errors`);
      }
    }

    console.log('\nDetailed results saved to output above.');

    if (result.status === 'completed_success') {
      testUtils.success('Cleanup job completed successfully');
    } else if (result.status === 'completed_no_action') {
      testUtils.info('Cleanup job completed with no cleanup needed');
    } else {
      testUtils.error('Cleanup job completed with errors or failed');
      process.exit(1);
    }
  } catch (error) {
    testUtils.error('Failed to trigger cleanup: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Run in test mode
 */
async function runTest(options = {}) {
  testUtils.header('Cleanup Job Test Run');

  try {
    const uploadDir = options['upload-dir'] || process.env.UPLOAD_DIR;
    const isDryRun = options['dry-run'];

    if (isDryRun) {
      testUtils.info('DRY RUN MODE - No files will be deleted');
    }

    testUtils.info(`Upload directory: ${uploadDir}`);

    // Check if uploads directory exists
    try {
      const stats = await fs.stat(uploadDir);
      if (stats.isDirectory()) {
        testUtils.success(`Uploads directory exists: ${uploadDir}`);
      } else {
        testUtils.error(`Path is not a directory: ${uploadDir}`);
        process.exit(1);
      }
    } catch (error) {
      testUtils.error(`Uploads directory not found: ${uploadDir}`);
      process.exit(1);
    }

    // Run cleanup
    testUtils.info('Executing cleanup job...\n');
    const result = await executeCleanupJob(uploadDir);

    // Display results
    testUtils.header('Test Results');

    console.log(`Status: ${result.status}`);
    console.log(`Start Time: ${result.startTime}`);
    console.log(`End Time: ${result.endTime}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`\nRequests Found: ${result.totalRequestsFound}`);
    console.log(`Requests Processed: ${result.totalRequestsProcessed}`);
    console.log(`\nFiles Attempted: ${result.totalFilesAttempted}`);
    console.log(`Files Deleted: ${result.totalFilesDeleted}`);
    console.log(`Files Already Missing: ${result.totalFilesAlreadyMissing}`);
    console.log(`Files Failed: ${result.totalFilesFailed}`);

    if (result.requestResults.length > 0) {
      console.log('\nDetailed Results (first 3):');
      result.requestResults.slice(0, 3).forEach((req, index) => {
        console.log(`\n  Request #${index + 1}:`);
        console.log(`    ID: ${req.requestId}`);
        console.log(`    Student: ${req.studentName}`);
        console.log(`    Status: ${req.status}`);
        console.log(`    Files Deleted: ${req.filesDeleted}`);
        console.log(`    Database Updated: ${req.databaseUpdated}`);
        if (req.errors.length > 0) {
          console.log(`    Errors: ${req.errors.length}`);
        }
      });
    }

    testUtils.success(`Test completed with status: ${result.status}`);
  } catch (error) {
    testUtils.error('Test failed: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Main function - Parse arguments and execute appropriate action
 */
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'help';

  // Parse options
  const options = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        options[key] = true;
      } else {
        options[key] = value;
        i++;
      }
    }
  }

  try {
    switch (action.toLowerCase()) {
      case 'help':
        showHelp();
        break;

      case 'status':
        await showStatus();
        break;

      case 'validate':
        await validateConfig();
        break;

      case 'trigger':
        await triggerCleanup();
        break;

      case 'test':
        await runTest(options);
        break;

      default:
        console.error(`Unknown action: ${action}`);
        console.log('Run "node test-cleanup-job.js help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  testUtils,
  showStatus,
  validateConfig,
  triggerCleanup,
  runTest
};
