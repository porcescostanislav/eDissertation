# Student Applications - Quick Reference

## Summary
Implemented student endpoints for viewing active sessions and submitting dissertation applications with proper validation.

## Routes

### Student Application Management (Protected - Student Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/sessions` | List available active sessions |
| POST | `/api/student/applications` | Submit dissertation application |
| GET | `/api/student/applications` | List student's applications |
| GET | `/api/student/applications/:id` | Get application details |

## Key Features

### ✅ Active Session Requirement
- Students can only apply to currently active sessions
- Session must be between `dataInceput` and `dataSfarsit`
- Returns `409 Conflict` if session not yet started or already ended

### ✅ Enrollment Capacity Management
- Prevents applications if session is full
- Real-time available slots calculation
- Returns enrollment count and available slots

### ✅ Duplicate Prevention
- Unique constraint on (studentId, sesiuneId)
- Prevents student from applying twice to same session
- Returns `409 Conflict` with existing application ID if duplicate attempt

### ✅ Session Availability View
- GET `/api/student/sessions` shows only active sessions
- Indicates if student already applied
- Shows `canApply` flag for easy frontend logic

### ✅ Application Status Tracking
- Initial status: `pending`
- Can be updated to `aprobat` (approved) or `respins` (rejected) by professor
- Filter by status: `?status=pending`, `?status=aprobat`, `?status=respins`

### ✅ Ownership Verification
- Students can only access their own applications
- Returns `403 Forbidden` if accessing others' applications

## Submission Flow

```
1. Student logs in → receives JWT token
2. Student views available sessions → GET /api/student/sessions
3. Student submits application → POST /api/student/applications
4. Application created with status "pending"
5. Professor reviews and approves/rejects
6. Student checks status → GET /api/student/applications
```

## Request/Response Examples

### 1. View Available Sessions
```bash
GET /api/student/sessions
Authorization: Bearer <token>
```

Response includes:
- `alreadyApplied`: boolean (has student applied?)
- `canApply`: boolean (can student apply now?)
- `availableSlots`: number (how many slots left?)

### 2. Submit Application
```bash
POST /api/student/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "sesiuneId": 1,
  "profesorId": 1
}
```

Response:
- Application ID
- Session details
- Professor details
- Status: "pending"

### 3. View All Applications
```bash
GET /api/student/applications
Authorization: Bearer <token>
```

Filter options:
```bash
GET /api/student/applications?status=pending
GET /api/student/applications?status=aprobat
GET /api/student/applications?status=respins
```

### 4. View Application Details
```bash
GET /api/student/applications/:id
Authorization: Bearer <token>
```

## Validations

| Check | Scenario | Response |
|-------|----------|----------|
| Session exists | Session not found | `404 Not Found` |
| Session active | Before/after session dates | `409 Conflict` |
| Has slots | Enrollment full | `409 Conflict` |
| Not applied | Already has application | `409 Conflict` |
| Student auth | Not logged in | `401 Unauthorized` |
| Student role | Not student role | `403 Forbidden` |
| Ownership | Accessing other's application | `403 Forbidden` |

## Database Constraints

- Unique: `(studentId, sesiuneId)` - one application per student per session
- Foreign keys ensure referential integrity
- Student profile required for application

## Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting professor decision |
| `aprobat` | Approved by professor |
| `respins` | Rejected by professor |

## Related Fields (Professor Can Set)

- `justificareRespingere` - Rejection reason (if `respins`)
- `fisierSemnatUrl` - Signed document URL
- `fisierRaspunsUrl` - Response document URL

## Testing Checklist

- ✅ Student can view active sessions
- ✅ Student can submit application to active session
- ✅ Cannot apply to inactive session (not started)
- ✅ Cannot apply to inactive session (ended)
- ✅ Cannot apply to full session
- ✅ Cannot apply twice to same session
- ✅ Student can list their applications
- ✅ Student can filter applications by status
- ✅ Student can view application details
- ✅ Student cannot access other students' applications

## Documentation

See `STUDENT_API.md` for complete endpoint documentation with cURL examples.
