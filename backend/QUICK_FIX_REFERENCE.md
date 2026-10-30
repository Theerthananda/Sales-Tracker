# Quick Security Fix Reference

## Installation Commands

```bash
cd backend
npm install
```

The following packages were added to fix security issues:
- `cookie-parser` - For parsing authentication cookies
- `helmet` - For security headers

---

## Key Changes Summary

### 1. Authentication Security
- ✅ JWT expiration: 100s → 24 hours
- ✅ Cookie security: Environment-dependent secure flag
- ✅ Registration: Users can only register as 'salesperson' (no admin privilege escalation)
- ✅ Rate limiting: 100 requests per 15 minutes on auth endpoints

### 2. Input Validation
- ✅ Email format validation
- ✅ Password strength (min 8 characters)
- ✅ MongoDB ObjectId validation (prevents NoSQL injection)
- ✅ Number sanitization for all numeric inputs

### 3. File Upload Security
- ✅ File type restriction: Only images (jpeg, jpg, png, gif, webp)
- ✅ File size limit: 5MB maximum
- ✅ Secure filename generation

### 4. Server Security
- ✅ Helmet middleware for security headers
- ✅ CORS: Strict origin checking (dev/prod aware)
- ✅ Request body size limit: 10MB
- ✅ Cookie parser configured

---

## New Validation Utilities

Location: `utils/validation.js`

```javascript
const { 
  isValidObjectId,    // Validate MongoDB IDs
  isValidEmail,       // Validate email format
  isValidPassword,    // Check password strength
  sanitizeNumber,     // Safe number parsing
  sanitizeFloat       // Safe float parsing
} = require('../utils/validation');
```

---

## Testing Checklist

- [ ] Install dependencies: `npm install`
- [ ] Test login with valid credentials
- [ ] Test registration (verify users are 'salesperson' role)
- [ ] Test file upload with image
- [ ] Test file upload with non-image (should fail)
- [ ] Test rate limiting (make 101 requests)
- [ ] Verify CORS from allowed/disallowed origins
- [ ] Test with invalid ObjectIds (should return 400)

---

## Environment Variables Required

```env
NODE_ENV=production          # 'development' or 'production'
JWT_SECRET=your-secret-key   # Strong random string
MONGODB_URI=mongodb://...    # MongoDB connection string
FRONTEND_URL=https://...     # Optional: Additional allowed origin
```

---

## Common Issues & Solutions

### Issue: "Cannot read properties of undefined (reading 'ctoken')"
**Solution**: Ensure `cookie-parser` is installed and configured before auth routes

### Issue: "Not allowed by CORS"
**Solution**: Add your frontend URL to `allowedOrigins` array in `server.js` or set `FRONTEND_URL` env variable

### Issue: File upload fails with "Only image files allowed"
**Solution**: Ensure you're uploading jpeg, jpg, png, gif, or webp files

### Issue: "Invalid ID format" errors
**Solution**: Ensure you're passing valid MongoDB ObjectIds (24 hex characters)

---

## Security Best Practices Applied

1. ✅ Principle of Least Privilege (no admin registration)
2. ✅ Input Validation (all user inputs validated)
3. ✅ Defense in Depth (multiple layers of security)
4. ✅ Secure Defaults (strict CORS, secure cookies)
5. ✅ Rate Limiting (brute force protection)
6. ✅ Security Headers (helmet middleware)
7. ✅ File Upload Restrictions (type and size limits)
8. ✅ NoSQL Injection Prevention (ObjectId validation)

---

## Files Modified

- `server.js` - Added helmet, fixed CORS, added body limit
- `controllers/authController.js` - Fixed auth vulnerabilities
- `controllers/salesController.js` - Secured file upload, added validation
- `controllers/adminController.js` - Added validation
- `controllers/visitReportController.js` - Added validation
- `middleware/authMiddleware.js` - Exported rate limiter
- `routes/authRoutes.js` - Applied rate limiter
- `utils/validation.js` - **NEW** validation utilities

---

## Next Steps (Optional Improvements)

1. Add request logging (Morgan/Winston)
2. Implement account lockout after failed logins
3. Add password complexity requirements
4. Add authentication to `/uploads` directory
5. Set up HTTPS redirect in production
6. Add MongoDB connection pooling options

---

**Last Updated**: November 10, 2025
