import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

// Import Pages
import HomePage from '../pages/home/HomePage'; // Updated path
import VerifyEmail from '../pages/patient/EmailVerification/VerifyEmail';
import ProfileSelection from '../pages/patient/verify-details/ProfileSelection';
import PatientDetailsForm from '../pages/patient/patient-details/PatientDetailsForm';
import EditProfileEmail from '../pages/patient/dashboard/EditProfileEmail';
import ViewProfileCheck from '../pages/patient/verify-details/ViewProfileCheck';
import DebugApi from '../pages/debug/DebugApi'; // Debug page
import ApiDiagnostic from '../pages/debug/ApiDiagnostic'; // Added API Diagnostic tool

// Import Layouts and Sidebars
import DashboardLayout from '../pages/patient/layouts/DashboardLayout'; // Updated path
import PatientSidebar from '../components/Sidebar/Sidebar'; // Renamed for clarity

// Import Patient Dashboard Pages
import Dashboard from '../pages/patient/dashboard/Dashboard';
import MakeAppointment from '../pages/patient/dashboard/MakeAppointment';
import PaymentPage from '../pages/patient/dashboard/PaymentPage';
import UploadReport from '../pages/patient/dashboard/UploadReport';
import GenerateReports from '../pages/patient/dashboard/GenerateReports';
// import MedicalHistory from '../pages/patient/dashboard/MedicalHistory';
import EditProfile from '../pages/patient/dashboard/EditProfile';
import DeleteProfile from '../pages/patient/dashboard/DeleteProfile';
import LogoutPage from '../pages/patient/dashboard/LogoutPage';
import ReportFeedback from '../pages/patient/dashboard/ReportFeedback';
import AppointmentReceiptPage from '../pages/patient/dashboard/AppointmentReceiptPage';

// Import AdminRoutes component
import AdminRoutes from './AdminRoutes';

// Import NotFound page if you have one

export default function AppRoutes() {
  const { user, isAuthenticated, currentProfile } = useAuth();
  const userName = currentProfile?.name || user?.name || "User";

  return (
    <Routes>      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/select-profile" element={<ProfileSelection />} />
      <Route path="/patient-details-form" element={<PatientDetailsForm />} />
      <Route path="/view-profile" element={<ViewProfileCheck />} />
      <Route path="/debug" element={<DebugApi />} /> {/* Added Debug Route */}

      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* Protected Patient Routes */}
      <Route element={<ProtectedRoute requiredRole="PATIENT" />}>
        <Route
          path="/dashboard"
          element={<DashboardLayout name={userName} SidebarComponent={PatientSidebar} />}        >
          <Route index element={<Dashboard />} />          <Route path="make-appointment" element={<MakeAppointment />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="upload-report" element={<UploadReport />} />
          <Route path="generate-reports" element={<GenerateReports />} />
          {/* <Route path="medical-history" element={<MedicalHistory />} /> */}
          <Route path="edit-profile" element={<EditProfile />} /><Route path="edit-profile-email" element={<EditProfileEmail />} />
          <Route path="delete-profile" element={<DeleteProfile />} />
          <Route path="logout" element={<LogoutPage />} />
        </Route>
        {/* Route for individual report feedback - outside of dashboard layout */}
        <Route path="/reports/:reportId/feedback" element={<ReportFeedback />} />
        {/* Route for appointment receipt - outside of dashboard layout */}
        <Route path="/appointment-receipt" element={<AppointmentReceiptPage />} />
      </Route>

      {/* Catch-all or Not Found Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}