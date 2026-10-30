# 🚀 Sales Tracker - MERN Application

A comprehensive, secure full-stack web application for tracking field salespersons with GPS verification, photo proof functionality, and detailed visit reporting system.

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/vikasvs007/Swansalespersonapp.git
cd Swansalespersonapp

# Backend setup
cd backend
npm install
# Create .env file with your MongoDB URI and JWT secret
npm start  # Runs on http://localhost:3000

# Frontend setup (in new terminal)
cd frontend
npm install
# Create .env.local with VITE_API_URL=http://localhost:3000
npm run dev  # Runs on http://localhost:5000
```

**Default Login** (after creating admin user):
- Admin: `admin@example.com` / `your-password`
- Salesperson: Register via `/auth/register` endpoint

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Creating Users](#creating-users)
- [API Endpoints](#api-endpoints)
- [Visit Report System](#-visit-report-system)
- [How It Works](#-how-it-works)
- [Project Structure](#project-structure)
- [Security Features](#-security-features)
- [Environment Configuration](#-environment-configuration)
- [Deployment](#-deployment)
- [Database Models](#-database-models)
- [Troubleshooting](#-troubleshooting)
- [Browser Compatibility](#-browser-compatibility)
- [Future Enhancements](#-future-enhancements)

## Features

### For Salespersons
- View assigned locations on an interactive map
- Upload photo proofs with automatic GPS verification
- Track visit history and status
- Real-time location tracking

### For Admins
- Assign locations to salespersons with date and place details
- Monitor all salespersons on a live map with real-time updates
- View detailed tracking history and visit reports
- Detect suspicious uploads (location mismatches beyond 100m radius)
- Dashboard with comprehensive statistics and analytics
- Export visit reports to CSV/Excel format
- Filter and search through all visit reports
- View detailed company/mill information from visits

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT Authentication with HTTP-only cookies
- Multer for secure file uploads
- Haversine formula for GPS distance calculation
- Bcrypt.js for password hashing
- Express Rate Limit for brute-force protection
- Helmet for security headers
- CORS with credentials support
- Cookie Parser for cookie management

**Frontend:**
- React 18 with Vite
- React Router v6 for navigation
- Leaflet & React-Leaflet for interactive maps
- Axios for API calls with cookie support
- Framer Motion for animations
- Lucide React for icons
- TailwindCSS for styling
- Geolocation API for GPS tracking

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB connection string
   - Update `JWT_SECRET` with a secure secret key

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   - Copy `.env.example` to `.env`
   - Update `VITE_API_URL` if your backend runs on a different URL

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:5000`

## Creating Users

### Important: Security Update
For security reasons, the registration endpoint **only creates salesperson accounts**. Admin users must be created manually in the database.

### Create Salesperson (via API)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "sales123"
  }'
```

**Note:** Password must be at least 8 characters long.

### Create Admin User (via MongoDB)
1. First register as a salesperson using the API
2. Then update the role in MongoDB:

```javascript
// Using MongoDB Compass or Shell
db.salespersons.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Or use MongoDB Atlas:
1. Go to Collections → salespersons
2. Find the user by email
3. Edit the document and change `role` to `"admin"`

## API Endpoints

### Authentication (Public)
- `POST /auth/login` - Login with email and password (sets HTTP-only cookie)
- `POST /auth/register` - Register new salesperson (role: salesperson only)

### Salesperson Routes (Authenticated)
- `GET /salesperson/:id/assignments` - Get all assignments for a salesperson
- `POST /salesperson/upload-photo` - Upload visit report with photo and GPS data
- `POST /salesperson/update-location` - Update current location coordinates

### Admin Routes (Admin Only)
- `GET /admin/overview` - Get dashboard statistics (total salespersons, assignments, etc.)
- `GET /admin/salesperson/:id/tracking` - Get detailed tracking data for a salesperson
- `POST /admin/assign-location` - Assign location(s) to salesperson with date
- `GET /admin/live-locations` - Get all salespersons' current live locations
- `GET /admin/salespersons` - Get list of all salespersons

### Visit Reports Routes (Admin Only)
- `GET /visit-reports/all` - Get all visit reports with filters
- `GET /visit-reports/salesperson/:id` - Get reports by specific salesperson
- `GET /visit-reports/:id` - Get single report details
- `GET /visit-reports/stats` - Get visit report statistics
- `GET /visit-reports/export/csv` - Export all reports to CSV file

## 📋 Visit Report System

The application includes a comprehensive visit report system that captures detailed information about each customer visit:

### Report Fields
- **Visit Information**: Date, time in/out, type of visit (First Time/Follow Up)
- **Company Details**: Mill/company name, contact person, mobile number, address
- **Mill/Farm Details**: 
  - Type of mill
  - Processing capacity per day
  - Years established
  - Major grain type processed
  - Number of sorting machines
  - Annual maintenance charges
