import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Container,
  VStack,
  Box,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react'
import { InputField, PrimaryButton } from '../components'
import authService from '../services/authService'
import { validateLoginForm } from '../utils/validation'

export const LoginPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    const validation = validateLoginForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.login(formData.email, formData.password)

      if (response.success) {
        // Save token and user info
        authService.saveToken(response.data.token)
        authService.saveUser(response.data.user)

        toast({
          title: 'Login successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3,
          isClosable: true,
        })

        // Redirect based on role
        const redirectPath = response.data.user.role === 'profesor' 
          ? '/profesor/dashboard' 
          : '/student/dashboard'
        navigate(redirectPath)
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
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
            Welcome Back
          </Heading>
          <Text color="gray.600">
            Sign in to your dissertation management account
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
              Sign In
            </PrimaryButton>
          </VStack>
        </Box>

        <Box textAlign="center">
          <Text color="gray.600">
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#3182ce', fontWeight: 'bold' }}>
              Create one now
            </Link>
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}

export default LoginPage
