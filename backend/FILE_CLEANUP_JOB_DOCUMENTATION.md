# File Cleanup Job Documentation

## Overview

The eDissertation backend includes an automated file cleanup system that safely removes uploaded files associated with outdated dissertation requests. This system is implemented using `node-cron` for scheduling and executes daily to manage disk space efficiently.

## Purpose

The cleanup job addresses the following requirements:

1. **Disk Space Management**: Automatically removes files from disk that are no longer needed
2. **Data Integrity**: Only removes files associated with finalized requests (approved/rejected)
3. **Grace Period**: Maintains a 90-day grace period before cleanup to ensure data is not deleted prematurely
4. **Database Synchronization**: Updates database records to remove file references after deletion
5. **Error Handling**: Implements robust error handling for missing files and deletion failures
6. **Monitoring**: Provides detailed logging and status monitoring capabilities

## Architecture

### File Structure

```
backend/
├── src/
│   ├── jobs/
│   │   ├── cleanupJob.js      # Core cleanup logic
│   │   ├── scheduler.js        # Cron job scheduler
│   │   └── index.js            # Job module exports
│   └── routes/
│       └── admin-jobs.js       # Admin API endpoints
├── server.js                   # Updated with scheduler initialization
└── package.json                # Added node-cron dependency
```

### Components

#### 1. **cleanupJob.js** - Core Cleanup Logic
The main cleanup implementation with the following key functions:

**executeCleanupJob(uploadDir)**
- Main entry point for the cleanup operation
- Returns comprehensive summary statistics
- Processes requests in configurable batches
- Implements proper error handling and logging

**Key Features:**
- Queries database for eligible requests
- Extracts file paths from database records
- Safely deletes files with error handling
- Updates database records to NULL file references
- Generates detailed execution reports

**findRequestsForCleanup(gracePeriodCutoff)**
- Queries for `CerereDisertatie` records where:
  - Status is 'approved' OR 'rejected'
  - Associated `SesiuneInscriere.dataSfarsit` is > 90 days old
- Uses Prisma with optimized queries

**processRequestForCleanup(request, uploadDir)**
- Processes individual dissertation requests
- Handles multiple file types (signed file, response file)
- Tracks deletion results per file
- Updates database after successful deletion

#### 2. **scheduler.js** - Job Scheduler
Manages the scheduling and execution of background jobs:

**Features:**
- Uses `node-cron` for reliable scheduling
- Runs cleanup daily at midnight (00:00)
- Implements job lifecycle management
- Provides manual trigger capability for testing
- Comprehensive error handling and recovery

**Main Functions:**
- `initialize()` - Initialize scheduler and jobs
- `scheduleCleanupJob()` - Schedule cleanup for daily execution
- `triggerCleanupJob()` - Manually trigger cleanup (for testing)
- `getStatus()` - Get current scheduler status

#### 3. **admin-jobs.js** - API Routes
Protected API endpoints for job management:

**Endpoints:**
- `GET /api/admin/jobs/status` - Get scheduler status
- `GET /api/admin/jobs/cleanup/status` - Get cleanup job configuration
- `GET /api/admin/jobs/cleanup/validate` - Validate cleanup configuration
- `POST /api/admin/jobs/cleanup/trigger` - Manually trigger cleanup
- `POST /api/admin/jobs/initialize` - Initialize scheduler (rarely needed)

## Configuration

### Environment Variables

The cleanup job uses the following environment variable:

```bash
UPLOAD_DIR=./uploads          # Directory where uploaded files are stored
CLEANUP_LOG_LEVEL=info        # Logging level: debug, info, warn, error
```

### Cleanup Configuration

The cleanup behavior is configurable via `CLEANUP_CONFIG` in `cleanupJob.js`:

```javascript
const CLEANUP_CONFIG = {
  GRACE_PERIOD_DAYS: 90,      // Days to retain files after request finalization
  TARGET_STATUSES: ['approved', 'rejected'],  // Request statuses to cleanup
  BATCH_SIZE: 100,            // Records to process per batch
  LOG_LEVEL: 'info'           // Logging verbosity
};
```

To modify these settings, edit `backend/src/jobs/cleanupJob.js` and update the `CLEANUP_CONFIG` object.