- **Competitor Information**:
  - Competitor name
  - Machine name and capacity
  - Dealer/supplier details
  - Service quality rating
  - Upgrade/replacement interest
- **Customer Requirements**:
  - Requirement type
  - Price range
  - Model preferences
- **Site Verification**:
  - Physically visited checkbox
  - Photos taken checkbox
  - Client met in person checkbox
- **GPS Location**: Latitude and longitude with photo proof

### Report Features
- **Automatic Verification**: System checks if photo location matches assigned location
- **Suspicious Detection**: Flags reports with location mismatch (>100m)
- **CSV Export**: Download all reports in Excel-compatible format
- **Advanced Filtering**: Filter by verified, suspicious, first-time, or follow-up visits
- **Statistics Dashboard**: View total reports, verified count, suspicious count, etc.

## 🔄 How It Works

### 1. Admin Workflow
1. **Login** to admin dashboard
2. **Assign Locations** to salespersons:
   - Select salesperson
   - Choose date
   - Add multiple places with GPS coordinates
   - Set verification radius (default: 100m)
3. **Monitor Progress**:
   - View live locations of all salespersons on map
   - Track visit completion status
   - Review submitted visit reports
   - Export reports for analysis

### 2. Salesperson Workflow
1. **Login** to salesperson dashboard
2. **View Assignments**:
   - See all assigned locations for the day
   - View location details on interactive map
   - Navigate to assigned places
3. **Visit Location**:
   - Arrive at assigned location
   - Fill out comprehensive visit report form
   - Take photo proof
   - Submit with GPS coordinates
4. **GPS Verification** happens automatically:
   - Photo's GPS coordinates are compared with assigned location
   - If within radius (≤100m) → ✅ Verified
   - If outside radius (>100m) → ⚠️ Suspicious (flagged for admin review)

### 3. Data Flow
```
Admin Assigns → Salesperson Receives → Visits Location → 
Uploads Report + Photo → GPS Verification → Admin Reviews → 
Export Reports → Analysis
```

## Project Structure

```
sales-tracker/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── salesController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Salesperson.js
│   │   ├── Assignment.js
│   │   └── PhotoUpload.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── salesRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── calculateDistance.js
│   │   └── uploadToS3.js
│   ├── uploads/
│   ├── server.js
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── MapComponent.jsx
    │   │   └── PhotoUploadButton.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── VisitPage.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── AdminMapView.jsx
    │   │   ├── AssignLocation.jsx
    │   │   └── SalespersonTracking.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── api.js
    │   └── styles.css
    └── index.html
```

## 🔐 Security Features

### Authentication & Authorization
- **HTTP-only Cookies**: JWT tokens stored in secure, HTTP-only cookies (prevents XSS attacks)
- **Cookie Configuration**:
  - `httpOnly: true` - Prevents JavaScript access to cookies
  - `secure: true` - Only transmitted over HTTPS in production
  - `sameSite: 'none'` - Allows cross-domain cookies in production
  - `maxAge: 24h` - Token expires after 24 hours
- **Password Security**: Bcrypt hashing with salt rounds
- **Role-Based Access Control (RBAC)**: Separate permissions for Admin and Salesperson roles
- **Protected Routes**: Middleware authentication on all sensitive endpoints

### Input Validation & Sanitization
- **Email Validation**: Regex-based email format validation
- **Password Strength**: Minimum 8 characters required
- **MongoDB ObjectId Validation**: Prevents NoSQL injection attacks
- **Numeric Input Sanitization**: Safe parsing of numbers to prevent injection
- **String Sanitization**: Trimming and validation of string inputs

### API Security
- **Rate Limiting**: 100 requests per 15 minutes on authentication endpoints (prevents brute-force)
- **CORS Configuration**: Whitelist-based origin checking with credentials support
- **Security Headers**: Helmet middleware for setting secure HTTP headers
- **Request Body Limits**: 10MB maximum payload size
- **File Upload Security**:
  - Type restrictions: Only image files (jpeg, jpg, png, gif, webp)
  - Size limit: 5MB maximum per file
  - Secure filename generation: Timestamp + random number
  - Stored in dedicated uploads directory

### Data Protection
- **Environment Variables**: Sensitive data stored in .env files (not committed to git)
- **JWT Secret**: Strong secret key for token signing
- **Database Security**: MongoDB connection with authentication
- **Privilege Escalation Prevention**: Registration only creates salesperson accounts

### Production Security
- **HTTPS Enforcement**: Secure cookies only work over HTTPS
- **Cross-Origin Resource Sharing**: Properly configured for production domains
- **Error Handling**: No sensitive information leaked in error messages
- **Logging**: Request logging without exposing sensitive data

## 🌐 Environment Configuration

