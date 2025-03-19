const validator = require("validator");

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  // Escape HTML entities
  return validator.escape(input.trim());
};

/**
 * Sanitizes an object's string properties
 * @param {Object} obj - Object with properties to sanitize
 * @returns {Object} - Object with sanitized properties
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = {};

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "string") {
      sanitized[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  });

  return sanitized;
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - Whether password meets strength requirements
 */
const isStrongPassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 6,
    minLowercase: 1,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 0,
  });
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
  isValidEmail,
  isStrongPassword,
};