## Cleanup Logic

### Step-by-Step Process

1. **Calculate Grace Period**
   - Determines cutoff date: current date - 90 days
   - Only requests older than this date are eligible

2. **Query Database**
   - Finds all `CerereDisertatie` records matching:
     - Status: 'approved' OR 'rejected'
     - Session end date: older than grace period cutoff
   - Includes related student and session information

3. **Extract File Paths**
   - For each eligible request, extracts:
     - `fisierSemnatUrl` (signed dissertation file)
     - `fisierRaspunsUrl` (professor response file)
   - Builds full file system paths

4. **Delete Files from Disk**
   - For each file:
     - Checks if file exists
     - Attempts deletion if it exists
     - Handles missing files gracefully
     - Logs results (deleted/missing/failed)

5. **Update Database**
   - After successful file deletion(s):
     - Sets `fisierSemnatUrl` to NULL
     - Sets `fisierRaspunsUrl` to NULL
     - Updates `updatedAt` timestamp
   - Only updates if files were successfully deleted or already missing

6. **Generate Report**
   - Compiles cleanup statistics
   - Documents all errors encountered
   - Returns summary for logging/monitoring

### Cleanup Decision Tree

```
For each CerereDisertatie record:
├─ Check if status is 'approved' OR 'rejected'
│  ├─ No → Skip this record
│  └─ Yes → Continue
│
├─ Check if session end date > 90 days ago
│  ├─ No → Skip this record (still within grace period)
│  └─ Yes → Continue
│
├─ For each file (signed + response):
│  ├─ Check if file exists
│  │  ├─ No → Mark as 'already_missing'
│  │  └─ Yes → Attempt deletion
│  │
│  └─ If file deleted or was missing:
│     └─ Continue to database update
│
└─ Update database (if files were handled):
   ├─ Set fisierSemnatUrl = NULL
   ├─ Set fisierRaspunsUrl = NULL
   └─ Set updatedAt = NOW()
```

## Scheduling

### Default Schedule

The cleanup job is scheduled to run **daily at midnight (00:00)**:

```
Cron Pattern: 0 0 * * *
Time: 00:00:00 UTC every day
```

To change the schedule, modify the cron pattern in `scheduler.js`:

```javascript
// Current: Midnight daily
cron.schedule('0 0 * * *', ...)

// Examples:
// '0 3 * * *'       - 3:00 AM daily
// '0 2 * * 0'       - 2:00 AM every Sunday
// '0 */6 * * *'     - Every 6 hours
// '0 0 1 * *'       - Midnight on 1st of each month
```

### Manual Triggering

To trigger cleanup immediately (for testing/maintenance):

```bash
# Using curl
curl -X POST http://localhost:3000/api/admin/jobs/cleanup/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response example:
{
  "success": true,
  "message": "Cleanup job triggered and completed successfully",
  "data": {
    "startTime": "2025-12-13T15:30:00.000Z",
    "uploadDir": "./uploads",
    "gracePeriodDays": 90,
    "totalRequestsFound": 5,
    "totalRequestsProcessed": 5,
    "totalFilesAttempted": 8,
    "totalFilesDeleted": 6,
    "totalFilesAlreadyMissing": 2,
    "totalFilesFailed": 0,
    "totalDatabaseUpdates": 5,
    "duration": 1234,
    "status": "completed_success"
  },
  "timestamp": "2025-12-13T15:30:01.234Z"
}
```

## API Reference

### Authentication

All admin job endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Status Endpoints

#### GET /api/admin/jobs/status
Get overall scheduler status

**Response:**
```json
{
  "success": true,
  "message": "Scheduler status retrieved",
  "data": {
    "schedulerRunning": true,
    "jobsCount": 1,
    "jobs": [
      {
        "name": "cleanup",
        "schedule": "0 0 * * * (midnight daily)",
        "description": "Cleanup old dissertation files",
        "createdAt": "2025-12-13T12:00:00.000Z",
        "running": true
      }
    ],
    "timestamp": "2025-12-13T15:30:00.000Z"
  }
}
```

#### GET /api/admin/jobs/cleanup/status
Get cleanup job configuration

