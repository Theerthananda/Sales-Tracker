const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
//auth middleware
const authMiddleware = (req, res, next) => {
  try {
    // Try to get token from Authorization header first (for mobile compatibility)
    let token = req.headers.authorization?.replace('Bearer ', '');

    // Fallback to cookie if no Authorization header (for web browsers)
    if (!token) {
      token = req.cookies?.ctoken;
    }

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
//admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (optional)
  skipSuccessfulRequests: false,
  // Skip failed requests (optional) 
  skipFailedRequests: false,
});

module.exports = { authMiddleware, adminMiddleware, limiter };
