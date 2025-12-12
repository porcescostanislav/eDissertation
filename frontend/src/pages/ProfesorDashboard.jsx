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
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react'
import authService from '../services/authService'
import profesorService from '../services/profesorService'

export const ProfesorDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { isOpen: isSessionOpen, onOpen: onSessionOpen, onClose: onSessionClose } = useDisclosure()
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure()
  const { isOpen: isTerminateOpen, onOpen: onTerminateOpen, onClose: onTerminateClose } = useDisclosure()

  const [user, setUser] = useState(null)
  const [profesorData, setProfessorData] = useState(null)
  const [sessions, setSessions] = useState([])
  const [applications, setApplications] = useState([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingApps, setIsLoadingApps] = useState(true)
  const [isSubmittingSession, setIsSubmittingSession] = useState(false)
  const [isProcessingApp, setIsProcessingApp] = useState(false)

  const [sessionForm, setSessionForm] = useState({
    dataInceput: '',
    dataSfarsit: '',
    limitaStudenti: '',
  })
  const [sessionErrors, setSessionErrors] = useState({})

  const [selectedApplication, setSelectedApplication] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectErrors, setRejectErrors] = useState({})
  const [selectedSessionForTerminate, setSelectedSessionForTerminate] = useState(null)
  const [isTerminating, setIsTerminating] = useState(false)

  useEffect(() => {
    const savedUser = authService.getUser()
    if (!savedUser) {
      navigate('/login')
      return
    }
    if (savedUser.role !== 'profesor') {
      navigate('/student/dashboard')
      return
    }
    setUser(savedUser)
    
    // Set profesor data from saved user
    if (savedUser.profesor) {
      setProfessorData(savedUser.profesor)
    }

    // Load sessions and applications
    loadSessions()
    loadApplications()
  }, [navigate])

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true)
      const response = await profesorService.getSessions()
      if (response.success) {
        setSessions(response.data || [])
      }
    } catch (error) {
      toast({
        title: 'Error loading sessions',
        description: error.message || 'Failed to load your sessions',
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
      const response = await profesorService.getApplications('pending')
      if (response.success) {
        setApplications(response.data || [])
      }
    } catch (error) {
      toast({
        title: 'Error loading applications',
        description: error.message || 'Failed to load pending applications',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsLoadingApps(false)
    }
  }

  const validateSessionForm = () => {
    const errors = {}

    if (!sessionForm.dataInceput) {
      errors.dataInceput = 'Start date is required'
    }

    if (!sessionForm.dataSfarsit) {
      errors.dataSfarsit = 'End date is required'
    }

    if (sessionForm.dataInceput && sessionForm.dataSfarsit) {
      const start = new Date(sessionForm.dataInceput)
      const end = new Date(sessionForm.dataSfarsit)
      if (start >= end) {
        errors.dataSfarsit = 'End date must be after start date'
      }
    }

    if (!sessionForm.limitaStudenti) {
      errors.limitaStudenti = 'Student limit is required'
    } else if (isNaN(sessionForm.limitaStudenti) || parseInt(sessionForm.limitaStudenti) < 1) {
      errors.limitaStudenti = 'Student limit must be a positive number'
    }

    return errors
  }

  const handleSessionChange = (e) => {
    const { name, value } = e.target
    setSessionForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (sessionErrors[name]) {
      setSessionErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleCreateSession = async () => {
    const errors = validateSessionForm()
    if (Object.keys(errors).length > 0) {
      setSessionErrors(errors)
      return
    }

    setIsSubmittingSession(true)
    try {
      const response = await profesorService.createSession(
        sessionForm.dataInceput,
        sessionForm.dataSfarsit,
        parseInt(sessionForm.limitaStudenti)
      )

      if (response.success) {
        toast({
          title: 'Session created',
          description: 'Your new session has been created successfully',
          status: 'success',
          duration: 4,
          isClosable: true,
        })

        // Reset form and reload sessions
        setSessionForm({
          dataInceput: '',
          dataSfarsit: '',
          limitaStudenti: '',
        })
        setSessionErrors({})
        onSessionClose()
        loadSessions()
      }
    } catch (error) {
      toast({
        title: 'Error creating session',
        description: error.message || 'Failed to create session',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsSubmittingSession(false)
    }
  }

  const validateRejectReason = () => {
    const errors = {}

    if (!rejectReason.trim()) {
      errors.reason = 'Rejection reason is required'
    } else if (rejectReason.trim().length < 10) {
      errors.reason = 'Rejection reason must be at least 10 characters'
    }

    return errors
  }

  const handleRejectClick = (application) => {
    setSelectedApplication(application)
    setRejectReason('')
    setRejectErrors({})
    onRejectOpen()
  }

  const handleApproveApplication = async (applicationId) => {
    setIsProcessingApp(true)
    try {
      const response = await profesorService.approveApplication(applicationId)

      if (response.success) {
        // Handle both possible response structures
        const studentName = response.data.student 
          ? `${response.data.student?.prenume || ''} ${response.data.student?.nume || ''}`.trim()
          : 'Student'
        
        toast({
          title: 'Application approved',
          description: `${studentName}'s application has been approved`,
          status: 'success',
          duration: 4,
          isClosable: true,
        })

        // Reload applications
        loadApplications()
      }
    } catch (error) {
      toast({
        title: 'Error approving application',
        description: error.message || 'Failed to approve application',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsProcessingApp(false)
    }
  }

  const handleRejectApplication = async () => {
    const errors = validateRejectReason()
    if (Object.keys(errors).length > 0) {
      setRejectErrors(errors)
      return
    }

    setIsProcessingApp(true)
    try {
      const response = await profesorService.rejectApplication(
        selectedApplication.id,
        rejectReason
      )

      if (response.success) {
        // Handle both possible response structures
        const studentName = response.data.student 
          ? `${response.data.student?.prenume || ''} ${response.data.student?.nume || ''}`.trim()
          : 'Student'
        
        toast({
          title: 'Application rejected',
          description: `${studentName}'s application has been rejected`,
          status: 'success',
          duration: 4,
          isClosable: true,
        })

        // Reset and reload
        setRejectReason('')
        setRejectErrors({})
        onRejectClose()
        loadApplications()
      }
    } catch (error) {
      toast({
        title: 'Error rejecting application',
        description: error.message || 'Failed to reject application',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsProcessingApp(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const handleTerminateSessionClick = (session) => {
    setSelectedSessionForTerminate(session)
    onTerminateOpen()
  }

  const handleConfirmTerminateSession = async () => {
    if (!selectedSessionForTerminate) return

    setIsTerminating(true)
    try {
      const response = await profesorService.deleteSession(selectedSessionForTerminate.id)

      if (response.success) {
        toast({
          title: 'Session terminated',
          description: 'The session has been successfully terminated',
          status: 'success',
          duration: 4,
          isClosable: true,
        })

        // Reload sessions
        loadSessions()
        onTerminateClose()
      }
    } catch (error) {
      toast({
        title: 'Error terminating session',
        description: error.message || 'Failed to terminate session',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsTerminating(false)
    }
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
                Professor Dashboard
              </Heading>
              <Text color="gray.600">Welcome, Prof. {user.nome} {user.prenume}!</Text>
            </Box>
            <Button colorScheme="red" onClick={handleLogout}>
              Logout
            </Button>
          </HStack>
        </Box>

        {/* Account Info */}
        <Box borderWidth={1} borderRadius="lg" p={6} bg="purple.50">
          <VStack spacing={3} align="start">
            <Heading size="sm">Account Information</Heading>
            <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
              <GridItem>
                <Text fontSize="sm" color="gray.600">Email</Text>
                <Text fontWeight="bold">{user.email}</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="sm" color="gray.600">Name</Text>
                <Text fontWeight="bold">Prof. {user.nome} {user.prenume}</Text>
              </GridItem>
              {profesorData && (
                <GridItem>
                  <Text fontSize="sm" color="gray.600">Max Student Limit</Text>
                  <Text fontWeight="bold">{profesorData.limitaStudenti || 0}</Text>
                </GridItem>
              )}
            </Grid>
          </VStack>
        </Box>

        <Divider />

        {/* Create Session Section */}
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="lg">Your Sessions</Heading>
            <Button colorScheme="blue" onClick={onSessionOpen}>
              + New Session
            </Button>
          </HStack>

          {isLoadingSessions ? (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text>Loading your sessions...</Text>
            </HStack>
          ) : sessions.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text>You haven't created any sessions yet. Create one to start accepting student applications!</Text>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {sessions.map((session) => (
                <Box key={session.id} borderWidth={1} borderRadius="lg" p={6} bg="blue.50">
                  <VStack align="start" spacing={3}>
                    <HStack justify="space-between" w="full">
                      <Heading size="sm">Session #{session.id}</Heading>
                      <HStack spacing={2}>
                        <Badge colorScheme="blue">Active</Badge>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleTerminateSessionClick(session)}
                          isDisabled={session.enrolledCount > 0}
                          title={session.enrolledCount > 0 ? `Cannot delete session with ${session.enrolledCount} student(s) enrolled` : 'Click to terminate session'}
                        >
                          Terminate
                        </Button>
                      </HStack>
                    </HStack>
                    <Grid templateColumns="repeat(4, 1fr)" gap={4} w="full">
                      <GridItem>
                        <Text fontSize="sm" color="gray.600">Start Date</Text>
                        <Text fontWeight="bold">
                          {new Date(session.dataInceput).toLocaleDateString()} {new Date(session.dataInceput).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </GridItem>
                      <GridItem>
                        <Text fontSize="sm" color="gray.600">End Date</Text>
                        <Text fontWeight="bold">
                          {new Date(session.dataSfarsit).toLocaleDateString()} {new Date(session.dataSfarsit).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </GridItem>
                      <GridItem>
                        <Text fontSize="sm" color="gray.600">Student Limit</Text>
                        <Text fontWeight="bold">{session.limitaStudenti} students</Text>
                      </GridItem>
                      <GridItem>
                        <Text fontSize="sm" color="gray.600">Enrolled</Text>
                        <Text fontWeight="bold">{session.enrolledCount} / {session.limitaStudenti}</Text>
                      </GridItem>
                    </Grid>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <Divider />

        {/* Pending Applications Section */}
        <Box>
          <Heading size="lg" mb={4}>Pending Applications ({applications.length})</Heading>

          {isLoadingApps ? (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text>Loading pending applications...</Text>
            </HStack>
          ) : applications.length === 0 ? (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Text>No pending applications at the moment.</Text>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {applications.map((application) => (
                <Box key={application.id} borderWidth={1} borderRadius="lg" p={6} bg="orange.50" borderColor="orange.300">
                  <Grid templateColumns="1fr auto" gap={6} align="start">
                    <GridItem>
                      <VStack align="start" spacing={3}>
                        <Box>
                          <Heading size="md">
                            {application.student.prenume} {application.student.nume}
                          </Heading>
                          <Text fontSize="sm" color="gray.600">
                            Applied on: {new Date(application.createdAt).toLocaleDateString()}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontSize="sm" fontWeight="bold" color="gray.700">Session Details:</Text>
                          <Text fontSize="sm">
                            Period: {new Date(application.sesiune.dataInceput).toLocaleDateString()} - {new Date(application.sesiune.dataSfarsit).toLocaleDateString()}
                          </Text>
                          <Text fontSize="sm">
                            Capacity: {application.sesiune.limitaStudenti} students
                          </Text>
                        </Box>

                        <Badge colorScheme="orange">Pending Review</Badge>
                      </VStack>
                    </GridItem>

                    <GridItem>
                      <VStack spacing={2}>
                        <Button
                          colorScheme="green"
                          w="full"
                          onClick={() => handleApproveApplication(application.id)}
                          isLoading={isProcessingApp}
                          isDisabled={isProcessingApp}
                        >
                          Approve
                        </Button>
                        <Button
                          colorScheme="red"
                          variant="outline"
                          w="full"
                          onClick={() => handleRejectClick(application)}
                          isDisabled={isProcessingApp}
                        >
                          Reject
                        </Button>
                      </VStack>
                    </GridItem>
                  </Grid>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>

      {/* New Session Modal */}
      <Modal isOpen={isSessionOpen} onClose={onSessionClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Session</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!sessionErrors.dataInceput}>
                <FormLabel>Start Date & Time</FormLabel>
                <Input
                  type="datetime-local"
                  name="dataInceput"
                  value={sessionForm.dataInceput}
                  onChange={handleSessionChange}
                />
                {sessionErrors.dataInceput && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {sessionErrors.dataInceput}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!sessionErrors.dataSfarsit}>
                <FormLabel>End Date & Time</FormLabel>
                <Input
                  type="datetime-local"
                  name="dataSfarsit"
                  value={sessionForm.dataSfarsit}
                  onChange={handleSessionChange}
                />
                {sessionErrors.dataSfarsit && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {sessionErrors.dataSfarsit}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!sessionErrors.limitaStudenti}>
                <FormLabel>Student Limit</FormLabel>
                <Input
                  type="number"
                  name="limitaStudenti"
                  value={sessionForm.limitaStudenti}
                  onChange={handleSessionChange}
                  placeholder="e.g., 5"
                  min="1"
                />
                {sessionErrors.limitaStudenti && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {sessionErrors.limitaStudenti}
                  </Text>
                )}
              </FormControl>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Students will be able to apply to this session during the specified period.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onSessionClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleCreateSession}
                isLoading={isSubmittingSession}
              >
                Create Session
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Application Modal */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Application</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedApplication && (
              <VStack spacing={4}>
                <Box p={4} bg="red.50" borderRadius="md" borderLeft="4px" borderColor="red.500" w="full">
                  <Text fontWeight="bold" mb={2}>
                    {selectedApplication.student.prenume} {selectedApplication.student.nume}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    You are about to reject this student's application. Please provide a reason.
                  </Text>
                </Box>

                <FormControl isInvalid={!!rejectErrors.reason}>
                  <FormLabel>Rejection Reason</FormLabel>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => {
                      setRejectReason(e.target.value)
                      if (rejectErrors.reason) {
                        setRejectErrors((prev) => ({
                          ...prev,
                          reason: '',
                        }))
                      }
                    }}
                    placeholder="Explain why you are rejecting this application (min 10 characters)..."
                    rows={4}
                  />
                  {rejectErrors.reason && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {rejectErrors.reason}
                    </Text>
                  )}
                </FormControl>

                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    The student will see this reason when reviewing their application status.
                  </Text>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onRejectClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleRejectApplication}
                isLoading={isProcessingApp}
              >
                Reject Application
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Terminate Session Modal */}
      <Modal isOpen={isTerminateOpen} onClose={onTerminateClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Terminate Session</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSessionForTerminate && (
              <VStack spacing={4} align="start">
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Are you sure?</Text>
                    <Text fontSize="sm">
                      This will permanently delete the session and all associated application data. This action cannot be undone.
                    </Text>
                  </Box>
                </Alert>
                <Box p={4} bg="gray.50" borderRadius="md" w="full">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>Session Details:</Text>
                  <Text fontSize="sm" mb={1}>
                    <strong>Session ID:</strong> #{selectedSessionForTerminate.id}
                  </Text>
                  <Text fontSize="sm" mb={1}>
                    <strong>Start:</strong> {new Date(selectedSessionForTerminate.dataInceput).toLocaleDateString()}
                  </Text>
                  <Text fontSize="sm">
                    <strong>End:</strong> {new Date(selectedSessionForTerminate.dataSfarsit).toLocaleDateString()}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onTerminateClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmTerminateSession}
                isLoading={isTerminating}
              >
                Terminate Session
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default ProfesorDashboard
