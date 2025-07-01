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
const adminTimeSlotRoutes = require('./routes/adminTimeSlotRoutes');
const adminSlotRoutes = require('./routes/adminSlotRoutes'); // New admin slot routes
const patientSlotRoutes = require('./routes/patientSlotRoutes');
const patientAppointmentRoutes = require('./routes/patientAppointmentRoutes');
const patientAppointmentDeleteRoutes = require('./routes/patientAppointmentDeleteRoutes'); // New route for deleting patient appointments
const publicSlotRoutes = require('./routes/publicSlotRoutes');
const reportRoutes = require('./routes/reportRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const publicAdminRoutes = require('./routes/publicAdminRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminProfileRoutes = require('./routes/adminProfileRoutes');
const adminDeleteProfileRoutes = require('./routes/adminDeleteProfileRoutes');
const adminMeRoutes = require('./routes/adminMeRoutes');
const debugRoutes = require('./routes/debugRoutes'); // Added debug routes
const debugAuthRoutes = require('./routes/debugAuthRoutes'); // Added debug auth routes
const patientReportRoutes = require('./routes/patientReportRoutes'); // Added patient-specific report routes
const adminReportRoutes = require('./routes/adminReportRoutes'); // Added admin-specific report routes
const simpleReportRoutes = require('./routes/simpleReportRoutes'); // Added simplified report routes

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
app.use(express.static('public')); // Serve static files from 'public' directory
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Mount the auth router on /api/auth
// Public: OTP & session endpoints
app.use('/api/auth', authRoutes);

// Debug routes (for troubleshooting)
app.use('/api/debug', debugRoutes);

// Admin auth routes
app.use('/api/admin-auth', adminAuthRoutes);

// Public admin routes (no authentication required)
app.use('/api/public', publicAdminRoutes);

// Public slot routes (no authentication required)
app.use('/api/public', publicSlotRoutes);

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

// Admin user management routes (matching frontend expectations)
app.use('/api/admin/users', adminUserRoutes);  // Authentication handled inside the router

// Admin profile management routes
app.use('/api/admin/profiles', adminProfileRoutes);  // Authentication handled inside the router

// Admin delete profile route (matching frontend expectations)
app.use('/admin/profiles', adminDeleteProfileRoutes);  // Authentication handled inside the router

// Admin me endpoint (for self-management)
app.use('/api/admin/me', adminMeRoutes);  // Authentication handled inside the router

// Import the flexible auth middleware
const { flexAuthenticateJWT } = require('./middlewares/flexAuthMiddleware');

// Admin time slot management routes with flexible auth to support various frontend token storage patterns
app.use(
  '/api/admin/slots',
  flexAuthenticateJWT,
  authorize('ADMIN'),
  adminTimeSlotRoutes
);

// New admin slot management routes
app.use(
  '/api/admin/availability',
  flexAuthenticateJWT,
  authorize('ADMIN'),
  adminSlotRoutes
);

// TimeSlot routes - Admin can create, anyone can view
app.use(
  '/api/slots',
  authenticateJWT,
  timeSlotRoutes
);

// Old patient slot routes (commented out)
// app.use(
//   '/api/patient/slots',
//   authenticateJWT,
//   authorize('PATIENT'),
//   patientSlotRoutes
// );

// Old patient appointment routes (commented out)
// app.use(
//   '/api/patient/appointments',
//   authenticateJWT,
//   authorize('PATIENT'),
//   patientAppointmentRoutes
// );

// New patient slot routes with simplified two-endpoint approach
const patientSlotRoutes2 = require('./routes/patientSlotRoutes2');
app.use(
  '/api/patient/slots',
  authenticateJWT,
  authorize('PATIENT'),
  patientSlotRoutes2
);

// Appointment routes - Authenticated users only
app.use(
  '/api/appointments',
  authenticateJWT,
  appointmentRoutes
);

// Report routes - Authenticated users only with role-based access
app.use(
  '/api/reports',
  authenticateJWT,
  reportRoutes
);

// Patient-specific report routes
app.use(
  '/api/patients',
  authenticateJWT,
  patientReportRoutes
);

// Admin-specific report routes
app.use(  '/api/admin/reports',
  adminReportRoutes
);

// Simple report routes - For quick access to all reports
app.use(
  '/api/simplereports',
  simpleReportRoutes
);

// Feedback routes - Authenticated users only with role-based access
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

// Patient appointment deletion route - Public API with no authentication
// This is a special endpoint for deleting all appointments for a patient
app.use(
  '/api/patient-appointments',
  patientAppointmentDeleteRoutes
);

// Handle 404 errors - must be placed after all other routes
app.use('/api/*', (req, res) => {
  const message = `API endpoint not found: ${req.method} ${req.originalUrl}`;
  console.warn(message);

  res.status(404).json({
    error: {
      message: 'API endpoint not found',
      details: `The requested endpoint "${req.method} ${req.originalUrl}" does not exist`,
      code: 'ENDPOINT_NOT_FOUND'
    }
  });
});

// Global error handler
app.use(errorHandler.errorHandler);

// Handle uncaught exceptions to prevent server crash
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  // Log the error details
  try {
    const logger = require('./utils/logger');
    logger.error(`UNCAUGHT EXCEPTION: ${error.message}`, {
      stack: error.stack,
      name: error.name
    });
  } catch (logError) {
    console.error('Failed to log uncaught exception:', logError);
  }
  // Keep the process running in production, but in development we should crash
  if (process.env.NODE_ENV === 'development') {
    console.error('Terminating process due to uncaught exception in development mode');
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  // Log the rejection details
  try {
    const logger = require('./utils/logger');
    logger.error(`UNHANDLED REJECTION: ${reason}`, {
      stack: reason.stack,
      name: reason.name
    });
  } catch (logError) {
    console.error('Failed to log unhandled rejection:', logError);
  }
  // Keep the process running in production, but in development we should crash
  if (process.env.NODE_ENV === 'development') {
    console.error('Terminating process due to unhandled rejection in development mode');
    process.exit(1);
  }
});

// Export the configured app
module.exports = app;
