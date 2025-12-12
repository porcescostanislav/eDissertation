import { useState } from 'react'
import { Box, Container, VStack, Heading } from '@chakra-ui/react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  const fetchFromBackend = async () => {
    try {
      const response = await fetch('/api/hello')
      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      setMessage('Error fetching from backend')
      console.error(error)
    }
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6}>
        <Heading as="h1" size="2xl">React + Vite + Chakra UI</Heading>
        
        <Box borderWidth={1} borderRadius="lg" p={6} w="full">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </Box>

        <Box borderWidth={1} borderRadius="lg" p={6} w="full">
          <button onClick={fetchFromBackend}>
            Call Backend API
          </button>
          {message && <p>{message}</p>}
        </Box>
      </VStack>
    </Container>
  )
}

export default App
