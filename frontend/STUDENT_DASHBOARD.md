# Student Dashboard Implementation

## Overview
The StudentDashboard component provides a complete interface for students to:
- View their personal account information
- Browse available dissertation sessions from professors
- Submit applications to sessions
- Track the status of their applications (pending, approved, rejected)
- View rejection reasons if an application was rejected

## Features Implemented

### 1. Account Information Section
- Displays student's email, name, and role
- Professional card-based layout with blue background

### 2. My Applications Section
- Shows all applications submitted by the student
- Displays application status with color-coded badges:
  - **Orange**: Pending review
  - **Green**: Approved
  - **Red**: Rejected
- Shows rejection reason if application was rejected
- Empty state message when no applications exist

### 3. Available Sessions Section
- Lists all currently open dissertation sessions
- For each session displays:
  - Professor's name
  - Student capacity limit
  - Session start and end dates with times
  - Apply button (disabled if already applied)
- Grayed out appearance for sessions the student has already applied to
- Empty state message when no sessions are available

### 4. Application Workflow
- Click "Apply Now" button to open confirmation modal
- Modal shows session details and confirmation message
- Student must confirm before application is submitted
- Real-time feedback via toast notifications
- After successful submission, applications list updates automatically

### 5. Data Management
- Automatic data refresh on component mount
- Manual reload capability via API calls
- Prevents duplicate applications (disabled button if already applied)
- Shows current application status on session cards for reapplied sessions

## Components & Services

### StudentDashboard Component (`src/pages/StudentDashboard.jsx`)
**State:**
- `user` - Current logged-in student
- `sessions` - List of available sessions
- `applications` - List of student's applications
- `isLoadingSessions` - Loading state for sessions
- `isLoadingApps` - Loading state for applications
- `isSubmitting` - Loading state during application submission
- `selectedSession` - Currently selected session in modal

**Methods:**
- `loadSessions()` - Fetches available sessions from API
- `loadApplications()` - Fetches student's applications from API
- `handleApplyClick()` - Opens confirmation modal and validates
- `handleSubmitApplication()` - Submits application to selected session
- `getStatusColor()` - Returns badge color based on status
- `getStatusLabel()` - Returns readable status label
- `hasAppliedToSession()` - Checks if student already applied
- `getApplicationForSession()` - Gets application data for session
- `handleLogout()` - Logs out student and redirects to login

### studentService (`src/services/studentService.js`)
**Methods:**
- `getAvailableSessions()` - GET `/api/student/sessions`
- `getApplications()` - GET `/api/student/applications`
- `submitApplication(sesiuneId)` - POST `/api/student/applications`
- `getApplicationDetails(applicationId)` - GET `/api/student/applications/:id`

**Features:**
- Automatic Bearer token injection in Authorization header
- Error handling with meaningful error messages
- Promise-based API calls with try/catch support

## API Endpoints Used

### GET /api/student/sessions
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "profesorId": 1,
      "dataInceput": "2025-01-15T09:00:00Z",
      "dataSfarsit": "2025-02-15T17:00:00Z",
      "limitaStudenti": 5,
      "profesor": {
        "id": 1,
        "nume": "Ionescu",
        "prenume": "Gheorghe"
      }
    }
  ]
}
```

### GET /api/student/applications
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "studentId": 2,
      "sesiuneId": 1,
      "profesorId": 1,
      "status": "pending",
      "justificareRespingere": null,
      "createdAt": "2025-12-12T15:30:00Z",
      "sesiune": {
        "id": 1,
        "dataInceput": "2025-01-15T09:00:00Z",
        "dataSfarsit": "2025-02-15T17:00:00Z",
        "profesor": {
          "prenume": "Gheorghe",
          "nume": "Ionescu"
        }
      }
    }
  ]
}
```

### POST /api/student/applications
**Request:**
```json
{
  "sesiuneId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "studentId": 2,
    "sesiuneId": 1,
    "profesorId": 1,
    "status": "pending",
    "createdAt": "2025-12-12T16:45:00Z"
  }
}
```

## User Experience Flow

1. **Initial Load**
   - Student logs in → redirected to `/student/dashboard`
   - Component mounts, loads sessions and applications in parallel
   - Displays loading spinners while fetching data

2. **Browse Sessions**
   - Student sees list of available sessions
   - Each session shows professor info, dates, and capacity
   - Sessions already applied to are grayed out with disabled button

3. **Submit Application**
   - Student clicks "Apply Now" on a session
   - Confirmation modal opens showing session details
   - Student reviews and confirms by clicking "Confirm Application"
   - Application is submitted to backend
   - Toast notification shows success/error
   - Applications list automatically refreshes

4. **Track Status**
   - "My Applications" section shows all submitted applications
   - Color-coded badges indicate status (pending/approved/rejected)
   - If rejected, reason is displayed for student information

5. **Logout**
   - Student can logout anytime from top-right button
   - Token and user data cleared from localStorage
   - Redirected to login page

## Error Handling

All errors are handled gracefully:
- Network errors show toast notifications
- Duplicate application attempts blocked with info toast
- Failed submissions show error messages
- Loading states prevent multiple simultaneous requests

## UI Components Used (Chakra UI)

- **Container** - Main layout container
- **VStack/HStack** - Vertical and horizontal stacking
- **Box** - Generic container
- **Heading/Text** - Typography
- **Button** - Actions (Apply, Logout, Confirm)
- **Badge** - Status indicators
- **Alert** - Information and warnings
- **Spinner** - Loading indicators
- **Grid/GridItem** - Responsive layouts
- **Modal** - Confirmation dialog
- **useToast** - Toast notifications
- **useDisclosure** - Modal state management

## Styling Features

- Professional card-based design
- Color-coded status badges
- Responsive grid layouts
- Hover effects on interactive elements
- Loading states with spinners
- Empty state messages
- Visual distinction for applied sessions (grayed out)
- Informational boxes with colored left borders

## Integration Points

**With authService:**
- Gets current user from localStorage
- Validates authentication on component mount
- Redirects to login if not authenticated

**With studentService:**
- Fetches sessions and applications
- Submits new applications
- Handles API communication

**With React Router:**
- Uses useNavigate for redirects
- Links protected dashboard to login

## Future Enhancements

Possible additions:
- Filter sessions by date range
- Search professors by name
- Sort applications by status or date
- View more session details (requirements, etc.)
- Download application documents
- Real-time notifications of application status changes
- Application timeline/history
- Scheduled session auto-refresh
