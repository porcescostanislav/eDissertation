/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  return EMAIL_REGEX.test(email)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long',
    }
  }
  return {
    isValid: true,
    message: 'Password is valid',
  }
}

/**
 * Validate name (first or last name)
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid
 */
export const isValidName = (name) => {
  return name && name.trim().length >= 2
}

/**
 * Validate registration form data
 * @param {object} data - Form data
 * @returns {object} Validation result
 */
export const validateRegisterForm = (data) => {
  const errors = {}

  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message
  }

  if (!isValidName(data.nume)) {
    errors.nume = 'Last name must be at least 2 characters'
  }

  if (!isValidName(data.prenume)) {
    errors.prenume = 'First name must be at least 2 characters'
  }

  if (!data.role) {
    errors.role = 'Please select a role'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate login form data
 * @param {object} data - Form data
 * @returns {object} Validation result
 */
export const validateLoginForm = (data) => {
  const errors = {}

  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!data.password) {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
