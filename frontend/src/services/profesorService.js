import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

const profesorAPI = axios.create({
  baseURL: API_BASE_URL,
})

// Add token to requests if it exists
profesorAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const profesorService = {
  /**
   * Create a new session
   * @param {object} sessionData - { dataInceput, dataSfarsit, limitaStudenti }
   */
  createSession: async (dataInceput, dataSfarsit, limitaStudenti) => {
    try {
      const response = await profesorAPI.post('/profesor/sessions', {
        dataInceput,
        dataSfarsit,
        limitaStudenti,
      })
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to create session')
    }
  },

  /**
   * Get professor's sessions
   */
  getSessions: async () => {
    try {
      const response = await profesorAPI.get('/profesor/sessions')
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sessions' }
    }
  },

  /**
   * Get session details
   * @param {number} sessionId - Session ID
   */
  getSessionDetails: async (sessionId) => {
    try {
      const response = await profesorAPI.get(`/profesor/sessions/${sessionId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch session details' }
    }
  },

  /**
   * Update session
   * @param {number} sessionId - Session ID
   * @param {object} data - Updated session data
   */
  updateSession: async (sessionId, data) => {
    try {
      const response = await profesorAPI.put(`/profesor/sessions/${sessionId}`, data)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update session' }
    }
  },

  /**
   * Delete session
   * @param {number} sessionId - Session ID
   */
  deleteSession: async (sessionId) => {
    try {
      const response = await profesorAPI.delete(`/profesor/sessions/${sessionId}`)
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to delete session')
    }
  },

  /**
   * Get pending applications
   */
  getApplications: async (status = 'pending') => {
    try {
      const response = await profesorAPI.get(`/profesor/applications?status=${status}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch applications' }
    }
  },

  /**
   * Get application details
   * @param {number} applicationId - Application ID
   */
  getApplicationDetails: async (applicationId) => {
    try {
      const response = await profesorAPI.get(`/profesor/applications/${applicationId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch application details' }
    }
  },

  /**
   * Approve an application
   * @param {number} applicationId - Application ID
   */
  approveApplication: async (applicationId) => {
    try {
      const response = await profesorAPI.patch(
        `/profesor/applications/${applicationId}/approve`,
        {}
      )
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to approve application')
    }
  },

  /**
   * Reject an application
   * @param {number} applicationId - Application ID
   * @param {string} justificare - Rejection justification
   */
  rejectApplication: async (applicationId, justificare) => {
    try {
      const response = await profesorAPI.patch(
        `/profesor/applications/${applicationId}/reject`,
        { justificare }
      )
      return response.data
    } catch (error) {
      const errorData = error.response?.data
      throw new Error(errorData?.message || error.message || 'Failed to reject application')
    }
  },

  /**
   * Download unsigned template for application
   * @param {number} applicationId - Application ID
   */
  downloadUnsignedTemplate: async (applicationId) => {
    try {
      const response = await profesorAPI.get(
        `/profesor/applications/${applicationId}/unsigned-template`,
        {
          responseType: 'blob', // Important for file download
        }
      )
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `dissertation-template-${applicationId}.txt`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      throw error.response?.data || { message: 'Failed to download template' }
    }
  },

  /**
   * Upload response file for an approved application
   * @param {number} applicationId - Application ID
   * @param {File} file - PDF file to upload
   */
  uploadResponseFile: async (applicationId, file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await profesorAPI.post(
        `/profesor/applications/${applicationId}/upload-response`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload response file' }
    }
  },

  /**
   * Reject/unapprove an approved application
   * @param {number} applicationId - Application ID
   * @param {string} justificare - Rejection reason
   */
  unapproveApplication: async (applicationId, justificare) => {
    try {
      const response = await profesorAPI.patch(
        `/profesor/applications/${applicationId}/un-approve`,
        { justificare }
      )
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject application' }
    }
  },

  /**
   * Get enrolled students for a specific session
   */
  getEnrolledStudents: async (sessionId) => {
    try {
      const response = await profesorAPI.get(`/profesor/sessions/${sessionId}/enrolled-students`)
      return response.data
    } catch (error) {
      console.error('getEnrolledStudents error:', error)
      throw error.response?.data || new Error(error.message || 'Failed to fetch enrolled students')
    }
  },
}

export default profesorService
