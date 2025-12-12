import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

const authAPI = axios.create({
  baseURL: API_BASE_URL,
})

// Add token to requests if it exists
authAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} nume - Last name
   * @param {string} prenume - First name
   * @param {string} role - 'student' or 'profesor'
   * @param {number} limitaStudenti - Max students (for profesor only)
   * @returns {Promise} Response with token and user data
   */
  register: async (email, password, nume, prenume, role, limitaStudenti) => {
    try {
      const response = await authAPI.post('/auth/register', {
        email,
        password,
        nume,
        prenume,
        role,
        limitaStudenti: limitaStudenti ? parseInt(limitaStudenti) : 0,
      })
      return response.data
    } catch (error) {
      // Re-throw the Axios error to preserve error.response structure
      throw error
    }
  },

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Response with token and user data
   */
  login: async (email, password) => {
    try {
      const response = await authAPI.post('/auth/login', {
        email,
        password,
      })
      return response.data
    } catch (error) {
      // Re-throw the Axios error to preserve error.response structure
      throw error
    }
  },

  /**
   * Save token to localStorage
   * @param {string} token - JWT token
   */
  saveToken: (token) => {
    localStorage.setItem('token', token)
  },

  /**
   * Get token from localStorage
   * @returns {string|null} JWT token or null
   */
  getToken: () => {
    return localStorage.getItem('token')
  },

  /**
   * Remove token from localStorage
   */
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  /**
   * Save user info to localStorage
   * @param {object} user - User object
   */
  saveUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
  },

  /**
   * Get user from localStorage
   * @returns {object|null} User object or null
   */
  getUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
}

export default authService
