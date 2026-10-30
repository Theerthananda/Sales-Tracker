const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const salesRoutes = require('./routes/salesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const visitReportRoutes = require('./routes/visitReportRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationCleanupService = require('./services/notificationCleanup');

dotenv.config(); // Load .env before anything that uses process.env

const app = express();

// Connect DB
// connectDB(); // Removed standalone call

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5000',
  'https://swansalespersonappfrontend.onrender.com'
];
app.set("trust proxy", 1);
// Add custom frontend URL from environment if provided
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (!origin) {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      // Only block in production if you need strict origin checking
      const isProduction = process.env.NODE_ENV === 'production';
      if (!isProduction) {
        callback(null, true);
      } else {
        // In production, you can still allow no-origin if needed for mobile apps
        // Change this to callback(new Error('Origin not allowed')) for strict checking
        callback(null, true);
      }
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow images from uploads
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/auth', authRoutes);
app.use('/salesperson', salesRoutes);
app.use('/admin', adminRoutes);
app.use('/visit-reports', visitReportRoutes);
app.use('/expenses', expenseRoutes);
app.use('/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Sales Tracker API is running' });
});

const PORT = process.env.PORT || 5000;
// Connect to DB before starting server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Start notification cleanup service
    notificationCleanupService.start();
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});
