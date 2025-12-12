# Profesor Endpoints - Enrollment Sessions API

## Overview
This API allows professors to manage their enrollment sessions (SesiuneInscriere). All endpoints require authentication with a JWT token and profesor role.

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

### 1. Create Enrollment Session
**Endpoint:** `POST /api/profesor/sessions`

**Description:** Create a new enrollment session with temporal overlap validation.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "dataInceput": "2025-02-01T09:00:00Z",
  "dataSfarsit": "2025-03-01T17:00:00Z",
  "limitaStudenti": 5
}
```

**Parameters:**
- `dataInceput` (string, required): Session start date/time (ISO 8601 format)
- `dataSfarsit` (string, required): Session end date/time (ISO 8601 format)
- `limitaStudenti` (number, required): Maximum number of students allowed (≥1)

**Validations:**
- Start date must be before end date
- Student limit cannot exceed professor's maximum limit
- **New session cannot overlap temporally with professor's existing sessions**

**Success Response (201):**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "id": 5,
    "profesorId": 1,
    "profesor": {
      "id": 1,
      "nume": "Ionescu",
      "prenume": "Gheorghe"
    },
    "dataInceput": "2025-02-01T09:00:00.000Z",
    "dataSfarsit": "2025-03-01T17:00:00.000Z",
    "limitaStudenti": 5,
    "createdAt": "2025-12-12T15:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid values
- `403`: User is not a profesor
- `409`: Temporal overlap with existing session
- `500`: Server error

---

### 2. List Professor's Sessions
**Endpoint:** `GET /api/profesor/sessions`

**Description:** Retrieve all enrollment sessions for the authenticated professor with optional filtering.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by session status
  - `all` (default): Return all sessions
  - `active`: Sessions currently running
  - `upcoming`: Sessions that haven't started yet
  - `past`: Sessions that have ended

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": [
    {
      "id": 1,
      "profesorId": 1,
      "dataInceput": "2025-01-15T09:00:00.000Z",
      "dataSfarsit": "2025-02-15T17:00:00.000Z",
      "limitaStudenti": 5,
      "enrolledCount": 2,
      "availableSlots": 3,
      "status": "active",
      "createdAt": "2025-12-12T10:00:00.000Z"
    },
    {
      "id": 2,
      "profesorId": 1,
      "dataInceput": "2025-03-01T09:00:00.000Z",
      "dataSfarsit": "2025-04-01T17:00:00.000Z",
      "limitaStudenti": 8,
      "enrolledCount": 0,
      "availableSlots": 8,
      "status": "upcoming",
      "createdAt": "2025-12-12T10:05:00.000Z"
    }
  ],
  "pagination": {
    "total": 2
  }
}
```

**Error Responses:**
- `403`: User is not a profesor
- `500`: Server error

---

### 3. Get Session Details
**Endpoint:** `GET /api/profesor/sessions/:id`

**Description:** Get detailed information about a specific enrollment session including enrollments.

**Request Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (number): Session ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session retrieved successfully",
  "data": {
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
    "status": "active",
    "enrollments": [
      {
        "id": 1,
        "student": {
          "id": 1,
          "nume": "Popescu",
          "prenume": "Maria"
        },
        "status": "aprobat",
        "createdAt": "2025-12-12T14:00:00.000Z"
      },
      {
        "id": 2,
        "student": {
          "id": 2,
          "nume": "Georgescu",
          "prenume": "Ion"
        },
        "status": "pending",
        "createdAt": "2025-12-12T14:30:00.000Z"
      }
    ],
    "createdAt": "2025-12-12T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid session ID
- `403`: User is not a profesor or doesn't own this session
- `404`: Session not found
- `500`: Server error

---

### 4. Update Session
**Endpoint:** `PUT /api/profesor/sessions/:id`

**Description:** Update an existing enrollment session. Only possible if session hasn't started yet.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` (number): Session ID

**Request Body (all fields optional):**
```json
{
  "dataInceput": "2025-02-05T09:00:00Z",
  "dataSfarsit": "2025-03-05T17:00:00Z",
  "limitaStudenti": 6
}
```

**Validations:**
- Session must not have started
- New dates must not overlap with other sessions
- Student limit must accommodate current enrollments
- Student limit cannot exceed professor's maximum

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session updated successfully",
  "data": {
    "id": 1,
    "profesorId": 1,
    "profesor": {
      "id": 1,
      "nume": "Ionescu",
      "prenume": "Gheorghe"
    },
    "dataInceput": "2025-02-05T09:00:00.000Z",
    "dataSfarsit": "2025-03-05T17:00:00.000Z",
    "limitaStudenti": 6,
    "createdAt": "2025-12-12T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid input or no fields to update
- `403`: User is not a profesor or doesn't own this session
- `404`: Session not found
- `409`: Session has already started, or date conflict, or enrollment conflict
- `500`: Server error

---

### 5. Delete Session
**Endpoint:** `DELETE /api/profesor/sessions/:id`

**Description:** Delete an enrollment session. Only possible if no students are enrolled.

**Request Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (number): Session ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Error Responses:**
- `400`: Invalid session ID
- `403`: User is not a profesor or doesn't own this session
- `404`: Session not found
- `409`: Session has enrollments and cannot be deleted
- `500`: Server error

---

## Temporal Overlap Validation

The system automatically prevents creating sessions that overlap in time with a professor's existing sessions.

### Overlap Logic
Two sessions overlap if:
```
new_start < existing_end AND new_end > existing_start
```

### Examples

**✅ Allowed - No overlap:**
- Existing: 2025-01-01 to 2025-02-01
- New: 2025-02-01 to 2025-03-01 ✓ (starts exactly when other ends)

**❌ Not allowed - Overlapping:**
- Existing: 2025-01-01 to 2025-02-15
- New: 2025-02-01 to 2025-03-01 ✗ (overlaps from 2025-02-01 to 2025-02-15)

**❌ Not allowed - Contained:**
- Existing: 2025-01-01 to 2025-03-01
- New: 2025-01-15 to 2025-02-15 ✗ (completely contained within existing)

---

## Testing with cURL

### Create Session
```bash
curl -X POST http://localhost:3000/api/profesor/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataInceput": "2025-02-01T09:00:00Z",
    "dataSfarsit": "2025-03-01T17:00:00Z",
    "limitaStudenti": 5
  }'
```

### List All Sessions
```bash
curl -X GET http://localhost:3000/api/profesor/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List Active Sessions
```bash
curl -X GET "http://localhost:3000/api/profesor/sessions?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Session Details
```bash
curl -X GET http://localhost:3000/api/profesor/sessions/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Session
```bash
curl -X PUT http://localhost:3000/api/profesor/sessions/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limitaStudenti": 6
  }'
```

### Delete Session
```bash
curl -X DELETE http://localhost:3000/api/profesor/sessions/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Status Field

Sessions have a computed status based on current time:
- **upcoming**: Start date is in the future
- **active**: Currently running (between start and end date)
- **past**: End date has passed

---

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Additional details (optional)"
}
```

---

## Notes

1. All timestamps are returned in ISO 8601 UTC format
2. Student enrollment count and available slots are calculated in real-time
3. Only the professor who created a session can view or modify it
4. Dates must be provided in ISO 8601 format (e.g., "2025-02-01T09:00:00Z")
5. Professor's `limitaStudenti` is their maximum across all sessions
