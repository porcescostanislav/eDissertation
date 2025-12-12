# Authentication Forms & Frontend Setup

## Overview
Complete authentication system with Login and Register forms integrated with the backend API.

## Frontend Structure

### Pages
- **LoginPage** (`src/pages/LoginPage.jsx`)
  - Email and password input fields
  - Form validation
  - Token storage and user redirect
  - Link to registration page

- **RegisterPage** (`src/pages/RegisterPage.jsx`)
  - Email, name (first & last), role selection, password inputs
  - Form validation
  - Account creation with role selection
  - Token storage and user redirect

- **StudentDashboard** (`src/pages/StudentDashboard.jsx`)
  - Protected student dashboard
  - Displays user information
  - Logout functionality

- **ProfesorDashboard** (`src/pages/ProfesorDashboard.jsx`)
  - Protected professor dashboard
  - Displays user information
  - Role validation
  - Logout functionality

### Components
- **InputField** (`src/components/InputField.jsx`)
  - Reusable text/email/password input
  - Label support
  - Error message display
  - Required field indicator

- **PrimaryButton** (`src/components/PrimaryButton.jsx`)
  - Primary action button
  - Loading state
  - Disabled state
  - Smooth hover animations

### Services
- **authService** (`src/services/authService.js`)
  - `register(email, password, nume, prenume, role)` - Create new account
  - `login(email, password)` - User login
  - `saveToken(token)` - Store JWT in localStorage
  - `getToken()` - Retrieve stored token
  - `saveUser(user)` - Store user info
  - `getUser()` - Retrieve user info
  - `logout()` - Clear stored data
  - **Axios interceptor** - Automatically adds Authorization header to requests

### Utilities
- **validation.js** (`src/utils/validation.js`)
  - `isValidEmail(email)` - Email format validation
  - `validatePassword(password)` - Password strength check (min 6 chars)
  - `isValidName(name)` - Name validation (min 2 chars)
  - `validateLoginForm(data)` - Complete login form validation
  - `validateRegisterForm(data)` - Complete register form validation

## Authentication Flow

### Registration
1. User fills out registration form (email, name, role, password)
2. Client-side validation checks:
   - Valid email format
   - Password at least 6 characters
   - Names at least 2 characters
   - Role selected
3. If valid, send POST request to `/api/auth/register`
4. Backend creates user and returns JWT token
5. Token and user info stored in localStorage
6. User redirected to role-based dashboard:
   - Students → `/student/dashboard`
   - Professors → `/profesor/dashboard`
7. Toast notification shows success/error

### Login
1. User enters email and password
2. Client-side validation checks:
   - Valid email format
   - Password not empty
3. If valid, send POST request to `/api/auth/login`
4. Backend validates credentials and returns JWT token
5. Token and user info stored in localStorage
6. User redirected to role-based dashboard
7. Toast notification shows success/error

### Protected Routes
Dashboard pages check for stored user data:
- If no token, redirect to `/login`
- Professor dashboard additionally verifies role === 'profesor'
- If role mismatch, redirect to appropriate dashboard

## API Endpoints

### Authentication
- `POST /api/auth/register`
  - Request: `{ email, password, nume, prenume, role }`
  - Response: `{ success, data: { token, user } }`

- `POST /api/auth/login`
  - Request: `{ email, password }`
  - Response: `{ success, data: { token, user } }`

## Setup & Running

### Install Dependencies
```bash
cd frontend
npm install
```

### Run Development Server
```bash
npm run dev
```
Server runs on `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## Component Usage Examples

### Using InputField
```javascript
<InputField
  label="Email"
  name="email"
  type="email"
  placeholder="user@example.com"
  value={formData.email}
  onChange={handleChange}
  error={errors.email}
  isRequired
/>
```

### Using PrimaryButton
```javascript
<PrimaryButton
  type="submit"
  isLoading={isLoading}
>
  Sign In
</PrimaryButton>
```

### Using authService
```javascript
// Register
const response = await authService.register(
  email, password, nume, prenume, role
)
authService.saveToken(response.data.token)
authService.saveUser(response.data.user)

// Login
const response = await authService.login(email, password)
authService.saveToken(response.data.token)

// Get current user
const user = authService.getUser()

// Logout
authService.logout()
```

## Directory Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── InputField.jsx
│   │   ├── PrimaryButton.jsx
│   │   └── index.js
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── StudentDashboard.jsx
│   │   └── ProfesorDashboard.jsx
│   ├── services/
│   │   └── authService.js
│   ├── utils/
│   │   └── validation.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## Key Features

✓ Email validation
✓ Password validation (minimum 6 characters)
✓ Form error messages
✓ Loading states on buttons
✓ JWT token storage and retrieval
✓ Automatic token injection in API requests
✓ Role-based dashboard routing
✓ Protected routes with auth checks
✓ User information display
✓ Logout functionality
✓ Toast notifications for success/error
✓ Chakra UI styling
✓ Responsive design
✓ Real API integration via axios

## Notes

- Tokens are stored in localStorage (consider using httpOnly cookies for production)
- User info is also stored in localStorage for quick access
- All API requests automatically include the Bearer token
- Email validation uses regex pattern
- Passwords are never stored locally
- Dashboard pages redirect unauthenticated users to login
