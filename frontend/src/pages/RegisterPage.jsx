import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Container,
  VStack,
  Box,
  Heading,
  Text,
  Select,
  useToast,
} from '@chakra-ui/react'
import { InputField, PrimaryButton } from '../components'
import authService from '../services/authService'
import { validateRegisterForm } from '../utils/validation'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nume: '',
    prenume: '',
    role: '',
    limitaStudenti: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const validation = validateRegisterForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.register(
        formData.email,
        formData.password,
        formData.nume,
        formData.prenume,
        formData.role,
        formData.limitaStudenti
      )

      if (response.success) {
        // Save token
        authService.saveToken(response.data.token)
        
        // Create normalized user object from response data
        const userInfo = {
          userId: response.data.userId,
          email: response.data.email,
          role: response.data.role,
          nome: formData.prenume,
          prenume: formData.nume,
          profesor: response.data.profesor || null,
          student: response.data.student || null,
        }
        authService.saveUser(userInfo)

        toast({
          title: 'Account created successfully',
          description: 'Welcome to Dissertation Manager!',
          status: 'success',
          duration: 3,
          isClosable: true,
        })

        // Redirect based on role
        const redirectPath = response.data.role === 'profesor' 
          ? '/profesor/dashboard' 
          : '/student/dashboard'
        navigate(redirectPath)
      }
    } catch (error) {
      // Extract error message from Axios error response structure
      const errorMessage = 
        error.response?.data?.message ||    // Backend error message (HTTP 4xx)
        error.message ||                     // Network or Error object message
        'An error occurred during registration'  // Default fallback
      
      toast({
        title: 'Registration failed',
        description: errorMessage,
        status: 'error',
        duration: 5,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="sm" py={{ base: '12', md: '24' }}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={2}>
            Create Account
          </Heading>
          <Text color="gray.600">
            Join the dissertation management platform
          </Text>
        </Box>

        <Box
          as="form"
          onSubmit={handleSubmit}
          w="full"
          borderWidth={1}
          borderRadius="lg"
          p={8}
          boxShadow="sm"
        >
          <VStack spacing={6}>
            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              isRequired
            />

            <InputField
              label="Last Name"
              name="nume"
              type="text"
              placeholder="Doe"
              value={formData.nume}
              onChange={handleChange}
              error={errors.nume}
              isRequired
            />

            <InputField
              label="First Name"
              name="prenume"
              type="text"
              placeholder="John"
              value={formData.prenume}
              onChange={handleChange}
              error={errors.prenume}
              isRequired
            />

            <Box w="full">
              <Text mb={2} fontSize="sm" fontWeight="500">
                Role <Text as="span" color="red.500">*</Text>
              </Text>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="Select your role"
              >
                <option value="student">Student</option>
                <option value="profesor">Professor</option>
              </Select>
              {errors.role && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.role}
                </Text>
              )}
            </Box>

            {formData.role === 'profesor' && (
              <InputField
                label="Max Students"
                name="limitaStudenti"
                type="number"
                placeholder="e.g., 5"
                value={formData.limitaStudenti}
                onChange={handleChange}
                error={errors.limitaStudenti}
              />
            )}

            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              isRequired
            />

            <PrimaryButton
              type="submit"
              isLoading={isLoading}
            >
              Create Account
            </PrimaryButton>
          </VStack>
        </Box>

        <Box textAlign="center">
          <Text color="gray.600">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3182ce', fontWeight: 'bold' }}>
              Sign in here
            </Link>
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}

export default RegisterPage
