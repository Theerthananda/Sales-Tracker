const rateLimit = require('express-rate-limit');

// Rate limiting for notification creation
const notificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 50 notification requests per windowMs
  message: {
    success: false,
    message: 'Too many notification requests. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default key generator which properly handles IPv6
  skip: (req) => {
    // Skip rate limiting for system notifications
    return req.body?.isSystem === true;
  }
});

// Notification spam prevention middleware
const preventNotificationSpam = (req, res, next) => {
  const { title, message, recipient } = req.body;

  // Basic spam detection
  if (title && title.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Notification title too long (max 100 characters)',
      error: 'TITLE_TOO_LONG'
    });
  }

  if (message && message.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Notification message too long (max 500 characters)',
      error: 'MESSAGE_TOO_LONG'
    });
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /[A-Z]{20,}/, // Too many caps
    /\b(URGENT|ALERT|WARNING)\b.*\b(URGENT|ALERT|WARNING)\b/i // Repeated urgent words
  ];

  const content = `${title} ${message}`;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(content));

  if (isSuspicious) {
    console.warn(`Suspicious notification detected from user ${req.user?.id}: ${title}`);
    // Log but don't block - might be legitimate
  }

  next();
};

// Notification validation middleware
const validateNotificationData = (req, res, next) => {
  const { title, message, type, recipient } = req.body;

  // Required fields validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid title is required',
      error: 'INVALID_TITLE'
    });
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid message is required',
      error: 'INVALID_MESSAGE'
    });
  }

  // Type validation
  const validTypes = ['info', 'success', 'warning', 'error'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid notification type',
      error: 'INVALID_TYPE'
    });
  }

  // Recipient validation (for manual notifications)
  if (recipient && !require('mongoose').Types.ObjectId.isValid(recipient)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid recipient ID',
      error: 'INVALID_RECIPIENT'
    });
  }

  // Sanitize inputs
  req.body.title = title.trim().substring(0, 100);
  req.body.message = message.trim().substring(0, 500);
  req.body.type = type || 'info';

  next();
};

module.exports = {
  notificationRateLimit,
  preventNotificationSpam,
  validateNotificationData
};