### Backend Environment Variables (.env)
```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/salestracker

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Environment Variables (.env.local)
```bash
# API URL
VITE_API_URL=http://localhost:3000  # Development
# VITE_API_URL=https://your-backend-domain.com  # Production
```

## 🚀 Deployment

### Backend Deployment (Render/Heroku)

1. **Set Environment Variables** in hosting dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI` (your MongoDB connection string)
   - `JWT_SECRET` (strong secret key)
   - `FRONTEND_URL` (your frontend domain)

2. **Build Command**: `npm install`
3. **Start Command**: `npm start` or `node server.js`
4. **Port**: Will use `process.env.PORT` or default 3000

### Frontend Deployment (Render/Netlify/Vercel)

1. **Set Environment Variable**:
   - `VITE_API_URL=https://your-backend-domain.com`

2. **Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Install Command: `npm install`

3. **Important**: After deployment, update backend's `FRONTEND_URL` to match your frontend domain

### Production Checklist
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured on both
- [ ] MongoDB allows connections from hosting IPs
- [ ] CORS configured with correct frontend URL
- [ ] HTTPS enabled (required for secure cookies)
- [ ] Test login flow end-to-end
- [ ] Verify cookie is set correctly
- [ ] Test all API endpoints
- [ ] Create admin user in database

## 📊 Database Models

### Salesperson Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['admin', 'salesperson']),
  currentLocation: { lat: Number, lng: Number },
  lastLocationUpdate: Date
}
```

### Assignment Model
```javascript
{
  salespersonId: ObjectId,
  date: Date,
  places: [{
    name: String,
    location: { lat: Number, lng: Number },
    radius: Number (default: 100),
    visited: Boolean
  }]
}
```

### PhotoUpload/VisitReport Model
```javascript
{
  salespersonId: ObjectId,
  assignmentId: ObjectId,
  placeId: ObjectId,
  photoUrl: String,
  location: { lat: Number, lng: Number },
  verified: Boolean,
  distance: Number,
  isSuspicious: Boolean,
  
  // Visit Report Fields
  visitDate: Date,
  timeIn: String,
  timeOut: String,
  typeOfVisit: String,
  millCompanyName: String,
  ownerContactPerson: String,
  mobileNumber: String,
  address: String,
  typeOfMill: String,
  processingCapacityPerDay: String,
  yearsEstablished: Number,
  majorGrainTypeProcessed: String,
  anyMachineInstalled: Boolean,
  numberOfSortingMachine: Number,
  annualMaintenanceCharges: String,
  
  competitorDetails: {
    competitorName: String,
    machineName: String,
    machineCapacity: String,
    dealerSupplierName: String,
    serviceQuality: String,
    upgradeReplacementInterest: String
  },
  
  customerRequirement: {
    requirementType: String,
    priceRange: String,
    model: String
  },
  
  siteVisited: {
    physicallyVisited: Boolean,
    photosTaken: Boolean,
    clientMetInPerson: Boolean
  }
}
```

## 🔧 Troubleshooting

### Common Issues

**1. Login redirects back to login page (Production)**
- **Cause**: Cookie `sameSite` policy blocking cross-domain cookies
- **Solution**: Backend uses `sameSite: 'none'` in production (already implemented)
- **Verify**: Check cookie in DevTools → Application → Cookies

**2. CORS Error**
- **Cause**: Frontend URL not in backend's allowed origins
- **Solution**: Add your frontend URL to `allowedOrigins` in `server.js`
- **Check**: Backend logs will show "Blocked by CORS: [url]"

**3. MongoDB Connection Failed**
- **Cause**: Wrong connection string or IP not whitelisted
- **Solution**: 
  - Verify `MONGODB_URI` in .env
  - MongoDB Atlas → Network Access → Add IP (0.0.0.0/0 for all)

**4. Images Not Loading**
- **Cause**: Incorrect path or CORS blocking images
- **Solution**: Helmet configured with `crossOriginResourcePolicy: 'cross-origin'`
- **Check**: Image URLs should be `${API_URL}/uploads/filename.jpg`

**5. Rate Limit Exceeded**
- **Cause**: Too many login attempts (>100 in 15 minutes)
- **Solution**: Wait 15 minutes or adjust rate limit in `authMiddleware.js`

## 📱 Browser Compatibility

- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Requirements**:
- JavaScript enabled
- Cookies enabled
- Geolocation permission (for GPS features)

## 🎯 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Photo verification with AI/ML
- [ ] Route optimization for salespersons
- [ ] Export reports to PDF format
- [ ] Mobile app version (React Native)
- [ ] Offline mode with sync
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] SMS/Email notifications
- [ ] Attendance tracking
- [ ] Performance metrics and KPIs

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For issues, questions, or feature requests, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: ✅ Production Ready
