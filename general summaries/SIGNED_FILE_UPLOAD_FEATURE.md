# Signed File Upload Feature Documentation

## Overview
A new feature has been added to allow students to upload signed dissertation files for approved applications. This feature is visible only on applications with "approved" status.

## Backend Changes

### 1. Dependencies Added
- **multer** (v4.x): For handling file uploads

```bash
npm install multer
```

### 2. File Upload Endpoint
**Route:** `POST /api/student/applications/:id/upload-signed`

**Description:** Allows authenticated students to upload a signed PDF file for an approved application.

**Authentication:** Required (Bearer token)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Parameters:
  - `id` (URL param): Application ID
  - `file` (form field): PDF file (max file size depends on multer default)

**Response (Success):**
```json
{
  "success": true,
  "message": "Signed file uploaded successfully",
  "data": {
    "id": 1,
    "fisierSemnatUrl": "/uploads/file-1733926234567.pdf",
    "updatedAt": "2024-12-11T18:57:14.567Z"
  }
}
```

**Response (Error):**
- 400: Invalid application ID or no file uploaded
- 403: User doesn't own the application
- 404: Application not found
- 409: Application is not approved
- 500: Server error

### 3. Validation Rules
- Only PDF files are accepted
- Application must be in "aprobat" (approved) status
- User must be the owner of the application
- File is stored in `backend/uploads/` directory
- File URL is stored in the database field `fisier_semnat_url`

### 4. Database Changes
No schema changes required. The `CerereDisertatie` model already has:
- `fisierSemnatUrl String? @map("fisier_semnat_url")` - stores the file URL

### 5. File Storage
- Location: `backend/uploads/` directory
- Auto-created if doesn't exist
- Files are served statically via `/uploads` route
- File format: `fieldname-{timestamp}-{random}.pdf`

### 6. Server Configuration
Updated `server.js` to:
- Import `multer`, `path`, and `fs` modules
- Auto-create `uploads` directory on startup
- Serve uploaded files via `/uploads` static route

## Frontend Changes

### 1. StudentService Updates
Added new method `uploadSignedFile()`:

```javascript
uploadSignedFile: async (applicationId, file) => {
  // Sends FormData with PDF file to backend
  // Returns response with success status and file URL
}
```

### 2. StudentDashboard Component Updates

#### New State Variables
- `isUploadOpen` / `onUploadOpen` / `onUploadClose`: Modal state
- `selectedApplicationForUpload`: Currently selected application
- `uploadFile`: Selected file
- `isUploading`: Upload loading state

#### New Handler Functions
- `handleUploadSignedFile(application)`: Opens upload modal
- `handleFileChange(event)`: Handles file selection
- `handleSubmitSignedFile()`: Submits the file to backend

#### New UI Section
A new section appears in the "My Applications" list for each approved application:

**Features:**
- Shows "✓ Application Approved" indicator
- If file is already uploaded:
  - Displays upload date
  - Shows "Download" button to access the file
- If file is not uploaded:
  - Shows "Upload Signed File" button
  - Opens a modal with file upload interface

#### Upload Modal
- Accepts PDF files only
- Shows selected file name
- Client-side validation
- Upload progress indicator
- Success/error toast notifications

## User Workflow

1. Student logs into dashboard
2. Views their applications in "My Applications" section
3. If application status is "Approved":
   - New section appears with upload option
4. Student clicks "Upload Signed File" button
5. Modal opens with file input
6. Student selects a PDF file
7. Student clicks "Upload File" button
8. File is uploaded to backend
9. File URL is stored in database
10. Success notification appears
11. "Download" button becomes available for future access

## Security Considerations

1. **Authentication:** All endpoints require Bearer token authentication
2. **Authorization:** Students can only upload files for their own applications
3. **File Type:** Only PDF files are accepted (MIME type validation)
4. **Status Verification:** Only approved applications can receive file uploads
5. **File Storage:** Files stored outside web root with restricted access
6. **Error Handling:** Uploaded files are cleaned up if validation fails

## Testing the Feature

### Prerequisites
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:5173`
- Database connected and migrated

### Test Steps
1. Create student account and log in
2. Apply to a professor's session
3. Have the professor approve the application
4. Return to student dashboard
5. Find the approved application
6. Click "Upload Signed File"
7. Select a PDF file
8. Submit the upload
9. Verify success message
10. Check that file URL is displayed and download works

## File Structure
```
backend/
├── routes/
│   └── student.js (updated with upload endpoint)
├── server.js (updated with static file serving)
├── uploads/ (auto-created, contains uploaded PDFs)
└── package.json (multer added)

frontend/
├── src/
│   ├── pages/
│   │   └── StudentDashboard.jsx (updated with UI)
│   └── services/
│       └── studentService.js (updated with upload method)
```

## Environment Requirements
- Node.js 14+ (for backend)
- React 18+ (for frontend)
- Multer 4.x+ (for file handling)

## Troubleshooting

### Upload fails with "Only PDF files are allowed"
- Ensure the selected file has `.pdf` extension
- Check file MIME type is `application/pdf`

### Upload fails with "Only approved applications can have signed files uploaded"
- Verify the professor has approved the application
- Refresh the page to see the latest status

### File not accessible after upload
- Check that the backend is serving the `/uploads` route
- Verify file exists in `backend/uploads/` directory
- Check file permissions

### Uploads directory not created
- Ensure backend has write permissions in its root directory
- Check server logs for creation errors
