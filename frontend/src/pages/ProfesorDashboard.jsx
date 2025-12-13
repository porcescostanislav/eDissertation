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
  const [approvedApplications, setApprovedApplications] = useState([])
  const [enrolledStudents, setEnrolledStudents] = useState({})
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingApps, setIsLoadingApps] = useState(true)
  const [isSubmittingSession, setIsSubmittingSession] = useState(false)
  const [isProcessingApp, setIsProcessingApp] = useState(false)
  const [isUploadingResponse, setIsUploadingResponse] = useState(false)
  const [isRejectingApproved, setIsRejectingApproved] = useState(false)
  const [selectedApprovedApp, setSelectedApprovedApp] = useState(null)
  const [responseFile, setResponseFile] = useState(null)
  const [approvedRejectReason, setApprovedRejectReason] = useState('')
  const [approvedRejectErrors, setApprovedRejectErrors] = useState({})
  const { isOpen: isUploadResponseOpen, onOpen: onUploadResponseOpen, onClose: onUploadResponseClose } = useDisclosure()
  const { isOpen: isRejectApprovedOpen, onOpen: onRejectApprovedOpen, onClose: onRejectApprovedClose } = useDisclosure()

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
  const [approvalsError, setApprovalsError] = useState('')

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
      const [pendingResponse, approvedResponse] = await Promise.all([
        profesorService.getApplications('pending'),
        profesorService.getApplications('approved'),
      ])
      
      if (pendingResponse.success) {
        setApplications(pendingResponse.data || [])
      }
      if (approvedResponse.success) {
        setApprovedApplications(approvedResponse.data || [])
      }
    } catch (error) {
      toast({
        title: 'Error loading applications',
        description: error.message || 'Failed to load applications',
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
    setApprovalsError('')
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

        // Reload both applications and sessions to update enrolled count
        await Promise.all([loadApplications(), loadSessions()])
      }
    } catch (error) {
      setApprovalsError(error.message || 'Failed to approve application')
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

        // Reset and reload both applications and sessions
        setRejectReason('')
        setRejectErrors({})
        onRejectClose()
        await Promise.all([loadApplications(), loadSessions()])
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

  const handleUploadResponseClick = (application) => {
    setSelectedApprovedApp(application)
    setResponseFile(null)
    onUploadResponseOpen()
  }

  const handleDownloadUnsignedTemplate = async (application) => {
    try {
      await profesorService.downloadUnsignedTemplate(application.id)
      toast({
        title: 'Template downloaded',
        description: 'The unsigned template has been downloaded',
        status: 'success',
        duration: 3,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error.message || 'Failed to download template',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    }
  }

  const handleResponseFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
          status: 'error',
          duration: 4,
          isClosable: true,
        })
        return
      }
      setResponseFile(file)
    }
  }

  const handleSubmitResponseFile = async () => {
    if (!selectedApprovedApp || !responseFile) {
      toast({
        title: 'Missing file',
        description: 'Please select a PDF file to upload',
        status: 'error',
        duration: 4,
        isClosable: true,
      })
      return
    }

    setIsUploadingResponse(true)
    try {
      const response = await profesorService.uploadResponseFile(
        selectedApprovedApp.id,
        responseFile
      )

      if (response.success) {
        toast({
          title: 'Response file uploaded',
          description: 'Your response file has been uploaded successfully',
          status: 'success',
          duration: 4,
          isClosable: true,
        })

        // Reload applications
        loadApplications()
        onUploadResponseClose()
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload response file',
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsUploadingResponse(false)
    }
  }

  const handleRejectApprovedClick = (application) => {
    setSelectedApprovedApp(application)
    setApprovedRejectReason('')
    setApprovedRejectErrors({})
    onRejectApprovedOpen()
  }

  const validateApprovedRejectReason = () => {
    const errors = {}

    if (!approvedRejectReason.trim()) {
      errors.reason = 'Rejection reason is required'
    } else if (approvedRejectReason.trim().length < 10) {
      errors.reason = 'Rejection reason must be at least 10 characters'
    }

    return errors
  }

  const handleSubmitRejectApproved = async () => {
    const errors = validateApprovedRejectReason()
    if (Object.keys(errors).length > 0) {
      setApprovedRejectErrors(errors)
      return
    }

    setIsRejectingApproved(true)
    try {
      const response = await profesorService.unapproveApplication(
        selectedApprovedApp.id,
        approvedRejectReason
      )

      if (response.success) {
        toast({
          title: 'Application rejected',
          description: 'The student must resubmit their signed file',
          status: 'success',
          duration: 4,
          isClosable: true,
        })

        // Reset and reload both applications and sessions
        setApprovedRejectReason('')
        setApprovedRejectErrors({})
        onRejectApprovedClose()
        await Promise.all([loadApplications(), loadSessions()])
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
      setIsRejectingApproved(false)
    }
  }

  const handleToggleEnrolledStudents = async (sessionId) => {
    // If already expanded and clicked again, collapse it
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null)
      return
    }

    // If not in cache, fetch it
    if (!enrolledStudents[sessionId]) {
      setIsLoadingEnrolled(true)
      try {
        const response = await profesorService.getEnrolledStudents(sessionId)
        console.log('Enrolled students response:', response)
        if (response.success) {
          setEnrolledStudents((prev) => ({
            ...prev,
            [sessionId]: response.data || [],
          }))
        } else {
          throw new Error(response.message || 'Failed to load enrolled students')
        }
      } catch (error) {
        console.error('Error loading enrolled students:', error)
        toast({
          title: 'Error loading enrolled students',
          description: error.message || 'Failed to load enrolled students',
          status: 'error',
          duration: 5,
          isClosable: true,
        })
      } finally {
        setIsLoadingEnrolled(false)
      }
    }

    // Expand this session
    setExpandedSessionId(sessionId)
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
                  <VStack align="stretch" spacing={4}>
                    {/* Top section: Info on left, Buttons on right */}
                    <HStack justify="space-between" align="flex-start" w="full" spacing={6}>
                      {/* Left: Enrolled Counter and Session Details */}
                      <VStack align="start" spacing={4} flex={1}>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Enrolled</Text>
                          <Text fontSize="3xl" fontWeight="bold">{session.enrolledCount} / {session.limitaStudenti}</Text>
                        </Box>
                        <Grid templateColumns="repeat(5, 1fr)" gap={3} w="full">
                          <GridItem>
                            <Text fontSize="sm" color="gray.600">Start Date</Text>
                            <Text fontWeight="bold" fontSize="sm">
                              {new Date(session.dataInceput).toLocaleDateString()} {new Date(session.dataInceput).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </GridItem>
                          <GridItem>
                            <Text fontSize="sm" color="gray.600">End Date</Text>
                            <Text fontWeight="bold" fontSize="sm">
                              {new Date(session.dataSfarsit).toLocaleDateString()} {new Date(session.dataSfarsit).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </GridItem>
                          <GridItem>
                            <Text fontSize="sm" color="gray.600">Student Limit</Text>
                            <Text fontWeight="bold" fontSize="sm">{session.limitaStudenti} students</Text>
                          </GridItem>
                          <GridItem>
                            <Text fontSize="sm" color="gray.600">Session ID</Text>
                            <Text fontWeight="bold" fontSize="sm">#{session.id}</Text>
                          </GridItem>
                          <GridItem>
                            <Text fontSize="sm" color="gray.600">Status</Text>
                            <Badge colorScheme="blue" mt={1} display="inline-block" fontSize="sm">ACTIVE</Badge>
                          </GridItem>
                        </Grid>
                      </VStack>

                      {/* Right: Buttons */}
                      <VStack align="stretch" spacing={2} w="auto" minW="150px" marginTop={0}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => handleToggleEnrolledStudents(session.id)}
                          isLoading={isLoadingEnrolled && expandedSessionId === session.id}
                          w="full"
                        >
                          {expandedSessionId === session.id ? 'Hide' : 'Show'} Students
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleTerminateSessionClick(session)}
                          isDisabled={session.enrolledCount > 0}
                          title={session.enrolledCount > 0 ? `Cannot delete session with ${session.enrolledCount} student(s) enrolled` : 'Click to terminate session'}
                          w="full"
                        >
                          Terminate
                        </Button>
                      </VStack>
                    </HStack>

                    {/* Enrolled Students Section */}
                    {expandedSessionId === session.id && (
                      <Box w="full" borderTop="1px" borderColor="blue.200" pt={4} mt={4}>
                        <Heading size="sm" mb={3}>Enrolled Students</Heading>
                        {isLoadingEnrolled && !enrolledStudents[session.id] ? (
                          <HStack>
                            <Spinner size="sm" />
                            <Text>Loading students...</Text>
                          </HStack>
                        ) : enrolledStudents[session.id] && enrolledStudents[session.id].length > 0 ? (
                          <VStack align="stretch" spacing={2}>
                            {enrolledStudents[session.id].map((student) => (
                              <Box key={student.applicationId} p={3} bg="white" borderRadius="md" borderLeft="4px" borderColor="green.400">
                                <HStack justify="space-between">
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="bold">
                                      {student.studentName}
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                      {student.studentEmail}
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                      Enrolled: {new Date(student.enrolledDate).toLocaleDateString()}
                                    </Text>
                                  </VStack>
                                  <Text fontSize="sm" fontWeight="bold" color="green.600">
                                    Session ID: {session.id}
                                  </Text>
                                </HStack>
                              </Box>
                            ))}
                          </VStack>
                        ) : (
                          <Text color="gray.500" fontSize="sm">No enrolled students yet</Text>
                        )}
                      </Box>
                    )}
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

          {approvalsError && (
            <Alert status="error" borderRadius="md" mb={4}>
              <AlertIcon />
              {approvalsError}
            </Alert>
          )}

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
                            Session ID: {application.sesiune.id}
                          </Text>
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

        <Divider />

        {/* Approved Applications Section */}
        <Box>
          <Heading size="lg" mb={4}>Approved Applications ({approvedApplications.length})</Heading>

          {isLoadingApps ? (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text>Loading approved applications...</Text>
            </HStack>
          ) : approvedApplications.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text>No approved applications at the moment.</Text>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {approvedApplications.map((application) => (
                <Box key={application.id} borderWidth={1} borderRadius="lg" p={6} bg="green.50" borderColor="green.300">
                  <Grid templateColumns="1fr auto" gap={6} align="start">
                    <GridItem>
                      <VStack align="start" spacing={3}>
                        <Box>
                          <Heading size="md">
                            {application.student.prenume} {application.student.nume}
                          </Heading>
                          <Text fontSize="sm" color="gray.600">
                            Approved on: {new Date(application.updatedAt).toLocaleDateString()}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontSize="sm" fontWeight="bold" color="gray.700">Session:</Text>
                          <Text fontSize="sm">
                            {new Date(application.sesiune.dataInceput).toLocaleDateString()} - {new Date(application.sesiune.dataSfarsit).toLocaleDateString()}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Capacity: {application.sesiune.limitaStudenti} students
                          </Text>
                        </Box>

                        {application.fisierSemnatUrl && (
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={1}>Student's Signed File:</Text>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              as="a"
                              href={`http://localhost:3000${application.fisierSemnatUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </Button>
                          </Box>
                        )}

                        {application.fisierRaspunsUrl && (
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={1}>Your Response File:</Text>
                            <Button
                              size="sm"
                              colorScheme="purple"
                              variant="outline"
                              as="a"
                              href={`http://localhost:3000${application.fisierRaspunsUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </Button>
                          </Box>
                        )}
                      </VStack>
                    </GridItem>

                    <GridItem>
                      <VStack spacing={2} w="200px">
                        
                        <Button
                          colorScheme="purple"
                          w="full"
                          size="sm"
                          onClick={() => handleUploadResponseClick(application)}
                          isLoading={isUploadingResponse}
                          isDisabled={!application.fisierSemnatUrl}
                          title={!application.fisierSemnatUrl ? 'Student must upload signed file first' : 'Upload your response'}
                        >
                          {application.fisierRaspunsUrl ? 'Update Response' : 'Upload Response'}
                        </Button>
                        <Button
                          colorScheme="red"
                          variant="outline"
                          w="full"
                          size="sm"
                          onClick={() => handleRejectApprovedClick(application)}
                          isDisabled={isRejectingApproved}
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

      {/* Upload Response File Modal */}
      <Modal isOpen={isUploadResponseOpen} onClose={onUploadResponseClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Response File</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedApprovedApp && (
              <VStack spacing={4} align="start">
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Upload your response for {selectedApprovedApp.student.prenume} {selectedApprovedApp.student.nume}
                  </Text>
                  <Box p={4} bg="green.50" borderRadius="md" borderLeft="4px" borderColor="green.500">
                    <Text fontSize="sm" mb={2}>
                      <strong>Status:</strong> Approved
                    </Text>
                    <Text fontSize="sm">
                      <strong>Applied:</strong> {new Date(selectedApprovedApp.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                </Box>
                <Box w="full" p={4} borderWidth={2} borderStyle="dashed" borderColor="blue.300" borderRadius="md" bg="blue.50" textAlign="center">
                  <input
                    type="file"
                    accept=".pdf"
                    id="response-file-input"
                    onChange={handleResponseFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="response-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                    {responseFile ? (
                      <VStack spacing={2}>
                        <Text fontSize="sm" fontWeight="bold" color="green.700">
                          ✓ {responseFile.name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          Click to change file
                        </Text>
                      </VStack>
                    ) : (
                      <VStack spacing={2}>
                        <Text fontSize="sm" fontWeight="bold" color="blue.700">
                          Click to upload PDF file
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          or drag and drop
                        </Text>
                      </VStack>
                    )}
                  </label>
                </Box>
                <Alert status="info" borderRadius="md" w="full">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Upload your response document (PDF format). This will be visible to the student.
                  </Text>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onUploadResponseClose}>
                Cancel
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleSubmitResponseFile}
                isLoading={isUploadingResponse}
                isDisabled={!responseFile}
              >
                Upload File
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Approved Application Modal */}
      <Modal isOpen={isRejectApprovedOpen} onClose={onRejectApprovedClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Approved Application</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedApprovedApp && (
              <VStack spacing={4}>
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Warning!</Text>
                    <Text fontSize="sm">
                      This action will reject the application and clear the student's signed file. They will need to resubmit a new signed file.
                    </Text>
                  </Box>
                </Alert>
                <Box p={4} bg="red.50" borderRadius="md" borderLeft="4px" borderColor="red.500" w="full">
                  <Text fontWeight="bold" mb={2}>
                    {selectedApprovedApp.student.prenume} {selectedApprovedApp.student.nume}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    You are about to reject this approved student application. Please provide a reason.
                  </Text>
                </Box>

                <FormControl isInvalid={!!approvedRejectErrors.reason} w="full">
                  <FormLabel>Rejection Reason</FormLabel>
                  <Textarea
                    placeholder="Explain why you are rejecting this approved application..."
                    value={approvedRejectReason}
                    onChange={(e) => setApprovedRejectReason(e.target.value)}
                    minH="100px"
                  />
                  {approvedRejectErrors.reason && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {approvedRejectErrors.reason}
                    </Text>
                  )}
                </FormControl>

                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    The student will see this reason when they receive the rejection notification.
                  </Text>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onRejectApprovedClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleSubmitRejectApproved}
                isLoading={isRejectingApproved}
              >
                Reject Application
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default ProfesorDashboard
