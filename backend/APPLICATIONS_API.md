# Professor Applications Management API

## Overview
This API allows professors to review, approve, and reject student dissertation applications. It includes automatic enforcement of session capacity limits and exclusion rules to ensure each student can only be approved by one professor.

## Base URL
```
http://localhost:3000/api/profesor
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. List Applications
**Endpoint:** `GET /api/profesor/applications`

**Description:** Get all applications for the professor's sessions.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `aprobat`, `respins`)
- `sesiuneId` (optional): Filter by specific session ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [
    {
      "id": 1,
      "studentId": 2,
      "student": {
        "id": 2,
        "nume": "Popa",
        "prenume": "Andrei"
      },
      "sesiuneId": 1,
      "sesiune": {
        "id": 1,
        "dataInceput": "2025-01-15T09:00:00.000Z",
        "dataSfarsit": "2025-02-15T17:00:00.000Z",
        "limitaStudenti": 5
      },
      "status": "pending",
      "justificareRespingere": null,
      "createdAt": "2025-12-12T15:30:00.000Z",
      "updatedAt": "2025-12-12T15:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "pending": 1,
    "approved": 0,
    "rejected": 0
  }
}
```

**Error Responses:**
- `403`: User is not a profesor
- `500`: Server error

---

### 2. Get Application Details
**Endpoint:** `GET /api/profesor/applications/:id`

**Description:** Get detailed information about a specific application.

