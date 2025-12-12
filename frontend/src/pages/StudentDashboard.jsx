import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Box,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  Divider,
  Grid,
  GridItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import authService from '../services/authService'
import studentService from '../services/studentService'

export const StudentDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [applications, setApplications] = useState([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingApps, setIsLoadingApps] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    const savedUser = authService.getUser()
    if (!savedUser) {
      navigate('/login')
      return
    }
    setUser(savedUser)
    
    // Fetch sessions and applications
    loadSessions()
    loadApplications()
  }, [navigate])

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true)
      const response = await studentService.getAvailableSessions()
      if (response.success) {
        setSessions(response.data || [])
      }
    } catch (error) {
      toast({
        title: 'Error loading sessions',
        description: error.message || 'Failed to load available sessions',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const loadApplications = async () => {
    try {
      setIsLoadingApps(true)
      const response = await studentService.getApplications()
      if (response.success) {
        setApplications(response.data || [])
      }
    } catch (error) {
      toast({
        title: 'Error loading applications',
        description: error.message || 'Failed to load your applications',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsLoadingApps(false)
    }
  }

  const handleApplyClick = (session) => {
    // Check if already applied to this session
    const hasApplied = applications.some(app => app.sesiuneId === session.id)
    if (hasApplied) {
      toast({
        title: 'Already Applied',
        description: 'You have already applied to this session',
        status: 'info',
        duration: 4,
        isClosable: true,
      })
      return
    }
    
    setSelectedSession(session)
    onOpen()
  }

  const handleSubmitApplication = async () => {
    if (!selectedSession) return

    setIsSubmitting(true)
    try {
      const response = await studentService.submitApplication(
        selectedSession.id,
        selectedSession.profesorId
      )
      
      if (response.success) {
        toast({
          title: 'Application submitted',
          description: `Successfully applied to Prof. ${selectedSession.profesor.prenume} ${selectedSession.profesor.nume}'s session`,
          status: 'success',
          duration: 4,
          isClosable: true,
        })
        
        // Reload applications
        loadApplications()
        onClose()
      }
    } catch (error) {
      toast({
        title: 'Application failed',
        description: error.message || 'Failed to submit application',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'orange'
      case 'aprobat':
      case 'approved':
        return 'green'
      case 'respins':
      case 'rejected':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'aprobat':
      case 'approved':
        return 'Approved'
      case 'respins':
      case 'rejected':
        return 'Rejected'
      case 'pending':
        return 'Pending'
      default:
        return status
    }
  }

  const hasAppliedToSession = (sessionId) => {
    return applications.some(app => app.sesiuneId === sessionId)
  }

  const getApplicationForSession = (sessionId) => {
    return applications.find(app => app.sesiuneId === sessionId)
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="start">
            <Box>
              <Heading as="h1" size="2xl" mb={2}>
                Student Dashboard
              </Heading>
              <Text color="gray.600">Welcome, {user.nome} {user.prenume}!</Text>
            </Box>
            <Button colorScheme="red" onClick={handleLogout}>
              Logout
            </Button>
          </HStack>
        </Box>

        {/* Account Info */}
        <Box borderWidth={1} borderRadius="lg" p={6} bg="blue.50">
          <VStack spacing={3} align="start">
            <Heading size="sm">Account Information</Heading>
            <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
              <GridItem>
                <Text fontSize="sm" color="gray.600">Email</Text>
                <Text fontWeight="bold">{user.email}</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="sm" color="gray.600">Name</Text>
                <Text fontWeight="bold">{user.nome} {user.prenume}</Text>
              </GridItem>
            </Grid>
          </VStack>
        </Box>

        <Divider />

        {/* My Applications Status */}
        <Box>
          <Heading size="lg" mb={4}>My Applications</Heading>
          
          {isLoadingApps ? (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text>Loading your applications...</Text>
            </HStack>
          ) : applications.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text>You haven't submitted any applications yet. Browse available sessions below!</Text>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {applications.map((app) => (
                <Box key={app.id} borderWidth={1} borderRadius="lg" p={4} borderColor="blue.200" bg="blue.50">
                  <HStack justify="space-between" align="start" mb={2}>
                    <VStack align="start" spacing={1}>
                      <Heading size="sm">
                        Prof. {app.sesiune?.profesor?.prenume || 'Unknown'} {app.sesiune?.profesor?.nume || 'Professor'}
                      </Heading>
                      <Text fontSize="sm" color="gray.600">
                        Session: {app.sesiune?.dataInceput ? new Date(app.sesiune.dataInceput).toLocaleDateString() : 'N/A'} - {app.sesiune?.dataSfarsit ? new Date(app.sesiune.dataSfarsit).toLocaleDateString() : 'N/A'}
                      </Text>
                    </VStack>
                    <Badge colorScheme={getStatusColor(app.status)} fontSize="md" px={3} py={1}>
                      {getStatusLabel(app.status)}
                    </Badge>
                  </HStack>
                  {app.status === 'respins' && app.justificareRespingere && (
                    <Box mt={3} p={2} bg="red.100" borderRadius="md" borderLeft="4px" borderColor="red.500">
                      <Text fontSize="sm" fontWeight="bold" color="red.800">Rejection Reason:</Text>
                      <Text fontSize="sm" color="red.700">{app.justificareRespingere}</Text>
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <Divider />

        {/* Available Sessions */}
        <Box>
          <Heading size="lg" mb={4}>Available Sessions</Heading>
          
          {isLoadingSessions ? (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text>Loading available sessions...</Text>
            </HStack>
          ) : sessions.length === 0 ? (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Text>No available sessions at the moment. Please check back later.</Text>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {sessions.map((session) => {
                const alreadyApplied = hasAppliedToSession(session.id)
                const myApplication = getApplicationForSession(session.id)
                
                return (
                  <Box 
                    key={session.id} 
                    borderWidth={1} 
                    borderRadius="lg" 
                    p={6}
                    bg={alreadyApplied ? 'gray.50' : 'white'}
                    borderColor={alreadyApplied ? 'gray.300' : 'gray.200'}
                    opacity={alreadyApplied ? 0.7 : 1}
                  >
                    <Grid templateColumns="1fr auto" gap={6} align="start">
                      <GridItem>
                        <VStack align="start" spacing={3}>
                          <Box>
                            <Heading size="md">
                              Prof. {session.profesor?.prenume || 'Unknown'} {session.profesor?.nume || 'Professor'}
                            </Heading>
                            <Text fontSize="sm" color="gray.600" mt={1}>
                              Student Limit: {session.limitaStudenti}
                            </Text>
                          </Box>
                          
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.700">Session Dates:</Text>
                            <Text fontSize="sm">
                              From: {new Date(session.dataInceput).toLocaleDateString()} at {new Date(session.dataInceput).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text fontSize="sm">
                              To: {new Date(session.dataSfarsit).toLocaleDateString()} at {new Date(session.dataSfarsit).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </Box>

                          {alreadyApplied && myApplication && (
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.700">Your Application Status:</Text>
                              <Badge colorScheme={getStatusColor(myApplication.status)}>
                                {getStatusLabel(myApplication.status)}
                              </Badge>
                            </Box>
                          )}
                        </VStack>
                      </GridItem>

                      <GridItem>
                        <Button
                          colorScheme={alreadyApplied ? 'gray' : 'blue'}
                          onClick={() => handleApplyClick(session)}
                          isDisabled={alreadyApplied}
                          size="lg"
                        >
                          {alreadyApplied ? 'Already Applied' : 'Apply Now'}
                        </Button>
                      </GridItem>
                    </Grid>
                  </Box>
                )
              })}
            </VStack>
          )}
        </Box>
      </VStack>

      {/* Application Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Application</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSession && (
              <VStack spacing={4} align="start">
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Are you sure you want to apply to this session?
                  </Text>
                  <Box p={4} bg="blue.50" borderRadius="md" borderLeft="4px" borderColor="blue.500">
                    <Text fontSize="sm" mb={2}>
                      <strong>Professor:</strong> {selectedSession.profesor?.prenume || 'Unknown'} {selectedSession.profesor?.nume || 'Professor'}
                    </Text>
                    <Text fontSize="sm" mb={2}>
                      <strong>Session Period:</strong> {selectedSession.dataInceput ? new Date(selectedSession.dataInceput).toLocaleDateString() : 'N/A'} - {selectedSession.dataSfarsit ? new Date(selectedSession.dataSfarsit).toLocaleDateString() : 'N/A'}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Student Limit:</strong> {selectedSession.limitaStudenti}
                    </Text>
                  </Box>
                </Box>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Once submitted, your application will be reviewed by the professor. You can only be approved by one professor.
                  </Text>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmitApplication}
                isLoading={isSubmitting}
              >
                Confirm Application
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default StudentDashboard
