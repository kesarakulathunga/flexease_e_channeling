// src/app.js
const express    = require('express');
const cors       = require('cors');

// Import from restructured modules
const { authRoutes } = require('./auth');
const { patientRoutes, adminRoutes } = require('./users');
const { createPatientWithAuth } = require('./users/patientController');

// Import other routes
const appointmentRoutes = require('./routes/appointmentRoutes');
const timeSlotRoutes = require('./routes/timeSlotRoutes');
const reportRoutes = require('./routes/reportRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Import middlewares
const { authenticateJWT } = require('./middlewares/authMiddleware');
const { authorize }       = require('./middlewares/roleMiddleware');
const errorHandler       = require('./middlewares/errorHandler');

const app = express();

// Global middleware
app.use(cors({
  origin: '*', // Or specify your frontend URL like 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Mount the auth router on /api/auth
// Public: OTP & session endpoints
app.use('/api/auth', authRoutes);

// Public patient registration endpoint
app.post('/api/patients/register-verified', createPatientWithAuth);

// Protected: Patients only
app.use(
  '/api/patients',
  authenticateJWT,
  authorize('PATIENT'),
  patientRoutes
);

// Protected: Admins only
app.use(
  '/api/admins',
  authenticateJWT,
  authorize('ADMIN'),
  adminRoutes
);

// TimeSlot routes - Admin can create, anyone can view
app.use(
  '/api/slots',
  authenticateJWT,
  timeSlotRoutes
);

// Appointment routes - Authenticated users only
app.use(
  '/api/appointments',
  authenticateJWT,
  appointmentRoutes
);

// Report routes - Authenticated users only
app.use(
  '/api/reports',
  authenticateJWT,
  reportRoutes
);

// Feedback routes - Authenticated users only
app.use(
  '/api/feedback',
  authenticateJWT,
  feedbackRoutes
);

// Profile routes - Authenticated users only
app.use(
  '/api/profile',
  profileRoutes  // Authentication is handled within the router
);

// Global error handler
app.use(errorHandler.errorHandler);

// Export the configured app
module.exports = app;
