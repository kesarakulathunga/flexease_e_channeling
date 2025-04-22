import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Pages
import HomePage from '../pages/home/HomePage';
import VerifyEmail from '../pages/EmailVerification/VerifyEmail';
import ProfileSelection from '../pages/verify-details/ProfileSelection';
import PatientDetailsForm from '../pages/patient-details/PatientDetailsForm';

// Import Dashboard Layout and Pages
import DashboardLayout from '../pages/layouts/DashboardLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import MakeAppointment from '../pages/dashboard/MakeAppointment';
import UploadReport from '../pages/dashboard/UploadReport';
import ViewAppointments from '../pages/dashboard/ViewAppointments';
import EditProfile from '../pages/dashboard/EditProfile'; // Assuming this is the correct component for 'Edit Your Data'
import DeleteProfile from '../pages/dashboard/DeleteProfile';
import LogoutPage from '../pages/dashboard/LogoutPage';
// Import NotFound page if you have one

export default function AppRoutes() {
  // Fetch user name logic would go here, possibly using context
  const userName = "User"; // Placeholder

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/verify-email" element={<VerifyEmail />} /> {/* Renamed for clarity */}
      <Route path="/select-profile" element={<ProfileSelection />} /> {/* Renamed for clarity */}
      <Route path="/patient-details-form" element={<PatientDetailsForm />} /> {/* Renamed for clarity */}

      {/* Dashboard Routes (Protected potentially) */}
      <Route path="/dashboard" element={<DashboardLayout name={userName} />}>
        <Route index element={<Dashboard />} /> {/* Default dashboard page */}
        <Route path="make-appointment" element={<MakeAppointment />} />
        <Route path="upload-report" element={<UploadReport />} />
        <Route path="appointments" element={<ViewAppointments />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="delete-profile" element={<DeleteProfile />} />
        <Route path="logout" element={<LogoutPage />} />
        {/* Add other nested dashboard routes here */}
      </Route>

      {/* Catch-all or Not Found Route */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}