**Response:**
```json
{
  "success": true,
  "message": "Cleanup job status retrieved",
  "data": {
    "configured": true,
    "configuration": {
      "GRACE_PERIOD_DAYS": 90,
      "TARGET_STATUSES": ["approved", "rejected"],
      "BATCH_SIZE": 100,
      "LOG_LEVEL": "info"
    },
    "nextCleanupBefore": "2025-12-13T00:00:00.000Z",
    "validation": {
      "valid": true,
      "warnings": [],
      "config": { ... }
    }
  }
}
```

#### GET /api/admin/jobs/cleanup/validate
Validate cleanup configuration

**Response:**
```json
{
  "success": true,
  "message": "Cleanup configuration validated",
  "data": {
    "valid": true,
    "warnings": [],
    "config": {
      "GRACE_PERIOD_DAYS": 90,
      "TARGET_STATUSES": ["approved", "rejected"],
      "BATCH_SIZE": 100,
      "LOG_LEVEL": "info"
    }
  }
}
```

### Trigger Endpoints

#### POST /api/admin/jobs/cleanup/trigger
Manually trigger cleanup job (execute immediately)

**Query Parameters:**
- `uploadDir` (optional): Override the uploads directory path

**Response:**
```json
{
  "success": true,
  "message": "Cleanup job triggered and completed successfully",
  "data": {
    "startTime": "2025-12-13T15:30:00.000Z",
    "uploadDir": "./uploads",
    "gracePeriodDays": 90,
    "totalRequestsFound": 5,
    "totalRequestsProcessed": 5,
    "totalFilesAttempted": 8,
    "totalFilesDeleted": 6,
    "totalFilesAlreadyMissing": 2,
    "totalFilesFailed": 0,
    "totalDatabaseUpdates": 5,
    "totalErrors": [],
    "requestResults": [
      {
        "requestId": 1,
        "studentName": "John Doe",
        "status": "approved",
        "sessionEndDate": "2025-08-01T00:00:00.000Z",
        "filesAttempted": 2,
        "filesDeleted": 2,
        "filesAlreadyMissing": 0,
        "filesFailed": 0,
        "errors": [],
        "databaseUpdated": true,
        "filesProcessed": [
          {
            "type": "fisier_semnat",
            "path": "/path/to/uploads/file1.pdf",
            "status": "deleted",
            "error": null
          },
          {
            "type": "fisier_raspuns",
            "path": "/path/to/uploads/file2.pdf",
            "status": "deleted",
            "error": null
          }
        ]
      }
    ],
    "duration": 1234,
    "status": "completed_success",
    "endTime": "2025-12-13T15:30:01.234Z"
  },
  "timestamp": "2025-12-13T15:30:01.234Z"
}
```

## Logging

### Log Levels

The cleanup job supports four logging levels:

- **debug**: Detailed information about each operation
- **info**: General information about job execution (default)
- **warn**: Warning messages about potential issues
- **error**: Error messages for failures

### Log Format

All cleanup logs are prefixed with `[CLEANUP <LEVEL>]` for easy identification:

```
[CLEANUP INFO] Starting cleanup job execution
[CLEANUP DEBUG] Uploads directory verified
[CLEANUP INFO] Grace period cutoff calculated
[CLEANUP INFO] Found 5 requests eligible for cleanup
[CLEANUP DEBUG] Processing file for request 1
[CLEANUP INFO] File deleted successfully
[CLEANUP DEBUG] Database updated for request 1
[CLEANUP INFO] Cleanup job finished
```

### Example Logs

```log
[CLEANUP INFO] Starting cleanup job execution { uploadDir: './uploads' }
[CLEANUP DEBUG] Uploads directory verified { uploadDir: './uploads' }
[CLEANUP INFO] Grace period cutoff calculated { cutoffDate: '2025-09-15T12:00:00.000Z', daysAgo: 90 }
[CLEANUP INFO] Found 3 requests eligible for cleanup { status: ['approved', 'rejected'], gracePeriodDays: 90 }
[CLEANUP DEBUG] Processing batch 1 { batchSize: 3, totalBatches: 1 }
[CLEANUP DEBUG] Processing file for request 1 { type: 'fisier_semnat', path: '/path/to/uploads/req_1_signed.pdf' }
[CLEANUP INFO] File deleted successfully { filePath: '/path/to/uploads/req_1_signed.pdf' }
[CLEANUP DEBUG] Database updated for request 1 { fisierSemnatUrl: 'NULL', fisierRaspunsUrl: 'NULL' }
[CLEANUP DEBUG] Request processed { requestId: 1, student: 'John Doe', filesDeleted: 2, filesAlreadyMissing: 0, filesFailed: 0 }
[CLEANUP INFO] Cleanup job finished { status: 'completed_success', duration: '1234ms', summary: {...} }
```

