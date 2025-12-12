import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Box,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import authService from '../services/authService'

export const ProfesorDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = authService.getUser()
    if (!savedUser) {
      navigate('/login')
      return
    }
    // Verify it's a profesor
    if (savedUser.role !== 'profesor') {
      navigate('/student/dashboard')
      return
    }
    setUser(savedUser)
  }, [navigate])

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="2xl" mb={2}>
            Professor Dashboard
          </Heading>
          <Text color="gray.600">Welcome, Prof. {user.prenume} {user.nume}!</Text>
        </Box>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text>
            This is a professor dashboard. Here you can manage enrollment sessions, 
            view student applications, and approve or reject dissertations.
          </Text>
        </Alert>

        <Box borderWidth={1} borderRadius="lg" p={6}>
          <VStack spacing={4} align="start">
            <Heading size="md">Account Information</Heading>
            <Text><strong>Email:</strong> {user.email}</Text>
            <Text><strong>Name:</strong> {user.prenume} {user.nume}</Text>
            <Text><strong>Role:</strong> {user.role}</Text>
          </VStack>
        </Box>

        <Button colorScheme="red" onClick={handleLogout} w="full">
          Logout
        </Button>
      </VStack>
    </Container>
  )
}

export default ProfesorDashboard
