# Authentication API Documentation

## Overview
This backend implements JWT-based authentication with bcrypt password hashing. Users can register as either `student` or `profesor`, and receive JWT tokens upon login.

## Endpoints

### 1. Register User
**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user and create associated Student or Profesor record.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "role": "student",
  "nume": "Popescu",
  "prenume": "Ion",
  "limitaStudenti": 10
}
```

**Parameters:**
- `email` (string, required): User email address (must be unique)
- `password` (string, required): User password (min 8 characters recommended)
- `role` (string, required): Either `student` or `profesor`
- `nume` (string, required): Last name
- `prenume` (string, required): First name
- `limitaStudenti` (number, optional): Only for `profesor` role. Maximum number of students. Default: 0

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "role": "student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid role
- `409`: Email already registered
- `500`: Server error

---

### 2. Login User
**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user with email and password, receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Parameters:**
- `email` (string, required): User email
- `password` (string, required): User password

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "role": "profesor",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profesor": {
      "id": 1,
      "nume": "Popescu",
      "prenume": "Ion",
      "limitaStudenti": 10
    }
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid email or password
- `500`: Server error

---

### 3. Get Current User
**Endpoint:** `GET /api/me`

**Description:** Get information about the currently authenticated user.

**Authentication:** Required (Bearer token in Authorization header)

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "role": "professor"
  }
}
```

**Error Responses:**
- `401`: Missing or invalid token
- `500`: Server error

---

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Format
Tokens are JWT (JSON Web Tokens) that expire after the time specified in `JWT_EXPIRE` environment variable (default: 7 days).

### Token Payload
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "student",
  "iat": 1702478400,
  "exp": 1703083200
}
```

---

## Testing with cURL

### Register as Professor
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof@university.edu",
    "password": "Prof123456!",
    "role": "profesor",
    "nume": "Ionescu",
    "prenume": "Gheorghe",
    "limitaStudenti": 8
  }'
```

### Register as Student
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "Student123456!",
    "role": "student",
    "nume": "Popa",
    "prenume": "Andrei"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof@university.edu",
    "password": "Prof123456!"
  }'
```

### Access Protected Endpoint (replace TOKEN with actual JWT)
```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer TOKEN"
```

---

## Environment Variables

Required in `.env` file:

```
DATABASE_URL="mysql://user:password@host:port/database"
JWT_SECRET="your-secret-key-for-signing-tokens"
JWT_REFRESH_SECRET="your-secret-key-for-refresh-tokens"
JWT_EXPIRE="7d"
```

---

## Security Notes

1. **Password Hashing**: All passwords are hashed using bcrypt (10 salt rounds)
2. **JWT Secrets**: Change `JWT_SECRET` in production to a strong random string
3. **HTTPS**: Use HTTPS in production for all authentication endpoints
4. **Token Validation**: Tokens are verified using the JWT_SECRET
5. **Email Uniqueness**: Each email can only be registered once

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Missing required fields | Ensure all required fields are provided |
| 401 | Invalid email or password | Check credentials |
| 401 | Invalid or expired token | Login again to get a new token |
| 409 | Email already registered | Use a different email |
| 500 | Internal server error | Check server logs |

