import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import ProfesorDashboard from './pages/ProfesorDashboard'

function App() {
  return (
    <Router>
      <Box minH="100vh" bg="gray.50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/profesor/dashboard" element={<ProfesorDashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </Router>
  )
}

export default App