## Error Handling

The cleanup job implements comprehensive error handling:

### File Deletion Errors

- **File Already Missing**: Treated as successful (no error)
- **Permission Denied**: Logged as error, continues processing
- **Invalid Path**: Logged as error, continues processing
- **Disk I/O Error**: Logged as error, continues processing

### Database Errors

- **Update Failure**: Logged but doesn't stop cleanup
- **Connection Lost**: Gracefully handled with error logging
- **Concurrent Modifications**: Prisma handles automatically

### Graceful Degradation

- Cleanup continues even if some files fail to delete
- Database updates are optional (not critical if deletion succeeds)
- Errors are collected and reported in summary
- Process completes with partial success status if some operations succeed

## Database Impact

### Tables Affected

- **CerereDisertatie**: File URLs are set to NULL after successful cleanup

### Queries Executed

1. **Find Requests**:
   ```sql
   SELECT * FROM CerereDisertatie
   WHERE status IN ('approved', 'rejected')
   AND sesiune.dataSfarsit < DATE_SUB(NOW(), INTERVAL 90 DAY)
   ```

2. **Update Records** (per request):
   ```sql
   UPDATE CerereDisertatie
   SET fisierSemnatUrl = NULL,
       fisierRaspunsUrl = NULL,
       updated_at = NOW()
   WHERE id = ?
   ```

### Data Preservation

- Dissertation application records are NOT deleted
- Only file URLs are removed
- Metadata (dates, status, etc.) is preserved
- Students/Professors retain access history

## Performance Considerations

### Batch Processing

Files are processed in configurable batches to manage memory usage:

- Default batch size: 100 records
- Adjustable via `CLEANUP_CONFIG.BATCH_SIZE`
- Each batch is processed sequentially
- No concurrent file operations

### Database Query Optimization

- Indexes on `status`, `dataSfarsit` columns
- Efficient SELECT with only necessary fields
- Batch updates use individual queries for safety

### File System Operations

- Uses Node.js `fs.promises` for async I/O
- Non-blocking execution
- Error handling prevents hanging on bad files

### Typical Performance

- 100 records: ~2-5 seconds
- 1000 records: ~20-50 seconds
- Depends on file system and disk speed

## Monitoring & Alerts

### Status Checks

Monitor cleanup job health via API:

```bash
# Check if scheduler is running
curl http://localhost:3000/api/admin/jobs/status

# Check cleanup configuration
curl http://localhost:3000/api/admin/jobs/cleanup/status

# Validate configuration
curl http://localhost:3000/api/admin/jobs/cleanup/validate
```

### Log Monitoring

Monitor logs for:
- `[CLEANUP ERROR]` - Cleanup failures
- `[CLEANUP WARN]` - Warning conditions
- Repeated errors indicate systemic issues

### Disk Space Monitoring

Track disk usage trends to ensure cleanup is effective:

```bash
# Check directory size
du -sh ./uploads

# Monitor cleanup results
tail -f server.log | grep "CLEANUP"
```

## Troubleshooting

### Issue: Cleanup Job Not Executing

**Symptoms**: Files not being deleted, no log entries

**Diagnosis**:
1. Check server logs for scheduler initialization
2. Verify API endpoint returns job status
3. Ensure database connection is working

**Resolution**:
1. Check UPLOAD_DIR environment variable
2. Verify database connection
3. Review scheduler initialization in server.js
4. Check file system permissions

### Issue: Files Not Deleting

**Symptoms**: Cleanup completes but files remain on disk

