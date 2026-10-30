# Sales Tracker API - Postman Testing Guide

Base URL: `http://localhost:3000`

---

## 📋 Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Salesperson Endpoints](#salesperson-endpoints)
3. [Admin Endpoints](#admin-endpoints)
4. [Visit Report Endpoints](#visit-report-endpoints)

---

## 🔐 Authentication Endpoints

### 1. Register New User

**POST** `/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "673123abc456def789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "salesperson"
  }
}
```

**Note:** All new users are created as 'salesperson' role for security.

---

### 2. Login

**POST** `/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "673123abc456def789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "salesperson"
  }
}
```

**Important:** 
- The token is also set as a cookie named `ctoken`
- Token expires in 24 hours
- Save the token for authenticated requests

---

## 👤 Salesperson Endpoints

### 3. Get Assignments

**GET** `/salesperson/:id/assignments`

**Headers:**
```
Cookie: ctoken=your_jwt_token_here
```

**URL Parameters:**
- `id` - Salesperson ID (MongoDB ObjectId)

**Example:**
```
GET http://localhost:3000/salesperson/673123abc456def789012345/assignments
```

**Response (200):**
```json
[
  {
    "_id": "673456def789abc012345678",
    "salespersonId": "673123abc456def789012345",
    "date": "2025-11-10T00:00:00.000Z",
    "places": [
      {
        "_id": "673789abc012def345678901",
        "name": "ABC Rice Mill",
        "address": "123 Main St, City",
        "lat": 28.7041,
        "lng": 77.1025,
        "visited": false,
        "photoUrl": null,
        "visitedAt": null,
        "verified": false
      }
    ],
    "createdAt": "2025-11-10T10:00:00.000Z",
    "updatedAt": "2025-11-10T10:00:00.000Z"
  }
]
```

---

### 4. Upload Photo / Submit Visit Report

**POST** `/salesperson/upload-photo`

**Headers:**
```
Cookie: ctoken=your_jwt_token_here
Content-Type: multipart/form-data
```

**Body (form-data):**
```
photo: [Select image file - jpeg, jpg, png, gif, webp, max 5MB]
assignmentId: 673456def789abc012345678
placeId: 673789abc012def345678901
lat: 28.7041
lng: 77.1025

// Visit Information
visitDate: 2025-11-10
timeIn: 10:00 AM
timeOut: 11:30 AM

// Company/Contact Details
millCompanyName: ABC Rice Mill
ownerContactPerson: Mr. Sharma
mobileNumber: 9876543210
address: 123 Main St, City, State
typeOfVisit: First Time

// Mill/Company/Farm Details
typeOfMill: Rice Mill
processingCapacityPerDay: 50 tons
yearsEstablished: 10
anyMachineInstalled: true
majorGrainTypeProcessed: Rice
numberOfSortingMachine: 2
annualMaintenanceCharges: 50000

// Competitor Details (Optional)
competitorName: XYZ Company
machineName: Model X200
machineCapacity: 40 tons/day
dealerSupplierName: ABC Dealers
serviceQuality: Good
upgradeReplacementInterest: High

// Customer Requirement (Optional)
requirementType: New Machine
priceRange: 5-10 Lakhs
model: Premium Series

// Site Visited
physicallyVisited: true
photosTaken: true
clientMetInPerson: true
```

**Response (200):**
```json
{
  "message": "Visit report submitted successfully",
  "distance": 45.5,
  "isSuspicious": false,
  "visitReport": {
    "_id": "673abc012def345678901234",
    "salespersonId": "673123abc456def789012345",
    "assignmentId": "673456def789abc012345678",
    "placeId": "673789abc012def345678901",
    "visitDate": "2025-11-10T00:00:00.000Z",
    "millCompanyName": "ABC Rice Mill",
    "distanceFromTarget": 45.5,
    "isSuspicious": false,
    "verified": true,
    "createdAt": "2025-11-10T11:30:00.000Z"
  }
}
```

**Note:** 
- Distance > 100 meters marks report as suspicious
- Only image files allowed (max 5MB)

---

### 5. Update Location

**POST** `/salesperson/update-location`

**Headers:**
```
Cookie: ctoken=your_jwt_token_here
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "lat": 28.7041,
  "lng": 77.1025
}
```

**Response (200):**
```json
{
  "message": "Location updated"
}
```

---

## 👨‍💼 Admin Endpoints

**Note:** All admin endpoints require admin role. Cookie must be from an admin user login.

### 6. Get Overview/Dashboard Stats

**GET** `/admin/overview`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
```

**Response (200):**
```json
{
  "totalSalespersons": 15,
  "totalAssignments": 45,
  "totalVisits": 120,
  "totalPlaces": 200,
  "suspiciousUploads": 3
}
```

---

### 7. Get Salesperson Tracking

**GET** `/admin/salesperson/:id/tracking`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
```

**URL Parameters:**
- `id` - Salesperson ID

**Example:**
```
GET http://localhost:3000/admin/salesperson/673123abc456def789012345/tracking
```

**Response (200):**
```json
{
  "salesperson": {
    "_id": "673123abc456def789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "salesperson",
    "currentLocation": {
      "lat": 28.7041,
      "lng": 77.1025
    },
    "lastActive": "2025-11-10T11:30:00.000Z"
  },
  "assignments": [
    {
      "_id": "673456def789abc012345678",
      "date": "2025-11-10T00:00:00.000Z",
      "places": [...]
    }
  ],
  "photos": [
    {
      "_id": "673abc012def345678901234",
      "photoUrl": "/uploads/1731234567890-image.jpg",
      "lat": 28.7041,
      "lng": 77.1025,
      "distanceFromTarget": 45.5,
      "isSuspicious": false,
      "timestamp": "2025-11-10T11:30:00.000Z"
    }
  ]
}
```

---

### 8. Assign Location to Salesperson

**POST** `/admin/assign-location`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "salespersonId": "673123abc456def789012345",
  "date": "2025-11-11",
  "places": [
    {
      "name": "ABC Rice Mill",
      "address": "123 Main St, City",
      "lat": 28.7041,
      "lng": 77.1025
    },
    {
      "name": "XYZ Grain Processing",
      "address": "456 Market Rd, Town",
      "lat": 28.7141,
      "lng": 77.1125
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Location assigned successfully",
  "assignment": {
    "_id": "673def456789abc012345678",
    "salespersonId": "673123abc456def789012345",
    "date": "2025-11-11T00:00:00.000Z",
    "places": [
      {
        "_id": "674abc123def456789012345",
        "name": "ABC Rice Mill",
        "address": "123 Main St, City",
        "lat": 28.7041,
        "lng": 77.1025,
        "visited": false
      },
      {
        "_id": "674def456abc789012345678",
        "name": "XYZ Grain Processing",
        "address": "456 Market Rd, Town",
        "lat": 28.7141,
        "lng": 77.1125,
        "visited": false
      }
    ]
  }
}
```

---

### 9. Get Live Locations of All Salespersons

**GET** `/admin/live-locations`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
```

**Response (200):**
```json
[
  {
    "_id": "673123abc456def789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "currentLocation": {
      "lat": 28.7041,
      "lng": 77.1025
    },
    "lastActive": "2025-11-10T11:30:00.000Z"
  },
  {
    "_id": "673456def789abc012345678",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "currentLocation": {
      "lat": 28.7141,
      "lng": 77.1125
    },
    "lastActive": "2025-11-10T11:25:00.000Z"
  }
]
```

---

### 10. Get All Salespersons

**GET** `/admin/salespersons`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
```

**Response (200):**
```json
[
  {
    "_id": "673123abc456def789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "currentLocation": {
      "lat": 28.7041,
      "lng": 77.1025
    },
    "lastActive": "2025-11-10T11:30:00.000Z"
  }
]
```

---

## 📊 Visit Report Endpoints

### 11. Get All Visit Reports (Admin Only)

**GET** `/visit-reports/all`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
```

**Response (200):**
```json
[
  {
    "_id": "673abc012def345678901234",
    "salespersonId": {
      "_id": "673123abc456def789012345",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "assignmentId": {
      "_id": "673456def789abc012345678",
      "date": "2025-11-10T00:00:00.000Z"
    },
    "visitDate": "2025-11-10T00:00:00.000Z",
    "timeIn": "10:00 AM",
    "timeOut": "11:30 AM",
    "millCompanyName": "ABC Rice Mill",
    "ownerContactPerson": "Mr. Sharma",
    "mobileNumber": "9876543210",
    "address": "123 Main St, City, State",
    "typeOfVisit": "First Time",
    "typeOfMill": "Rice Mill",
    "processingCapacityPerDay": "50 tons",
    "yearsEstablished": 10,
    "anyMachineInstalled": true,
    "majorGrainTypeProcessed": "Rice",
    "numberOfSortingMachine": 2,
    "annualMaintenanceCharges": "50000",
    "competitorDetails": {
      "competitorName": "XYZ Company",
      "machineName": "Model X200",
      "machineCapacity": "40 tons/day",
      "dealerSupplierName": "ABC Dealers",
      "serviceQuality": "Good",
      "upgradeReplacementInterest": "High"
    },
    "customerRequirement": {
      "requirementType": "New Machine",
      "priceRange": "5-10 Lakhs",
      "model": "Premium Series"
    },
    "siteVisited": {
      "physicallyVisited": true,
      "photosTaken": true,
      "clientMetInPerson": true
    },
    "photoUrl": "/uploads/1731234567890-image.jpg",
    "lat": 28.7041,
    "lng": 77.1025,
    "distanceFromTarget": 45.5,
    "isSuspicious": false,
    "verified": true,
    "createdAt": "2025-11-10T11:30:00.000Z",
    "updatedAt": "2025-11-10T11:30:00.000Z"
  }
]
```

---

### 12. Get Visit Reports by Salesperson (Admin Only)

**GET** `/visit-reports/salesperson/:salespersonId`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
```

**URL Parameters:**
- `salespersonId` - Salesperson ID

**Example:**
```
GET http://localhost:3000/visit-reports/salesperson/673123abc456def789012345
```

**Response:** Same as "Get All Visit Reports" but filtered by salesperson

---

### 13. Get Single Visit Report

**GET** `/visit-reports/:reportId`

**Headers:**
```
Cookie: ctoken=your_jwt_token_here
```

**URL Parameters:**
- `reportId` - Visit Report ID

**Example:**
```
GET http://localhost:3000/visit-reports/673abc012def345678901234
```

**Response (200):**
```json
{
  "_id": "673abc012def345678901234",
  "salespersonId": {
    "_id": "673123abc456def789012345",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "visitDate": "2025-11-10T00:00:00.000Z",
  "millCompanyName": "ABC Rice Mill",
  // ... full report details
}
```

---

### 14. Export Visit Reports to CSV (Admin Only)

**GET** `/visit-reports/export/csv`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
```

**Response:** CSV file download with all visit reports

---

### 15. Get Visit Report Statistics (Admin Only)

**GET** `/visit-reports/stats`

**Headers:**
```
Cookie: ctoken=admin_jwt_token_here
```

**Response (200):**
```json
{
  "totalReports": 120,
  "verifiedReports": 115,
  "suspiciousReports": 5,
  "firstTimeVisits": 80,
  "followUpVisits": 40,
  "reportsWithCompetitorInfo": 95
}
```

---

## 🔧 Postman Setup Instructions

### 1. Setting Up Authentication Cookie

After login/register:
1. Go to **Cookies** (below Send button)
2. You should see `ctoken` automatically set
3. Or manually add cookie: `ctoken=your_jwt_token`

### 2. Alternative: Using Authorization Header

If cookies don't work, you can use Bearer token:

**Headers:**
```
Authorization: Bearer your_jwt_token_here
```

But you'll need to modify `authMiddleware.js` to support this.

### 3. Testing File Upload

For `/salesperson/upload-photo`:
1. Select **Body** → **form-data**
2. For `photo` field: Change type to **File** and select image
3. Add all other fields as **Text** type

### 4. Creating an Admin User

Since registration only creates salesperson, you need to manually create admin in MongoDB:

**Option 1: Using MongoDB Compass/Shell**
```javascript
db.salespersons.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

**Option 2: Register first, then update in database**
1. Register: `POST /auth/register` with admin email
2. Update role in MongoDB to "admin"
3. Login again to get admin token

---

## ❌ Common Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid email format"
}
```

### 401 Unauthorized
```json
{
  "message": "No authentication token, access denied"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Admin only."
}
```

### 404 Not Found
```json
{
  "message": "Assignment not found"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests, please try again later."
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "error": "Error details here"
}
```

---

## 📝 Testing Workflow

### Complete Testing Flow:

1. **Register a salesperson**
   ```
   POST /auth/register
   ```

2. **Login to get token**
   ```
   POST /auth/login
   ```

3. **Create admin user** (manually in DB)

4. **Login as admin**
   ```
   POST /auth/login (with admin credentials)
   ```

5. **Assign locations to salesperson**
   ```
   POST /admin/assign-location
   ```

6. **Login as salesperson again**

7. **Get assignments**
   ```
   GET /salesperson/:id/assignments
   ```

8. **Update location**
   ```
   POST /salesperson/update-location
   ```

9. **Submit visit report with photo**
   ```
   POST /salesperson/upload-photo
   ```

10. **Login as admin**

11. **View all reports**
    ```
    GET /visit-reports/all
    ```

12. **Export to CSV**
    ```
    GET /visit-reports/export/csv
    ```

---

## 🎯 Quick Test Data

### Test Salesperson
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### Test Admin (create manually)
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

### Test Assignment
```json
{
  "salespersonId": "YOUR_SALESPERSON_ID",
  "date": "2025-11-11",
  "places": [
    {
      "name": "Test Mill",
      "address": "Test Address",
      "lat": 28.7041,
      "lng": 77.1025
    }
  ]
}
```

---

**Happy Testing! 🚀**
