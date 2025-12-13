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
   * @returns {Promise<Object>} Response with success status and session data array
   * @throws {Error} If request fails
   */
  getAvailableSessions: async () => {
    try {
      const response = await studentAPI.get('/student/sessions')
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to fetch sessions')
    }
  },

  /**
   * Get student's current applications
   * @returns {Promise<Object>} Response with success status and applications array
   * @throws {Error} If request fails
   */
  getApplications: async () => {
    try {
      const response = await studentAPI.get('/student/applications')
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to fetch applications')
    }
  },

  /**
   * Submit an application to a session
   * @param {number} sesiuneId - Session ID
   * @param {number} profesorId - Professor ID
   * @returns {Promise<Object>} Response with success status and application data
   * @throws {Error} If submission fails
   */
  submitApplication: async (sesiuneId, profesorId) => {
    try {
      const response = await studentAPI.post('/student/applications', {
        sesiuneId,
        profesorId,
      })
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to submit application')
    }
  },

  /**
   * Get application details
   * @param {number} applicationId - Application ID
   * @returns {Promise<Object>} Response with success status and application data
   * @throws {Error} If request fails
   */
  getApplicationDetails: async (applicationId) => {
    try {
      const response = await studentAPI.get(`/student/applications/${applicationId}`)
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to fetch application details')
    }
  },

  /**
   * Upload signed file for an approved application
   * @param {number} applicationId - Application ID
   * @param {File} file - PDF file to upload
   * @returns {Promise<Object>} Response with success status and updated application data
   * @throws {Error} If upload fails
   */
  uploadSignedFile: async (applicationId, file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await studentAPI.post(
        `/student/applications/${applicationId}/upload-signed`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to upload signed file')
    }
  },
}

export default studentService
