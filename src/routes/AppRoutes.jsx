import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Pages
import HomePage from '../pages/home/HomePage';
import VerifyEmail from '../pages/EmailVerification/VerifyEmail';
import ProfileSelection from '../pages/verify-details/ProfileSelection';
import PatientDetailsForm from '../pages/patient-details/PatientDetailsForm';

// Import Layouts and Sidebars
import DashboardLayout from '../pages/layouts/DashboardLayout';
import PatientSidebar from '../components/Sidebar/Sidebar'; // Renamed for clarity

// Import Patient Dashboard Pages
import Dashboard from '../pages/PatientDashboard/Dashboard';
import MakeAppointment from '../pages/PatientDashboard/MakeAppointment';
import UploadReport from '../pages/PatientDashboard/UploadReport';
import ViewAppointments from '../pages/PatientDashboard/ViewAppointments';
import EditProfile from '../pages/PatientDashboard/EditProfile';
import DeleteProfile from '../pages/PatientDashboard/DeleteProfile';
import LogoutPage from '../pages/PatientDashboard/LogoutPage';

// Import NotFound page if you have one

export default function AppRoutes() {
  // Fetch user name logic would go here, possibly using context
  const userName = "User"; // Placeholder

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/select-profile" element={<ProfileSelection />} />
      <Route path="/patient-details-form" element={<PatientDetailsForm />} />

      {/* Patient Dashboard Routes */}
      <Route 
        path="/dashboard" 
        element={<DashboardLayout name={userName} SidebarComponent={PatientSidebar} />}
      >
        <Route index element={<Dashboard />} />
        <Route path="make-appointment" element={<MakeAppointment />} />
        <Route path="upload-report" element={<UploadReport />} />
        <Route path="appointments" element={<ViewAppointments />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="delete-profile" element={<DeleteProfile />} />
        <Route path="logout" element={<LogoutPage />} />
      </Route>

      {/* Catch-all or Not Found Route */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}