**Request Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (number): Application ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Application retrieved successfully",
  "data": {
    "id": 1,
    "studentId": 2,
    "student": {
      "id": 2,
      "nume": "Popa",
      "prenume": "Andrei",
      "user": {
        "email": "student@example.com"
      }
    },
    "sesiuneId": 1,
    "sesiune": {
      "id": 1,
      "dataInceput": "2025-01-15T09:00:00.000Z",
      "dataSfarsit": "2025-02-15T17:00:00.000Z",
      "limitaStudenti": 5
    },
    "profesorId": 1,
    "status": "pending",
    "justificareRespingere": null,
    "fisierSemnatUrl": null,
    "fisierRaspunsUrl": null,
    "createdAt": "2025-12-12T15:30:00.000Z",
    "updatedAt": "2025-12-12T15:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid application ID
- `403`: User is not a profesor or doesn't own this application
- `404`: Application not found
- `500`: Server error

---

### 3. Approve Application
**Endpoint:** `PATCH /api/profesor/applications/:id/approve`

**Description:** Approve a student's application. Automatically rejects all other pending applications from this student with other professors.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (number): Application ID

**Request Body:**
```json
{}
```

**Business Logic:**
1. Validates application is pending
2. Checks professor hasn't exceeded session's `limitaStudenti`
3. Approves the application
4. **Automatically rejects** all other pending applications from the same student
5. Sets rejection reason: "Auto-rejected: Student approved by another professor"

**Success Response (200):**
```json
{
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "id": 1,
    "studentId": 2,
    "student": {
      "id": 2,
      "nume": "Popa",
      "prenume": "Andrei"
    },
    "sesiuneId": 1,
    "sesiune": {
      "id": 1,
      "dataInceput": "2025-01-15T09:00:00.000Z",
      "dataSfarsit": "2025-02-15T17:00:00.000Z",
      "limitaStudenti": 5
    },
    "profesorId": 1,
    "profesor": {
      "id": 1,
      "nume": "Ionescu",
      "prenume": "Gheorghe"
    },
    "status": "aprobat",
    "rejectedOtherApplications": 2,
    "updatedAt": "2025-12-12T16:00:00.000Z"
  }
}
```

**Response Fields:**
- `rejectedOtherApplications`: Count of auto-rejected applications

**Error Responses:**
- `400`: Invalid application ID
- `403`: User is not a profesor or doesn't own this application
- `404`: Application not found
- `409`: Application not pending, or session capacity exceeded
- `500`: Server error

**Error Examples:**

Session capacity exceeded:
```json
{
  "success": false,
  "message": "Session has reached its limit of 5 approved students"
}
```

Application already processed:
```json
{
  "success": false,
  "message": "Application is already aprobat. Cannot change status."
}
```

---

### 4. Reject Application
**Endpoint:** `PATCH /api/profesor/applications/:id/reject`

**Description:** Reject a student's application with justification.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (number): Application ID

**Request Body:**
```json
{
  "justificare": "Student does not meet the required prerequisites for this dissertation topic"
}
```

**Parameters:**
- `justificare` (string, required): Rejection reason (min 10 characters)

**Validations:**
- Justification must be provided
- Justification must be at least 10 characters long
- Application must be pending
- Professor must own the application

**Success Response (200):**
```json
{
  "success": true,
  "message": "Application rejected successfully",
  "data": {
    "id": 1,
    "studentId": 2,
    "student": {
      "id": 2,
      "nume": "Popa",
      "prenume": "Andrei"
    },
    "sesiuneId": 1,
    "sesiune": {
      "id": 1,
      "dataInceput": "2025-01-15T09:00:00.000Z",
      "dataSfarsit": "2025-02-15T17:00:00.000Z",
      "limitaStudenti": 5
    },
    "profesorId": 1,
    "profesor": {
      "id": 1,
      "nume": "Ionescu",
      "prenume": "Gheorghe"
    },
    "status": "respins",
    "justificareRespingere": "Student does not meet the required prerequisites for this dissertation topic",
    "updatedAt": "2025-12-12T16:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid application ID or missing/invalid justification
- `403`: User is not a profesor or doesn't own this application
- `404`: Application not found
- `409`: Application not pending
- `500`: Server error

**Error Examples:**

Missing justification:
```json
{
  "success": false,
  "message": "Justification (justificare) is required for rejection"
}
```

Justification too short:
```json
{
  "success": false,
  "message": "Justification must be at least 10 characters long"
}
```

---

## Approval Workflow

### Step 1: Professor Views Pending Applications
```bash
curl -X GET "http://localhost:3000/api/profesor/applications?status=pending" \
  -H "Authorization: Bearer <token>"
```

### Step 2: Professor Reviews Application
```bash
curl -X GET http://localhost:3000/api/profesor/applications/1 \
  -H "Authorization: Bearer <token>"
```

### Step 3a: Approve Application
```bash
curl -X PATCH http://localhost:3000/api/profesor/applications/1/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Result:**
- Application status changed to `aprobat`
- All other pending applications from same student auto-rejected
- Count of auto-rejected applications returned

### Step 3b: Reject Application
```bash
curl -X PATCH http://localhost:3000/api/profesor/applications/1/reject \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "justificare": "Student does not meet prerequisites for advanced dissertation work"
  }'
```

**Result:**
- Application status changed to `respins`
- Justification saved for student review

---

## Business Rules

### 1. Session Capacity Enforcement
- Cannot approve more applications than `sesiune.limitaStudenti`
- Returns `409 Conflict` if capacity exceeded
- Checked before approval is committed

### 2. One Student - One Approval
- When a student is approved by one professor, all their other pending applications are automatically rejected
- Rejection reason: "Auto-rejected: Student approved by another professor"
- Ensures a student cannot be approved by multiple professors
- Implemented using database transaction (atomic operation)

### 3. Status Transitions
- `pending` → `aprobat` (via approve endpoint)
- `pending` → `respins` (via reject endpoint)
- Cannot change status of already processed applications

### 4. Justification Required
- Rejection requires a justification from professor
- Used to inform student why their application was declined
- Minimum 10 characters

---

## Testing with cURL

### List Pending Applications for All Sessions
```bash
curl -X GET "http://localhost:3000/api/profesor/applications?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List Applications for Specific Session
```bash
curl -X GET "http://localhost:3000/api/profesor/applications?sesiuneId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Application Details
```bash
curl -X GET http://localhost:3000/api/profesor/applications/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve Application
```bash
curl -X PATCH http://localhost:3000/api/profesor/applications/1/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Reject Application
```bash
curl -X PATCH http://localhost:3000/api/profesor/applications/1/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "justificare": "Does not meet academic requirements for this dissertation topic"
  }'
```

---

## Transaction Safety

Approval operation uses database transaction to ensure:
- Atomicity: Either all changes succeed or none do
- Consistency: All related applications are updated together
- Isolation: No partial states visible during operation

If any step fails, entire operation is rolled back.

---

## Notes

- All timestamps are in ISO 8601 UTC format
- Approval automatically triggers rejection of competing applications
- Only pending applications can be approved or rejected
- Professors can only access their own applications
- Student email included in application details for contact purposes
