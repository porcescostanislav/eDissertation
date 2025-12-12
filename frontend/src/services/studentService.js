import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

const studentAPI = axios.create({
  baseURL: API_BASE_URL,
})

// Add token to requests if it exists
studentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const studentService = {
  /**
   * Get all available sessions for students
   */
  getAvailableSessions: async () => {
    try {
      const response = await studentAPI.get('/student/sessions')
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sessions' }
    }
  },

  /**
   * Get student's current applications
   */
  getApplications: async () => {
    try {
      const response = await studentAPI.get('/student/applications')
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch applications' }
    }
  },

  /**
   * Submit an application to a session
   * @param {number} sesiuneId - Session ID
   * @param {number} profesorId - Professor ID
   * @returns {Promise} Response with application data
   */
  submitApplication: async (sesiuneId, profesorId) => {
    try {
      const response = await studentAPI.post('/student/applications', {
        sesiuneId,
        profesorId,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit application' }
    }
  },

  /**
   * Get application details
   * @param {number} applicationId - Application ID
   */
  getApplicationDetails: async (applicationId) => {
    try {
      const response = await studentAPI.get(`/student/applications/${applicationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch application details' }
    }
  },
}

export default studentService
