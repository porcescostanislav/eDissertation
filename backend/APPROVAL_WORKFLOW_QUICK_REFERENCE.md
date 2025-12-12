# Professor Application Approval/Rejection - Quick Reference

## Summary
Implemented professor application review endpoints with automatic enforcement of session capacity limits and student exclusion rules.

## Routes

### Professor Application Review (Protected - Professor Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profesor/applications` | List all applications (filterable) |
| GET | `/api/profesor/applications/:id` | Get application details |
| PATCH | `/api/profesor/applications/:id/approve` | Approve application |
| PATCH | `/api/profesor/applications/:id/reject` | Reject with justification |

## Key Features

### ✅ Session Capacity Enforcement
- Cannot exceed `sesiune.limitaStudenti`
- Real-time count of approved applications
- Returns `409 Conflict` if capacity exceeded
- Prevents overbooking

### ✅ Student Exclusion Rule
- When student approved by Professor A, all pending applications with other professors are auto-rejected
- Ensures one student = one approval
- Enforces business rule: "if approved by one, cannot be approved by second"
- Uses atomic database transaction for safety

### ✅ Rejection Justification
- Required field for rejections
- Minimum 10 characters
- Informs student of rejection reason
- Stored with application record

### ✅ Application Status Workflow
```
pending → aprobat  (via /approve)
pending → respins  (via /reject)
```

### ✅ Filtering & Listing
- Filter by status: `?status=pending`, `?status=aprobat`, `?status=respins`
- Filter by session: `?sesiuneId=1`
- Pagination metadata includes counts

### ✅ Ownership Verification
- Professors can only approve/reject their own applications
- Returns `403 Forbidden` for unauthorized access

## Approval Workflow

### 1. View Pending Applications
```bash
GET /api/profesor/applications?status=pending
Authorization: Bearer <token>
```

Returns:
- All pending applications for professor's sessions
- Student name, email, session details
- Pagination with status breakdown

### 2. Review Specific Application
```bash
GET /api/profesor/applications/:id
Authorization: Bearer <token>
```

Returns:
- Full application details
- Student contact info
- Session capacity info

### 3a. Approve Application
```bash
PATCH /api/profesor/applications/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{}
```

Validates:
- Application is pending
- Session capacity not exceeded
- Professor owns application

On success:
- Application status → `aprobat`
- All other pending apps from student → `respins` (auto)
- Returns count of auto-rejected apps

### 3b. Reject Application
```bash
PATCH /api/profesor/applications/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "justificare": "Student does not meet prerequisites"
}
```

Validates:
- Application is pending
- Justification provided (min 10 chars)
- Professor owns application

On success:
- Application status → `respins`
- Justification stored
- Student can see rejection reason

## Business Logic Rules

### Rule 1: Session Capacity
```
approved_count < session.limitaStudenti
```
- Check before approval
- Prevent exceeding limit
- Return 409 if exceeded

### Rule 2: One Approval Per Student
```
When approve(student_A, professor_1):
  - Set student_A with professor_1 to "aprobat"
  - Set all other pending apps for student_A to "respins"
  - Reason: "Auto-rejected: Student approved by another professor"
```

### Rule 3: Status Lock
- Cannot change already processed applications
- pending → aprobat/respins only
- Cannot revert once approved/rejected

### Rule 4: Justification
- Required for rejection
- Min length: 10 characters
- Visible to student

## Transaction Safety

Approval uses database transaction:
```
BEGIN TRANSACTION
  UPDATE application SET status = 'aprobat'
  UPDATE all other applications for student SET status = 'respins'
COMMIT
```

If any step fails → ROLLBACK (no partial changes)

## Response Examples

### List Applications
```json
{
  "data": [
    {
      "id": 1,
      "status": "pending",
      "student": {...},
      "sesiune": {...}
    }
  ],
  "pagination": {
    "total": 5,
    "pending": 3,
    "approved": 1,
    "rejected": 1
  }
}
```

### Approve Response
```json
{
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "id": 1,
    "status": "aprobat",
    "rejectedOtherApplications": 2
  }
}
```

### Reject Response
```json
{
  "success": true,
  "message": "Application rejected successfully",
  "data": {
    "id": 1,
    "status": "respins",
    "justificareRespingere": "Does not meet prerequisites"
  }
}
```

## Error Scenarios

| Scenario | Status | Message |
|----------|--------|---------|
| Capacity exceeded | 409 | "Session has reached its limit..." |
| Not pending | 409 | "Application is already aprobat..." |
| No justification | 400 | "Justification is required..." |
| Too short justification | 400 | "Justification must be at least 10 chars..." |
| Wrong professor | 403 | "You do not have access..." |
| Not found | 404 | "Application not found" |

## Filtering Examples

### Get All Pending Applications
```bash
GET /api/profesor/applications?status=pending
```

### Get Approved Applications
```bash
GET /api/profesor/applications?status=aprobat
```

### Get Rejected Applications
```bash
GET /api/profesor/applications?status=respins
```

### Get All Apps for Session 1
```bash
GET /api/profesor/applications?sesiuneId=1
```

### Combine Filters
```bash
GET /api/profesor/applications?status=pending&sesiuneId=1
```

## Testing Checklist

- ✅ Professor can view pending applications
- ✅ Can approve application within capacity
- ✅ Cannot approve beyond session limit (409)
- ✅ Can reject with justification
- ✅ Cannot reject without justification (400)
- ✅ Cannot change already processed application (409)
- ✅ Approval auto-rejects other student's pending apps
- ✅ Can filter by status
- ✅ Can filter by session
- ✅ Cannot access other professor's applications (403)
- ✅ Transaction safety (all-or-nothing)

## Related Endpoints

**Student side:**
- `GET /api/student/applications` - Student views their applications
- `POST /api/student/applications` - Student submits application

**Professor side:**
- `GET /api/profesor/sessions` - Manage sessions
- `POST /api/profesor/sessions` - Create sessions

## Documentation

See `APPLICATIONS_API.md` for complete endpoint documentation with cURL examples.