**Diagnosis**:
1. Check cleanup logs for deletion errors
2. Verify file path construction
3. Check file permissions

**Resolution**:
1. Verify `UPLOAD_DIR` path is correct
2. Check file/directory permissions
3. Ensure no other processes have files locked
4. Review error messages in cleanup response

### Issue: Database Not Updating

**Symptoms**: Files deleted but URLs still in database

**Diagnosis**:
1. Check database connection
2. Review update error logs
3. Verify record still exists

**Resolution**:
1. Verify Prisma connection
2. Check database permissions
3. Ensure database has write access

### Issue: Cleanup Job Crashing

**Symptoms**: Scheduler stops, no new cleanup jobs

**Diagnosis**:
1. Check server error logs
2. Review cleanup error messages
3. Test with manual trigger

**Resolution**:
1. Fix identified error condition
2. Manually trigger cleanup to verify fix
3. Restart server if needed

## Maintenance

### Regular Tasks

**Monthly**:
- Review cleanup logs for patterns
- Monitor disk space usage
- Verify scheduled job is executing

**Quarterly**:
- Audit cleanup statistics
- Review configuration settings
- Test manual trigger

**Annually**:
- Review grace period setting
- Adjust batch size if needed
- Update documentation

### Configuration Adjustments

**Increase Grace Period**:
Edit `CLEANUP_CONFIG.GRACE_PERIOD_DAYS`:
```javascript
GRACE_PERIOD_DAYS: 120,  // 4 months instead of 90 days
```

**Reduce Batch Size for Low-Memory Systems**:
```javascript
BATCH_SIZE: 25,  // Process 25 records at a time
```

**Enable Debug Logging**:
```javascript
LOG_LEVEL: 'debug',  // Verbose logging for troubleshooting
```

## Security Considerations

- Cleanup job runs with same permissions as backend process
- File paths are validated before deletion
- No user-supplied paths are used directly
- Database updates are authenticated (API route requires JWT)
- Logs contain file paths (may be security sensitive in some environments)

## Integration

### With Other Systems

The cleanup job can be integrated with:

1. **Backup Systems**: Archive files before cleanup
2. **Monitoring Systems**: Send alerts on completion
3. **Analytics**: Track cleanup metrics over time
4. **Audit Logging**: Record all file deletions

### Example: Backup Before Cleanup

To implement backups before cleanup, modify `cleanupJob.js`:

```javascript
async function deleteFileFromDisk(filePath) {
  // Add backup before deletion
  await backupFile(filePath);
  
  // Then delete
  await fs.unlink(filePath);
}
```

## Testing

### Manual Testing

1. **Create test data**:
   - Submit applications
   - Approve/reject them
   - Upload files

2. **Trigger cleanup**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/jobs/cleanup/trigger \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Verify results**:
   - Check uploaded files are deleted
   - Verify database records have NULL values
   - Review cleanup logs

### Unit Testing

Example test for cleanup logic:

```javascript
describe('Cleanup Job', () => {
  it('should delete files older than grace period', async () => {
    // Create test request with old date
    // Execute cleanup
    // Assert files are deleted
    // Assert database updated
  });
});
```

## FAQ

**Q: Will cleanup delete files that are still needed?**
A: No. Cleanup only processes requests with status 'approved' or 'rejected' (finalized requests).

**Q: Can I change the 90-day grace period?**
A: Yes. Edit `CLEANUP_CONFIG.GRACE_PERIOD_DAYS` in `cleanupJob.js`.

**Q: What if a file is already missing?**
A: It's treated as successfully handled. The database is updated to NULL anyway.

**Q: Can I manually trigger cleanup?**
A: Yes. Use the `POST /api/admin/jobs/cleanup/trigger` endpoint.

**Q: What happens if cleanup fails?**
A: Detailed errors are logged and returned. Files are not deleted if an error occurs. The next run will retry.

**Q: How much disk space will be freed?**
A: Depends on file sizes. Get cleanup report from API for details.

**Q: Can cleanup run while the app is being used?**
A: Yes. It's designed to run without blocking other operations.

**Q: How do I disable cleanup?**
A: Comment out the job in `scheduler.js` or don't call `initializeScheduler()`.

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Stability**: Production Ready
