const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic validation)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password && password.length >= 8;
};

/**
 * Sanitize string input to prevent NoSQL injection
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim();
};

/**
 * Validate and sanitize numeric input
 */
const sanitizeNumber = (input, defaultValue = 0) => {
  const num = parseInt(input);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Validate and sanitize float input
 */
const sanitizeFloat = (input, defaultValue = 0.0) => {
  const num = parseFloat(input);
  return isNaN(num) ? defaultValue : num;
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  sanitizeString,
  sanitizeNumber,
  sanitizeFloat
};
