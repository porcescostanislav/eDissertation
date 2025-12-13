# SesiuneInscriere Routes - Quick Reference

## Summary
Implemented RESTful API for managing enrollment sessions with temporal overlap validation.

## Routes

### Session Management (Protected - Profesor Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/profesor/sessions` | Create new enrollment session |
| GET | `/api/profesor/sessions` | List professor's sessions (filterable) |
| GET | `/api/profesor/sessions/:id` | Get session details with enrollments |
| PUT | `/api/profesor/sessions/:id` | Update session (before start date) |
| DELETE | `/api/profesor/sessions/:id` | Delete session (no enrollments) |

## Key Features

### ✅ Temporal Overlap Validation
- Prevents creating/updating sessions that overlap with professor's existing sessions
- Overlap detection: `new_start < existing_end AND new_end > existing_start`
- Returns `409 Conflict` if overlap detected

### ✅ Session Status
Sessions automatically have a computed status:
- **upcoming**: Start date in future
- **active**: Currently running
- **past**: End date passed

### ✅ Enrollment Tracking
- Real-time enrollment count calculation
- Available slots = limitaStudenti - enrolled count
- Included in session details response

### ✅ Validations
- Start date must be before end date
- Student limit ≥ 1 and ≤ professor's maximum
- Can only update sessions that haven't started
- Can only delete empty sessions
- New limit must accommodate current enrollments

### ✅ Query Filtering
List sessions with status filter:
```
GET /api/profesor/sessions?status=active
GET /api/profesor/sessions?status=upcoming
GET /api/profesor/sessions?status=past
GET /api/profesor/sessions?status=all  (default)
```

## Example Workflow

### 1. Professor logs in
```bash
POST /api/auth/login
{
  "email": "prof@university.edu",
  "password": "password"
}
```
Response includes JWT token.

### 2. Create first enrollment session
```bash
POST /api/profesor/sessions
Authorization: Bearer <token>
{
  "dataInceput": "2025-02-01T09:00:00Z",
  "dataSfarsit": "2025-03-01T17:00:00Z",
  "limitaStudenti": 5
}
```

### 3. Try to create overlapping session (will fail)
```bash
POST /api/profesor/sessions
Authorization: Bearer <token>
{
  "dataInceput": "2025-02-15T09:00:00Z",
  "dataSfarsit": "2025-04-01T17:00:00Z",
  "limitaStudenti": 5
}
```
Returns: `409 Conflict - New session overlaps with an existing session`

### 4. Create non-overlapping session (success)
```bash
POST /api/profesor/sessions
Authorization: Bearer <token>
{
  "dataInceput": "2025-04-01T09:00:00Z",
  "dataSfarsit": "2025-05-01T17:00:00Z",
  "limitaStudenti": 3
}
```

### 5. List all sessions
```bash
GET /api/profesor/sessions
Authorization: Bearer <token>
```

### 6. View session details
```bash
GET /api/profesor/sessions/1
Authorization: Bearer <token>
```
Returns session with enrollment list.

### 7. Update session before it starts
```bash
PUT /api/profesor/sessions/1
Authorization: Bearer <token>
{
  "limitaStudenti": 6
}
```

## Error Handling

| Status | Scenario |
|--------|----------|
| 400 | Invalid input or missing fields |
| 403 | Not a profesor or unauthorized access |
| 404 | Session not found |
| 409 | Temporal conflict or state conflict |
| 500 | Server error |

## Database Integration

Uses Prisma ORM with the following models:
- `SesiuneInscriere` - Enrollment sessions
- `Profesor` - Professor data
- `CerereDisertatie` - Dissertation requests (enrollments)

## Authentication

All endpoints (except auth routes) require:
```
Authorization: Bearer <JWT_TOKEN>
```

Token obtained from `/api/auth/login`

## Documentation

See `PROFESOR_API.md` for complete endpoint documentation with examples.
