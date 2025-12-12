import { useState } from 'react'
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
    <div className="container">
      <h1>React + Vite Frontend</h1>
      
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <div className="card">
        <button onClick={fetchFromBackend}>
          Call Backend API
        </button>
        {message && <p>{message}</p>}
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
