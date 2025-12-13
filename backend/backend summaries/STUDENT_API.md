# Student Endpoints - Dissertation Application API

## Overview
This API allows students to view available enrollment sessions and submit dissertation applications (CerereDisertatie). All endpoints require authentication with a JWT token and student role.

## Base URL
```
http://localhost:3000/api/student
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. View Available Sessions
**Endpoint:** `GET /api/student/sessions`

**Description:** Get list of currently active enrollment sessions that student can apply to.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Available sessions retrieved successfully",
  "data": [
    {
      "id": 1,
      "profesorId": 1,
      "profesor": {
        "id": 1,
        "nume": "Ionescu",
        "prenume": "Gheorghe"
      },
      "dataInceput": "2025-01-15T09:00:00.000Z",
      "dataSfarsit": "2025-02-15T17:00:00.000Z",
      "limitaStudenti": 5,
      "enrolledCount": 2,
      "availableSlots": 3,
      "alreadyApplied": false,
      "canApply": true,
      "createdAt": "2025-12-12T10:00:00.000Z"
    },
    {
      "id": 2,
      "profesorId": 1,
      "profesor": {
        "id": 1,
        "nume": "Ionescu",
        "prenume": "Gheorghe"
      },
      "dataInceput": "2025-02-01T09:00:00.000Z",
      "dataSfarsit": "2025-03-01T17:00:00.000Z",
      "limitaStudenti": 8,
      "enrolledCount": 5,
      "availableSlots": 3,
      "alreadyApplied": true,
      "canApply": false,
      "createdAt": "2025-12-12T10:05:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "available": 1
  }
}
```

**Response Fields:**
- `alreadyApplied`: Whether student has already applied to this session
- `canApply`: Whether student can submit an application (has available slots AND hasn't applied yet)

**Error Responses:**
- `403`: User is not a student
- `500`: Server error

---

### 2. Submit Dissertation Application
**Endpoint:** `POST /api/student/applications`

**Description:** Create a new dissertation application to a professor's enrollment session.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sesiuneId": 1,
  "profesorId": 1
}
```

**Parameters:**
- `sesiuneId` (number, required): ID of the enrollment session
- `profesorId` (number, required): ID of the professor

**Validations:**
- Session must exist
- Professor must own the session
- **Session must be currently active** (between start and end date)
- Session must have available slots
- Student cannot apply to the same session twice
- Unique constraint: one application per student per session

**Success Response (201):**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "id": 5,
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
    "status": "pending",
    "createdAt": "2025-12-12T15:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid IDs, or professor doesn't own session
- `403`: User is not a student
- `404`: Session or student not found
- `409`: Session not active, full, or student already applied
- `500`: Server error

**Error Examples:**

Session not yet active:
```json
{
  "success": false,
  "message": "Cannot enroll in a session that has not started yet"
}
```

Session full:
```json
{
  "success": false,
  "message": "Session is full (5/5 slots)"
}
```

Already applied:
```json
{
  "success": false,
  "message": "You have already applied to this session",
  "data": {
    "applicationId": 5,
    "status": "pending"
  }
}
```

---

### 3. List Student's Applications
**Endpoint:** `GET /api/student/applications`

**Description:** Get all dissertation applications submitted by the student.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters:**
- `status` (optional): Filter by application status
  - `pending`: Awaiting professor review
  - `aprobat`: Approved by professor
  - `respins`: Rejected by professor
  - If omitted: all statuses

**Success Response (200):**
```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [
    {
      "id": 5,
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
      "status": "pending",
      "justificareRespingere": null,
      "fisierSemnatUrl": null,
      "fisierRaspunsUrl": null,
      "createdAt": "2025-12-12T15:30:00.000Z",
      "updatedAt": "2025-12-12T15:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1
  }
}
```

**Error Responses:**
- `403`: User is not a student
- `500`: Server error

---

### 4. Get Application Details
**Endpoint:** `GET /api/student/applications/:id`

**Description:** Get details of a specific dissertation application.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (number): Application ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Application retrieved successfully",
  "data": {
    "id": 5,
    "studentId": 2,
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
- `403`: User is not a student or doesn't own this application
- `404`: Application not found
- `500`: Server error

---

## Application Statuses

| Status | Meaning | Set By |
|--------|---------|--------|
| `pending` | Awaiting professor review | Auto-set on submission |
| `aprobat` | Approved by professor | Professor via admin/approval endpoint |
| `respins` | Rejected by professor | Professor via rejection endpoint |

---

## Workflow Example

### Step 1: Student Views Available Sessions
```bash
curl -X GET http://localhost:3000/api/student/sessions \
  -H "Authorization: Bearer <token>"
```

Response shows:
- Session 1: Active, 3 slots available, can apply
- Session 2: Active, full (0 slots), cannot apply
- Session 3: Already applied, cannot apply again

### Step 2: Student Submits Application
```bash
curl -X POST http://localhost:3000/api/student/applications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sesiuneId": 1,
    "profesorId": 1
  }'
```

Response: Application created with status `pending`

### Step 3: Student Checks Application Status
```bash
curl -X GET http://localhost:3000/api/student/applications \
  -H "Authorization: Bearer <token>"
```

Shows all applications with their current status.

### Step 4: Check Specific Application
```bash
curl -X GET http://localhost:3000/api/student/applications/5 \
  -H "Authorization: Bearer <token>"
```

---

## Testing with cURL

### View Available Sessions
```bash
curl -X GET http://localhost:3000/api/student/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Submit Application
```bash
curl -X POST http://localhost:3000/api/student/applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sesiuneId": 1,
    "profesorId": 1
  }'
```

### List Applications
```bash
curl -X GET http://localhost:3000/api/student/applications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List Pending Applications Only
```bash
curl -X GET "http://localhost:3000/api/student/applications?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Application Details
```bash
curl -X GET http://localhost:3000/api/student/applications/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Key Constraints

1. **Active Session Required**: Applications can only be submitted to currently active sessions (between start and end dates)
2. **Unique Per Session**: Each student can apply to a session only once (unique constraint on `studentId`, `sesiuneId`)
3. **Capacity Limits**: Cannot exceed session's `limitaStudenti`
4. **Professor Ownership**: Session must belong to the specified professor
5. **Student Ownership**: Students can only view/access their own applications

---

## Related Endpoints (Professor)

Professors can approve or reject applications via:
- (To be implemented) `PATCH /api/profesor/applications/:id/approve`
- (To be implemented) `PATCH /api/profesor/applications/:id/reject`

---

## Notes

- All timestamps are in ISO 8601 UTC format
- Enrollment count and available slots are calculated in real-time
- `alreadyApplied` flag helps frontend decide whether to show application form
- `canApply` boolean indicates if student should be able to click submit button
